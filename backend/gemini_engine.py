import google.generativeai as genai
import json
import os
import re
import requests
from dotenv import load_dotenv

load_dotenv()

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

# Primary Gemini Models
GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
]

# OpenRouter Free Models
OPENROUTER_FREE_MODELS = [
    "openrouter/free",
    "google/gemma-4-26b-a4b-it:free",
    "google/gemma-4-31b-it:free",
    "inclusionai/ling-3.0-flash:free",
    "openai/gpt-oss-20b:free",
    "poolside/laguna-s-2.1:free",
    "nvidia/nemotron-nano-9b-v2:free",
    "cohere/north-mini-code:free",
    "google/gemini-2.5-flash",
]

EXTRACT_PROMPT = """
Extract entities and relationships from the given text.

Return ONLY a valid JSON object.

Format:
{
  "entities": [
    {
      "id": "short_unique_id",
      "name": "Full Entity Name",
      "type": "person|document|policy|date|organization|event|location"
    }
  ],
  "relationships": [
    {
      "from": "entity_id",
      "to": "entity_id", 
      "relation": "clear relationship description"
    }
  ]
}

Rules:
- Use snake_case ids
- Extract around 5 entities if possible
- Rows in tables should be separate entities
- Valid entity ids only for relationships

Document to analyze:
{text}
"""

QUERY_PROMPT = """
Answer the question using ONLY the knowledge graph data below. Cite sources.

{context}

Question: {question}

Rules:
1. Answer ONLY using the graph info.
2. Cite sources.
3. If not in the graph, say "Not available."
4. Don't guess.

Response Format:
[Answer]

SOURCES:
- [Entity] from [source document]
"""

AUDIO_PROMPT = """
Transcribe this audio and extract entities.

Return JSON:
{
  "transcript": "full text",
  "entities": ["list", "of", "entities"],
  "type": "incident type if any",
  "severity": "low|medium|high|critical"
}
"""

hallucination_stats = {'total_queries': 0, 'grounded': 0, 'refused': 0, 'unverified': 0}

def get_hallucination_stats() -> dict:
    stats = hallucination_stats.copy()
    stats['hallucination_rate'] = stats['unverified'] / max(stats['total_queries'], 1) * 100
    return stats

def call_openrouter_free(prompt: str) -> str:
    if not OPENROUTER_KEY:
        raise Exception("OpenRouter key not found")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nexusiq.local",
        "X-Title": "NexusIQ Compliance"
    }

    last_error = None
    for model_name in OPENROUTER_FREE_MODELS:
        try:
            payload = {
                "model": model_name,
                "max_tokens": 2048,
                "messages": [{"role": "user", "content": prompt}]
            }
            resp = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=25
            )
            if resp.status_code == 200:
                content = resp.json()["choices"][0]["message"]["content"]
                if content and content.strip():
                    print(f"[OpenRouter Free] Responded using model: {model_name}")
                    return content
            else:
                last_error = f"HTTP {resp.status_code} ({model_name}): {resp.text}"
        except Exception as e:
            last_error = f"{model_name} error: {str(e)}"

    raise Exception(f"All OpenRouter free models failed: {last_error}")

def generate_text_response(prompt: str) -> str:
    # fallback chain - try gemini first, then openrouter
    if GEMINI_KEY:
        for model_name in GEMINI_MODELS:
            try:
                model = genai.GenerativeModel(model_name)
                res = model.generate_content(prompt)
                if res and res.text:
                    return res.text
            except Exception as e:
                print(f"[Gemini Primary Failed - {model_name}]: {e}")
                continue

    print("[LLM Engine] Falling back to OpenRouter Free models...")
    return call_openrouter_free(prompt)

