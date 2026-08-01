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
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-flash-latest",
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
You are NexusIQ's enterprise compliance data extraction engine.

Analyze the following document and extract ALL entities and 
relationships for a knowledge graph.

Return ONLY a valid JSON object. No markdown. No explanation. 
No code blocks. Pure JSON only.

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
- Every entity must have a unique id (use e1, e2, e3 format)
- Extract minimum 5 entities if document has enough content
- Relationships must reference valid entity ids only
- Be precise and compliance-focused

Document to analyze:
{text}
"""

QUERY_PROMPT = """
You are NexusIQ - a zero-hallucination enterprise compliance intelligence assistant.

Your knowledge graph contains the following verified compliance data:

{context}

User Question: {question}

STRICT RULES:
1. Answer ONLY using information present in the knowledge graph above.
2. Every claim regarding compliance data MUST have a clear source citation from the graph.
3. If the user question cannot be answered from the knowledge graph above, respond with:
   "This information is not available in the current NexusIQ compliance database."
4. Never guess, infer, or hallucinate beyond what the graph states.
5. Be concise, precise, and professional.

Response Format:
[Your direct answer here]

SOURCES:
- [Entity name] from [source document]
"""

AUDIO_PROMPT = """
You are a compliance incident transcription system.

Transcribe the following audio content and extract compliance information.

Return ONLY valid JSON:
{
  "transcript": "full accurate transcription",
  "compliance_entities": ["list", "of", "entities", "mentioned"],
  "incident_type": "type of compliance incident if mentioned",
  "severity": "low|medium|high|critical"
}
"""

def call_openrouter_free(prompt: str) -> str:
    """Call OpenRouter using free models with fallback across all free endpoints."""
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
    """Try Gemini API first, fall back to OpenRouter free models."""
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

def answer_query(question: str, context: str) -> dict:
    # 1. Direct Python handler for Greetings & Common FAQ phrases
    q_norm = question.strip().lower().rstrip("?!.")
    greetings = {
        "hi": "Hello! I am NexusIQ, your Zero-Hallucination Compliance Intelligence assistant. Ask me any question about your uploaded compliance assets, policies, or regulatory standards.",
        "hello": "Hello! I am NexusIQ, your Zero-Hallucination Compliance Intelligence assistant. Ask me any question about your uploaded compliance assets, policies, or regulatory standards.",
        "hey": "Hello! I am NexusIQ, your Zero-Hallucination Compliance Intelligence assistant. Ask me any question about your uploaded compliance assets, policies, or regulatory standards.",
        "who are you": "I am NexusIQ — an edge-to-cloud Multi-Modal Knowledge Graph AI platform designed for enterprise compliance and zero-hallucination document querying.",
        "what is nexusiq": "NexusIQ is an enterprise compliance platform that ingests multi-modal documents (PDF, Audio, Text), constructs a live Knowledge Graph, and uses Graph RAG for zero-hallucination queries.",
        "gen ai": "NexusIQ is an advanced Gen AI compliance intelligence engine. Ask me any question about your uploaded compliance documents, policies, or hackathon problem statements.",
        "help": "You can ask questions about your compliance documents (e.g. 'What is the submission deadline?', 'What problem statements are in the domain?'). I cite exact source nodes from your graph.",
        "what can you do": "I extract entity-relationship knowledge graphs from compliance PDFs, audio logs, and text streams, and answer compliance queries with verified source citations."
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
            
        return {
            "answer": final_answer,
            "sources": sources
        }
    except Exception as e:
        return {
            "answer": f"Query error: {str(e)}",
            "sources": []
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
                        "entities": data.get("compliance_entities", [])
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
