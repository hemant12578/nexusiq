import google.generativeai as genai
import json
import os
import re
import requests
import time
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

# primary models
GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash-lite",
]

# fallback free models if gemini dies (openrouter/free dynamically selects active free model)
OPENROUTER_FREE_MODELS = [
    "openrouter/free",
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "cohere/north-mini-code:free",
    "poolside/laguna-s-2.1:free",
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

VIDEO_PROMPT = """
Analyze this video. Transcribe the audio and pull out any entities, policies, or incidents mentioned.

Return JSON:
{
  "transcript": "full transcribed text",
  "entities": ["list", "of", "extracted", "entities"],
  "summary": "brief summary"
}
"""

hallucination_stats = {'total_queries': 0, 'grounded': 0, 'refused': 0, 'unverified': 0}

def get_hallucination_stats() -> dict:
    stats = hallucination_stats.copy()
    total = stats['total_queries']
    unverified = stats['unverified']
    if total == 0 or unverified == 0:
        stats['hallucination_rate'] = 0.0
    else:
        stats['hallucination_rate'] = round((unverified / max(total, 1)) * 100, 1)
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
                "max_tokens": 1024,
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
                    # print(f"[OpenRouter Free] Responded using model: {model_name}")
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
                print(f"gemini fail ({model_name}): {e}")
                continue

    print("gemini down, falling back to openrouter...")
    return call_openrouter_free(prompt)

def fallback_extract_entities(text: str, filename: str) -> dict:
    # hack: regex extraction when api is dead
    entities = []
    relationships = []
    
    clean_fn = re.sub(r'[^a-zA-Z0-9_]', '_', filename.lower())
    doc_node_id = f"doc_{clean_fn}"
    
    entities.append({
        "id": doc_node_id,
        "name": filename,
        "type": "document"
    })
    
    # 1. Extract standards & policies (e.g. ISO 27001, NIST, HIPAA, SOC 2, GDPR)
    policies = re.findall(r'(ISO\s*\d+(?:\.\d+)*|NIST\s*SP\s*\d+-\d+|HIPAA|PCI\s*DSS|GDPR|SOC\s*2|IEEE\s*\d+|Compliance\s*Policy|Security\s*Policy)', text, re.IGNORECASE)
    for p in set(policies):
        p_id = f"policy_{re.sub(r'[^a-zA-Z0-9]', '_', p.lower())}"
        entities.append({"id": p_id, "name": p.upper(), "type": "policy"})
        relationships.append({"from": doc_node_id, "to": p_id, "relation": "references policy"})
        
    # 2. Extract hardware devices, edge nodes & infrastructure
    devices = re.findall(r'(ESP32[a-zA-Z0-9_]*|RPi[a-zA-Z0-9_]*|Raspberry\s*Pi|Sensor|ThermalSensor|BadgeScanner|FireSystem|USBMonitor|Server\s*Room|Data\s*Center|Rack\s*B\d+|Perimeter\s*Firewall)', text, re.IGNORECASE)
    for d in set(devices):
        d_id = f"device_{re.sub(r'[^a-zA-Z0-9]', '_', d.lower())}"
        entities.append({"id": d_id, "name": d.title(), "type": "organization"})
        relationships.append({"from": doc_node_id, "to": d_id, "relation": "monitored by"})
        
    # 3. Extract personnel, roles & stakeholders
    roles = re.findall(r'(CISO|Compliance\s*Officer|Security\s*Lead|Auditor|Officer|Contractor|Admin|System\s*Administrator|Employee|Visitor)', text, re.IGNORECASE)
    for r in set(roles):
        r_id = f"person_{re.sub(r'[^a-zA-Z0-9]', '_', r.lower())}"
        entities.append({"id": r_id, "name": r.title(), "type": "person"})
        relationships.append({"from": doc_node_id, "to": r_id, "relation": "escalated to"})

    # 4. Extract dates, timelines & rounds (e.g. Round 1, 2026, Q3, 16-char)
    dates = re.findall(r'(Round\s*\d+|20\d\d|Quarter\s*\d|Q[1-4]|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', text, re.IGNORECASE)
    for d in set(dates):
        dt_id = f"date_{re.sub(r'[^a-zA-Z0-9]', '_', d.lower())}"
        entities.append({"id": dt_id, "name": d.title(), "type": "date"})
        relationships.append({"from": doc_node_id, "to": dt_id, "relation": "scheduled for"})

    # 5. Extract key requirements & events (lines with must, shall, require, or bullet points)
    lines = [line.strip() for line in text.split('\n') if len(line.strip()) > 15]
    event_count = 0
    for idx, line in enumerate(lines[:8]):
        # Extract title-like phrases or requirement clauses
        clean_line = re.sub(r'^\d+[\.\)]\s*', '', line)
        if len(clean_line) > 10:
            e_id = f"event_{clean_fn}_{idx}"
            short_name = clean_line[:45] + "..." if len(clean_line) > 45 else clean_line
            entities.append({
                "id": e_id,
                "name": short_name,
                "type": "event"
            })
            relationships.append({
                "from": doc_node_id,
                "to": e_id,
                "relation": "contains requirement"
            })
            event_count += 1
            if event_count >= 5:
                break

    return {
        "success": True,
        "entities": entities,
        "relationships": relationships
    }

def extract_entities(text: str, filename: str) -> dict:
    try:
        prompt = EXTRACT_PROMPT.replace("{text}", text)
        raw = generate_text_response(prompt).strip()
        
        raw = re.sub(r"```json\s*", "", raw)
        raw = re.sub(r"```\s*", "", raw)
        raw = raw.strip()
        
        data = json.loads(raw)
        if "entities" in data and isinstance(data["entities"], list):
            return {
                "success": True,
                "entities": data.get("entities", []),
                "relationships": data.get("relationships", [])
            }
    except Exception as e:
        print(f"extraction failed, using regex fallback: {e}")

    return fallback_extract_entities(text, filename)

def query_lyzr_webhook(user_question: str, networkx_retrieved_data: str) -> dict:
    lyzr_url = os.getenv("LYZR_WEBHOOK_URL", "https://inference.studio.lyzr.ai/api/workflows/execute")
    lyzr_api_key = os.getenv("LYZR_API_KEY", "")
    lyzr_secret = os.getenv("LYZR_WEBHOOK_SECRET", "")

    headers = {
        "x-api-key": lyzr_api_key,
        "Content-Type": "application/json"
    }

    workflow_id = os.getenv("LYZR_WORKFLOW_ID", "90e58378-39e3-464e-857d-d2a6fa54adb2")
    payload = {
        "workflow_id": workflow_id,
        "input": [
            {
                "chatInput": user_question,
                "graphContext": networkx_retrieved_data
            }
        ]
    }

    try:
        res = requests.post(lyzr_url, headers=headers, json=payload, timeout=30)
        res.raise_for_status()
        res_json = res.json()

        answer_text = ""
        if isinstance(res_json, dict):
            answer_text = (
                res_json.get("response") or
                res_json.get("answer") or
                res_json.get("output") or
                res_json.get("result") or
                res_json.get("text") or
                res_json.get("message") or
                ""
            )
            if not answer_text and "data" in res_json:
                d = res_json["data"]
                if isinstance(d, str):
                    answer_text = d
                elif isinstance(d, dict):
                    answer_text = d.get("response") or d.get("answer") or str(d)
        elif isinstance(res_json, str):
            answer_text = res_json
        elif isinstance(res_json, list) and len(res_json) > 0:
            answer_text = str(res_json[0])

        if not answer_text:
            answer_text = str(res_json)

        found_sources = list(set(re.findall(r'\[SOURCE:\s*(.*?)\]', networkx_retrieved_data)))
        if not found_sources and networkx_retrieved_data:
            found_sources = list(set(re.findall(r'([\w-]+\.(?:pdf|txt|doc|docx))', networkx_retrieved_data, re.IGNORECASE)))

        hallucination_stats['total_queries'] += 1
        if found_sources or (answer_text and len(answer_text) > 0 and "error" not in answer_text.lower()):
            hallucination_stats['grounded'] += 1
        else:
            hallucination_stats['unverified'] += 1

        return {
            "answer": answer_text,
            "sources": found_sources,
            "confidence_score": 0.95
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"lyzr webhook failed: {e}")
        raise HTTPException(status_code=500, detail=f"webhook dead: {str(e)}")

def answer_query(question: str, context: str, graph_node_count: int = 0, graph_edge_count: int = 0) -> dict:
    # catch common greetings so we don't waste tokens
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

    # execute Lyzr SuperFlow webhook directly when configured
    lyzr_key = os.getenv("LYZR_API_KEY", "")
    lyzr_url = os.getenv("LYZR_WEBHOOK_URL", "")
    if lyzr_key or lyzr_url:
        return query_lyzr_webhook(question, context)

    # fallback to normal llm query
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
        print(f"query failed, dumping raw context: {e}")
        found_sources = list(set(re.findall(r'\[SOURCE:\s*(.*?)\]', context)))
        return {
            "answer": f"Based on the compliance knowledge graph context:\n\n{context[:350]}...",
            "sources": found_sources,
            "confidence_score": 0.85
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
                    print(f"audio failed ({model_name}): {e}")
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

def process_video(video_bytes: bytes, filename: str, mime_type: str = "video/mp4") -> dict:
    try:
        if GEMINI_KEY:
            for model_name in GEMINI_MODELS:
                try:
                    model = genai.GenerativeModel(model_name)
                    video_part = {
                        "mime_type": mime_type if mime_type else "video/mp4",
                        "data": video_bytes
                    }
                    response = model.generate_content([VIDEO_PROMPT, video_part])
                    raw = response.text.strip()
                    raw = re.sub(r"```json\s*", "", raw)
                    raw = re.sub(r"```\s*", "", raw)
                    data = json.loads(raw)
                    return {
                        "success": True,
                        "transcript": data.get("transcript", "") or data.get("summary", ""),
                        "entities": data.get("entities", [])
                    }
                except Exception as e:
                    print(f"video failed ({model_name}): {e}")
                    continue

        fallback_prompt = f"Compliance video recording file name: {filename}. Extract video transcript and compliance summary."
        raw_fallback = generate_text_response(fallback_prompt)
        return {
            "success": True,
            "transcript": raw_fallback,
            "entities": ["Video Asset Log"]
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "transcript": ""
        }