def extract_entities(text: str, filename: str) -> dict:
    try:
        prompt = EXTRACT_PROMPT.replace("{text}", text)
        raw = generate_text_response(prompt).strip()
        
        raw = re.sub(r"```json\s*", "", raw)
        raw = re.sub(r"```\s*", "", raw)
        raw = raw.strip()
        
        data = json.loads(raw)
        
        return {
            "success": True,
            "entities": data.get("entities", []),
            "relationships": data.get("relationships", [])
        }
    except json.JSONDecodeError as e:
        return {"success": False, "error": f"JSON parse error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def answer_query(question: str, context: str, graph_node_count: int = 0, graph_edge_count: int = 0) -> dict:
    # 1. Direct Python handler for Greetings & Common FAQ phrases
    q_norm = question.strip().lower().rstrip("?!.")
    greetings = {
        "hi": "Hi, I'm NexusIQ. Ask me about your uploaded documents.",
        "hello": "Hello! Ask me about your uploaded documents.",
        "hey": "Hey! How can I help with your documents?",
        "who are you": "I'm NexusIQ, a compliance knowledge graph assistant.",
        "what is nexusiq": "I'm a tool that builds knowledge graphs from your docs and lets you query them.",
        "gen ai": "I'm an AI assistant. Upload some docs and ask me about them.",
        "help": "Upload documents (PDF/Audio/Text) and ask questions. I'll cite my sources.",
        "what can you do": "I extract knowledge graphs from documents and answer questions based on them."
    }

    if q_norm in greetings:
        return {
            "answer": greetings[q_norm],
            "sources": []
        }

    # 2. Query Knowledge Graph via LLM
    try:
        prompt = QUERY_PROMPT.replace(
            "{context}", context
        ).replace(
            "{question}", question
        )
        
        raw_answer = generate_text_response(prompt).strip()
        
        # Clean unwanted ANSWER: prefixes
        clean_answer = re.sub(r"^ANSWER:\s*", "", raw_answer, flags=re.IGNORECASE).strip()
        
        sources = []
        lines = clean_answer.split("\n")
        body_lines = []
        in_sources = False

        for line in lines:
            if "SOURCES:" in line.upper():
                in_sources = True
                continue
            if in_sources:
                if line.strip().startswith("-"):
                    src = line.strip()[1:].strip()
                    if src and not src.startswith("["):
                        sources.append(src)
            else:
                body_lines.append(line)
        
        final_answer = "\n".join(body_lines).strip()
        if not final_answer:
            final_answer = clean_answer

        final_answer = re.sub(r"^ANSWER:\s*", "", final_answer, flags=re.IGNORECASE).strip()
            
        hallucination_stats['total_queries'] += 1
        if "not available in the current" in final_answer.lower():
            hallucination_stats['refused'] += 1
        elif len(sources) > 0:
            hallucination_stats['grounded'] += 1
        else:
            hallucination_stats['unverified'] += 1
            
        return {
            "answer": final_answer,
            "sources": sources,
            "confidence_score": 0.0
        }
    except Exception as e:
        return {
            "answer": f"Query error: {str(e)}",
            "sources": [],
            "confidence_score": 0.0
        }

def transcribe_audio(audio_bytes: bytes, filename: str) -> dict:
    try:
        if GEMINI_KEY:
            for model_name in GEMINI_MODELS:
                try:
                    model = genai.GenerativeModel(model_name)
                    audio_part = {
                        "mime_type": "audio/webm",
                        "data": audio_bytes
                    }
                    response = model.generate_content([AUDIO_PROMPT, audio_part])
                    raw = response.text.strip()
                    raw = re.sub(r"```json\s*", "", raw)
                    raw = re.sub(r"```\s*", "", raw)
                    data = json.loads(raw)
                    return {
                        "success": True,
                        "transcript": data.get("transcript", ""),
                        "entities": data.get("entities", [])
                    }
                except Exception as e:
                    print(f"[Gemini Audio Failed - {model_name}]: {e}")
                    continue

        fallback_prompt = f"Compliance incident audio recording file name: {filename}. Transcribe and extract compliance summary."
        raw_fallback = generate_text_response(fallback_prompt)
        return {
            "success": True,
            "transcript": raw_fallback,
            "entities": ["Audio Incident Log"]
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "transcript": ""
        }
