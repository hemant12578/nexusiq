# NexusIQ — Complete Technical Documentation

### Zero-Hallucination Compliance Intelligence Platform
**Version 2.0 | InnovaHack 2026 · Domain 3: Gen AI · Team Nexus**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Backend API Reference](#3-backend-api-reference)
4. [AI & LLM Engine](#4-ai--llm-engine)
5. [Knowledge Graph Engine](#5-knowledge-graph-engine)
6. [Frontend Application](#6-frontend-application)
7. [IoT Edge Pipeline](#7-iot-edge-pipeline)
8. [Authentication & Payments](#8-authentication--payments)
9. [Database & Persistence](#9-database--persistence)
10. [Deployment & Infrastructure](#10-deployment--infrastructure)
11. [Security Model](#11-security-model)
12. [Design System](#12-design-system)
13. [Complete File Reference](#13-complete-file-reference)
14. [Environment Variables](#14-environment-variables)
15. [Dependencies](#15-dependencies)

---

## 1. Executive Summary

NexusIQ is an enterprise-grade, AI-powered compliance intelligence platform that transforms unstructured regulatory documents — PDFs, audio logs, video recordings, and raw text — into a live, queryable **Knowledge Graph**. Unlike traditional vector-only RAG systems that chunk text blindly and produce hallucinated answers, NexusIQ maintains **explicit entity relationships** using a directed graph architecture, ensuring every answer is:

- **Grounded** in verified graph paths
- **Cited** with exact source document references
- **Traceable** through the entity relationship chain
- **Hallucination-resistant** via strict refusal mechanisms

### Core Pipeline

```
Multi-Modal Input → Gemini AI Extraction → NetworkX Knowledge Graph → Graph RAG Retrieval → Lyzr SuperFlow Orchestration → Cited & Verified Answer
```

### Key Metrics

| Metric | Value |
|--------|-------|
| Total Features | 31+ |
| AI Models in Fallback Chain | 4 (Lyzr → Gemini → OpenRouter → Regex) |
| Input Formats Supported | 4 (PDF, Audio, Video, Text) |
| Compliance Frameworks | 7 (ISO 27001, GDPR, HIPAA, SOC 2, PCI-DSS, NIST CSF, EU AI Act) |
| IoT Sensors | 3 (DHT11, Relay Module, GPIO LED) |
| API Endpoints | 18 |
| Frontend Components | 22 |
| Real-time Features | SSE Live Feed, Edge Sync, Animated Stats |

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                             │
│  React 18 + Vite + TailwindCSS                                  │
│  ├── D3.js Force-Directed Knowledge Graph (2D)                  │
│  ├── Three.js Particle Constellation (3D Background)            │
│  ├── Firebase Auth (Google OAuth + Email/Password)              │
│  ├── Razorpay Standard Checkout                                 │
│  └── SSE Real-Time Event Feed                                   │
├─────────────────────────────────────────────────────────────────┤
│                    BACKEND (Railway)                             │
│  FastAPI + Python 3.9+                                          │
│  ├── Gemini Engine (Entity Extraction + Query Answering)        │
│  ├── Graph Engine (NetworkX DiGraph + PageRank + BFS)           │
│  ├── Lyzr AI SuperFlow Webhook (Agentic Orchestration)          │
│  ├── Razorpay SDK (Payment Orders + HMAC Verification)          │
│  └── SlowAPI Rate Limiter (30 req/min)                          │
├─────────────────────────────────────────────────────────────────┤
│                    AI LAYER                                      │
│  Lyzr AI SuperFlow → Google Gemini 2.5 Flash                    │
│  → OpenRouter Free Models (10+ fallbacks)                       │
│  → Local Regex Extractor (Zero-Fail Offline)                    │
├─────────────────────────────────────────────────────────────────┤
│                    PERSISTENCE                                   │
│  Supabase PostgreSQL (Managed) ←→ Local JSON (Fallback)         │
│  Firebase Firestore (Users, Subscriptions, Audit Logs)          │
├─────────────────────────────────────────────────────────────────┤
│                    IOT EDGE LAYER                                │
│  ESP32 + DHT11 Sensor → Raspberry Pi Gateway → Cloud Backend    │
│  GPIO Relay Control | Offline Queue | Thermal Compliance        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Backend API Reference

**Base URL:** `https://nexusiq-backend-production.up.railway.app`
**Interactive Docs:** `{BASE_URL}/docs` (Swagger UI)

### 3.1 Health & Status

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/` | Root health check | `{ name, status, version }` |
| `GET` | `/health` | Uptime status | `{ status, uptime }` |
| `GET` | `/stats` | Platform statistics | `{ total_nodes, total_edges, documents_processed, total_queries, uptime_seconds, compliance_score, risk_level, hallucination_rate }` |

### 3.2 Document Ingestion

| Method | Endpoint | Content Type | Max Size | Description |
|--------|----------|-------------|----------|-------------|
| `POST` | `/upload-pdf` | `multipart/form-data` | 100MB | Upload PDF for entity extraction. Text truncated to 15K chars. |
| `POST` | `/upload-audio` | `multipart/form-data` | 100MB | Upload audio (WebM/WAV/MP3/OGG) for transcription + extraction. |
| `POST` | `/upload-video` | `multipart/form-data` | 100MB | Upload video (MP4/MOV) for transcript + summary + extraction. |
| `POST` | `/upload-text` | `application/json` | — | Direct text ingestion. Body: `{ text, source_name? }` |
| `POST` | `/upload-batch` | `multipart/form-data` | 100MB × N | Batch upload multiple PDFs. |

**Rate Limit:** 30 requests/minute per IP.

**Response Schema (all upload endpoints):**
```json
{
  "success": true,
  "filename": "policy_doc.pdf",
  "entities_found": 12,
  "relationships_found": 8,
  "text_preview": "...",
  "truncated": false
}
```

### 3.3 Knowledge Graph

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/graph` | Full graph JSON (nodes, edges, PageRank metrics) |
| `GET` | `/export-graph` | Alias for `/graph` (export use case) |
| `GET` | `/hallucination-stats` | LLM grounding metrics |
| `GET` | `/contradictions` | Conflicting relations between node pairs |
| `GET` | `/recent-changes?hours=24` | Nodes modified within time window |
| `DELETE` | `/reset` | Clear all graph data, counters, and storage |

**Graph JSON Response:**
```json
{
  "nodes": [
    {
      "id": "john doe::person",
      "name": "John Doe",
      "type": "person",
      "source": "policy_doc.pdf",
      "sources": ["policy_doc.pdf", "audit_report.pdf"],
      "connections": 5,
      "importance_score": 0.0342,
      "in_degree": 2,
      "out_degree": 3
    }
  ],
  "edges": [
    {
      "source": "john doe::person",
      "target": "iso 27001::policy",
      "relation": "oversees",
      "source_doc": "policy_doc.pdf"
    }
  ],
  "metrics": {
    "total_nodes": 45,
    "total_edges": 62,
    "density": 0.031,
    "isolated_nodes": 2,
    "compliance_readiness_score": 87.5,
    "risk_level": "LOW"
  }
}
```

### 3.4 Query & Compliance

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/query` | `{ question }` or `{ chatInput }` | Graph RAG query with Lyzr/Gemini |
| `POST` | `/ask-compliance` | Same as `/query` | Alias route for compliance-specific queries |
| `GET` | `/export-report` | — | Generate compliance audit report JSON |

**Query Response:**
```json
{
  "answer": "Password rotation is mandatory every 90 days per ISO 27001 §4.2.",
  "sources": ["ISO 27001 Policy from policy_doc.pdf"],
  "confidence_score": 0.92,
  "nodes_searched": 15,
  "edges_searched": 22,
  "response_time_ms": 1340
}
```

### 3.5 Payments (Razorpay)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/create-order` | `{ amount, currency?, receipt?, notes? }` | Create Razorpay order (amount in paise) |
| `POST` | `/verify-payment` | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` | HMAC-SHA256 signature verification |

**Rate Limit:** 20 requests/minute.

### 3.6 Real-Time Events

| Method | Endpoint | Type | Description |
|--------|----------|------|-------------|
| `GET` | `/events` | `text/event-stream` | Server-Sent Events for uploads and queries |

**SSE Event Payload:**
```json
{
  "type": "upload",
  "source": "policy_doc.pdf",
  "entities": 12,
  "timestamp": "2026-08-02T12:30:00Z"
}
```

---

## 4. AI & LLM Engine

**File:** `backend/gemini_engine.py`

### 4.1 Extraction Pipeline

The entity extraction pipeline follows a **zero-fail fallback chain**:

```
Lyzr AI SuperFlow (Primary Agentic Orchestration)
    ↓ fallback
Google Gemini 2.5 Flash (Primary LLM via SDK)
    ↓ fallback
Google Gemini 1.5 Flash / 1.5 Pro
    ↓ fallback
OpenRouter Free Models (10+ rotating endpoints)
    ↓ fallback
Local Regex Extractor (Zero-dependency, offline)
```

### 4.2 Entity Extraction (`extract_entities`)

**Input:** Raw document text + filename
**Output:** `{ entities: [...], relationships: [...] }`

The LLM receives a structured extraction prompt requesting:
- **Entity Types:** Person, Document, Policy, Date, Organization, Event, Location
- **Relationship Format:** `{ source, target, relation }`

JSON response is parsed from markdown code blocks. On parse failure, falls back to regex extractor.

### 4.3 Regex Fallback Extractor (`fallback_extract_entities`)

When all AI services are unavailable, this zero-dependency extractor:
- Creates a `document` node from the filename
- Searches for policy references: ISO, NIST, HIPAA, PCI DSS, GDPR, SOC 2
- Identifies devices: ESP32, Raspberry Pi, sensors
- Detects personnel: CISO, Employee, Auditor
- Maps relationships to the source document

### 4.4 Query Answering (`answer_query`)

**Flow:**
1. Normalize question text
2. Check static greeting dictionary (fast-path for `hi`, `hello`, `help`, etc.)
3. If Lyzr env vars are set → route to `query_lyzr_webhook()`
4. Otherwise → construct prompt with graph context → `generate_text_response()`
5. Parse answer body and `SOURCES:` list
6. Update hallucination stats (`grounded` / `refused` / `unverified`)

### 4.5 Lyzr AI SuperFlow Integration (`query_lyzr_webhook`)

**Endpoint:** `os.getenv("LYZR_WEBHOOK_URL")`
**Headers:** `{ "x-api-key": os.getenv("LYZR_API_KEY"), "Content-Type": "application/json" }`
**Payload:** `{ chatInput, graphContext }`

Parses response, extracts `[SOURCE: ...]` tags, updates hallucination metrics. Returns standardized answer dict with confidence score `0.95`.

### 4.6 Audio Transcription (`transcribe_audio`)

Passes raw audio bytes to Gemini GenerativeModel with structured prompt requesting transcript and entity extraction. Falls back to text-based prompt on failure.

### 4.7 Video Processing (`process_video`)

Passes raw video bytes with MIME type to Gemini GenerativeModel requesting transcript, summary, and entity extraction.

### 4.8 OpenRouter Free Model Rotation (`call_openrouter_free`)

Sequentially tries 10 free models:
1. `inclusionai/ling-3.0-flash:free`
2. `nvidia/nemotron-3-ultra:free`
3. `google/gemini-2.0-flash-exp:free`
4. `meta-llama/llama-3.3-70b-instruct:free`
5. `deepseek/deepseek-r1:free`
6. `qwen/qwen3-30b-a3b:free`
7. `microsoft/mai-ds-r1:free`
8. `google/gemma-3-27b-it:free`
9. `deepseek/deepseek-chat-v3-0324:free`
10. `moonshotai/kimi-vl-a3b-thinking:free`

### 4.9 Hallucination Tracking

Global `hallucination_stats` dictionary tracks:
- `total_queries`: Total query count
- `grounded`: Answers with verified source citations
- `refused`: Answers where system refused due to missing data
- `unverified`: Answers without source verification
- `hallucination_rate`: `unverified / total_queries * 100`

---

## 5. Knowledge Graph Engine

**File:** `backend/graph_engine.py`

### 5.1 Graph Schema

| Property | Specification |
|----------|---------------|
| **Model** | Directed Graph (`networkx.DiGraph`) |
| **Node ID Format** | `"{name.lower().strip()}::{type.lower()}"` (canonical deduplication) |
| **Node Types** | person, document, policy, date, organization, event, location, unknown |

**Node Attributes:**
```python
{
    "id": "john doe::person",
    "name": "John Doe",
    "type": "person",
    "source": "policy_doc.pdf",
    "sources": {"policy_doc.pdf", "audit_report.pdf"},
    "timestamp": 1722600000.0
}
```

**Edge Attributes:**
```python
{
    "relation": "oversees",
    "source": "policy_doc.pdf"
}
```

### 5.2 Core Operations

| Function | Description |
|----------|-------------|
| `add_entities(entities, source)` | Adds nodes with canonical IDs, merges multi-source tracking |
| `add_relationships(relationships, source)` | Resolves IDs via `id_map`, adds directed edges |
| `get_graph_json()` | Full JSON with PageRank scores, degree counts, analytics |
| `get_context_for_query(question)` | RAG context retriever: keyword matching → seed nodes → 1st/2nd degree BFS expansion |
| `get_path_between(a, b)` | Shortest path between two entities |
| `calculate_confidence(question, nodes, edges)` | Dynamic confidence score based on retrieval density |
| `detect_contradictions()` | Finds conflicting relations from different sources |
| `get_recent_changes(hours)` | Nodes added/modified within time window |
| `generate_audit_report()` | Formal compliance report with top 5 critical entities by PageRank |

### 5.3 Analytics Metrics

| Metric | Formula |
|--------|---------|
| Compliance Readiness Score | `(1.0 - isolated/num_nodes) * 85 + density * 15 + num_nodes * 0.5` |
| Risk Level | `LOW` (≥80), `MEDIUM` (≥50), `HIGH` (<50) |
| Importance Score | PageRank algorithm across full graph |

### 5.4 Persistence Strategy

**Dual-write architecture:**

1. **Supabase PostgreSQL** (Primary, if configured)
   - Table: `public.nexusiq_graphs`
   - Row ID: `default_graph`
   - UPSERT via HTTP POST with `Prefer: resolution=merge-duplicates`
   - Stores: nodes, edges, documents, id_map as JSON

2. **Local JSON** (Fallback)
   - File: `graph_data.json`
   - Auto-saves on every entity/relationship addition
   - Auto-loads on server startup if Supabase unavailable

---

## 6. Frontend Application

### 6.1 Component Architecture

```
App.jsx (Root Router + Auth State)
├── Canvas3D.jsx (Three.js Background — Global)
├── Header.jsx (Navigation + Export Report)
├── LiveFeed.jsx (SSE Toast Notifications — Global)
├── Routes:
│   ├── / → LandingPage.jsx (Marketing + Live Stats)
│   ├── /login → LoginPage.jsx (Firebase Auth)
│   ├── /about → AboutPage.jsx (Mission + Team)
│   ├── /architecture → ArchitecturePage.jsx (Pipeline + IoT)
│   ├── /pricing → PricingPage.jsx (Plans + Razorpay)
│   ├── /workspace → ProtectedRoute → Workspace.jsx
│   │   ├── StatsBar.jsx (Animated Metrics)
│   │   ├── UploadPanel.jsx (Multi-Modal Upload)
│   │   ├── GraphView.jsx (D3.js Knowledge Graph)
│   │   ├── NodeDetail.jsx (Entity Inspector)
│   │   ├── QueryInterface.jsx (Graph RAG Q&A)
│   │   └── ActivityFeed.jsx (User History)
│   └── * → NotFoundPage.jsx (404)
```

### 6.2 Key Components Detail

#### GraphView.jsx — D3.js Knowledge Graph
- **Simulation:** `d3.forceSimulation` with link (150px), charge (-600), center, collide (50px)
- **Zoom:** `d3.zoom()` range 0.1x–4x
- **Node Colors:** Person (#00ff88), Document (#7c3aed), Policy (#f59e0b), Date (#06b6d4), Organization (#ec4899), Event (#f97316), Location (#84cc16)
- **Visual Effects:** SVG glow filters, breathing animations, directional arrow markers, click ripple
- **Export:** SVG → Canvas → PNG download

#### QueryInterface.jsx — Graph RAG Q&A
- Sends `POST /query` with question text
- Displays: answer (typewriter effect), confidence score, node/edge count, latency, source citations
- Saves to Firestore (`saveQueryHistory`)
- Export compliance report as `.txt` file
- Recent query history (5 items) for quick re-querying

#### UploadPanel.jsx — Multi-Modal Upload
- **PDF:** Drag-and-drop or file picker → `POST /upload-pdf`
- **Video:** MP4/WebM/MOV/AVI/MKV → `POST /upload-video`
- **Audio:** MP3/WAV/M4A/AAC/OGG → `POST /upload-audio`
- **Text:** Raw compliance text → `POST /upload-text`
- **Microphone:** Browser MediaRecorder → WebM → `POST /upload-audio`
- Upload history with entity/relationship counts

#### Canvas3D.jsx — Three.js Background
- 220 particles with randomized 3D positions
- Colors: Purple (#7c3aed), Cyan (#06b6d4), Pink (#ec4899), Emerald (#00ff88)
- Dynamic constellation lines (distance < 110 units)
- Mouse parallax camera tracking
- Additive blending with radial glow texture

#### LiveFeed.jsx — SSE Real-Time Feed
- Connects to `${API}/events` via `EventSource`
- Parses upload/query events
- Toast notifications (max 3 concurrent, 4s auto-dismiss)
- Fixed bottom-right position

### 6.3 State Management

| State | Location | Source |
|-------|----------|--------|
| `user` | `App.jsx` | Firebase `onAuthStateChanged` + localStorage persistence |
| `graphData` | `App.jsx` | `GET /graph` API call |
| `stats` | `App.jsx` | `GET /stats` API call |
| `selectedNode` | `App.jsx` | GraphView click callback |
| `isPro` | `Header.jsx` | Firestore `getSubscription` query |

---

## 7. IoT Edge Pipeline

### 7.1 Architecture Flow

```
ESP32 (DHT11 Sensor + Relay)
    │
    ├── Reads temperature & humidity every 2 seconds
    ├── If temp ≥ 32°C → Pulls relay LOW (emergency stop)
    │                   → HTTP POST to RPi with shutdown=true
    ├── If temp < 30°C (recovery) → Relay HIGH (restart)
    └── Heartbeat every 10 seconds
          │
          ▼
Raspberry Pi Gateway (port 5001)
    │
    ├── POST /sensor → Receives ESP32 JSON
    ├── Critical: Generates ISO 27001 A.11.2.1 thermal incident
    ├── Routine: Logs NIST SP 800-53 PE-14 compliance check
    ├── Offline queue (JSON) for network failures
    └── Manual ENTER trigger for incident simulation
          │
          ▼
NexusIQ Cloud Backend (Railway)
    │
    ├── POST /upload-text → Graph RAG ingestion
    ├── SSE /events → Real-time feed to frontend
    └── Entity extraction → Knowledge Graph update
```

### 7.2 ESP32 Firmware (`esp32_sensor.ino`)

| Parameter | Value |
|-----------|-------|
| Sensor | DHT11 on GPIO 4 |
| Relay | GPIO 26 (Active LOW) |
| Threshold | 32.0°C (emergency), 30.0°C (recovery hysteresis) |
| Gateway | `http://192.168.1.17:5001/sensor` |
| Baud Rate | 115200 |
| Libraries | DHT sensor library, Adafruit Unified Sensor, ArduinoJson v6 |

**Telemetry Payload:**
```json
{
  "temperature": 33.5,
  "humidity": 65.2,
  "shutdown": true,
  "device": "ESP32_NEXUS",
  "threshold": 32.0
}
```

### 7.3 Raspberry Pi Scripts

| Script | Purpose |
|--------|---------|
| `sensor_hub.py` | HTTP gateway (port 5001) + manual CLI trigger. 5 preset incident templates. |
| `nexusiq_edge.py` | Standalone simulator. 8 compliance templates. Auto-sends every 30s. |
| `edge_agent.py` | Production daemon. GPIO LED (pin 18), offline queue, audio upload, health heartbeat. |

### 7.4 Offline Queue Resilience

When the backend is unreachable:
1. Payloads are saved to `rpi_offline_queue.json`
2. On connection restore, all queued items are re-synced
3. Queue file is deleted when empty

---

## 8. Authentication & Payments

### 8.1 Firebase Authentication

| Method | Implementation |
|--------|---------------|
| Email/Password | `signInWithEmailAndPassword(auth, email, password)` |
| Google OAuth | `signInWithPopup(auth, googleProvider)` |
| Quick Demo | Pre-configured demo credentials |
| Password Reset | `sendPasswordResetEmail(auth, email)` |
| Session Persistence | `localStorage` with `onAuthStateChanged` listener |

### 8.2 Firestore Collections

| Collection | Documents | Fields |
|-----------|-----------|--------|
| `users` | User profiles | `uid, email, role, createdAt` |
| `subscriptions` | Payment records | `uid, plan, paymentId, orderId, status, timestamp` |
| `query_history` | Query audit log | `uid, question, answer, sources, timestamp` |
| `upload_history` | Upload audit log | `uid, filename, type, entitiesFound, relationshipsFound, timestamp` |

### 8.3 Razorpay Payment Flow

```
User clicks "Upgrade to Pro"
    → Frontend calls POST /create-order (amount in paise)
    → Backend creates Razorpay order via SDK
    → Frontend opens Razorpay modal (theme: #7c3aed)
    → User completes payment
    → Frontend calls POST /verify-payment
    → Backend verifies HMAC-SHA256 signature
    → Frontend saves subscription to Firestore
    → PRO badge appears in header
```

**Subscription Plans:**
| Plan | Price | Features |
|------|-------|----------|
| Starter | ₹0/mo | 100 nodes, PDF/Text, community support |
| Professional | ₹2,499/mo | Unlimited, multi-modal, zero-hallucination, RPi sync |
| Enterprise | Custom | Dedicated instance, on-premise, air-gapped edge |

---

## 9. Database & Persistence

### 9.1 Supabase PostgreSQL

**Table:** `public.nexusiq_graphs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `text` (PK) | Graph identifier (`default_graph`) |
| `nodes` | `jsonb` | Serialized node array |
| `edges` | `jsonb` | Serialized edge array |
| `documents` | `jsonb` | Processed document list |
| `id_map` | `jsonb` | Original → canonical ID mapping |
| `updated_at` | `timestamp` | Last sync timestamp |

**Sync Operations:**
- **Save:** HTTP POST with `Prefer: resolution=merge-duplicates` (UPSERT)
- **Load:** HTTP GET with `?id=eq.default_graph`
- **Delete:** HTTP DELETE with `?id=eq.default_graph`

### 9.2 Local JSON Fallback

**File:** `backend/graph_data.json`
**Structure:** Same as Supabase columns (nodes, edges, documents, id_map)
**Trigger:** Auto-activates when `SUPABASE_URL`/`SUPABASE_KEY` are not set

---

## 10. Deployment & Infrastructure

### 10.1 Frontend (Vercel)

**Config:** `vercel.json`
```json
{
  "buildCommand": "npm run build --prefix frontend",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Deploy:** `npx vercel --prod --yes`
**URL:** https://nexus-iq-drab.vercel.app

### 10.2 Backend (Railway)

**Start Command:** `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
**Deploy:** `railway redeploy --yes`
**URL:** https://nexusiq-backend-production.up.railway.app

### 10.3 Local Development

```bash
# Windows
start.bat

# Linux/macOS
chmod +x start.sh && ./start.sh

# Manual
cd backend && uvicorn main:app --reload --port 8000
cd frontend && npm run dev  # port 5173
```

---

## 11. Security Model

| Measure | Implementation |
|---------|---------------|
| **Secret Management** | All API keys via `os.getenv()` — zero hardcoded secrets |
| **Git Protection** | `.env` files excluded via `.gitignore`; `.env.example` tracked |
| **Authentication** | Firebase Auth with Google OAuth + Email/Password |
| **Payment Security** | Razorpay HMAC-SHA256 signature verification |
| **Rate Limiting** | SlowAPI: 30 req/min (uploads/queries), 20 req/min (payments) |
| **CORS** | Configured for production domains only |
| **Session Persistence** | `localStorage` synced with `onAuthStateChanged` |

---

## 12. Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#0a0a0f` | Page background |
| Primary | `#7c3aed` | Buttons, accents, borders |
| Accent | `#a78bfa` | Secondary highlights |
| Success | `#10b981` | Status indicators |
| Cyan | `#06b6d4` | IoT/Architecture accents |
| Pink | `#ec4899` | Organization nodes |

### Glassmorphism Classes

| Class | Effect |
|-------|--------|
| `.glass` | `rgba(20,20,35,0.6)` + 12px blur + purple border |
| `.glass-strong` | `rgba(14,14,24,0.88)` + 24px blur |
| `.glow-border` | Multi-layered purple box-shadow glow |
| `.gradient-text` | Animated background-clip text gradient |
| `.hover-lift` | `translateY(-2px)` + enhanced shadow on hover |
| `.hover-pop` | `scale(1.05)` on hover |

### Animations

`animate-fade-in`, `animate-slide-up`, `animate-float`, `shimmer`, `animate-glow-pulse`, `ripple-effect`, `scan-line`, `animate-check`, `animate-slide-in-left`, `animate-slide-in-right`

### Typography

- **Font:** Inter (Google Fonts)
- **Headings:** `font-extrabold`, `tracking-tight`
- **Body:** `font-light`, `leading-relaxed`
- **Code:** `font-mono`

---

## 13. Complete File Reference

```
NexusIQ/
├── frontend/                        # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # Navigation + Audit Report Export
│   │   │   ├── GraphView.jsx        # D3.js Force-Directed Knowledge Graph
│   │   │   ├── QueryInterface.jsx   # Graph RAG Q&A Panel
│   │   │   ├── UploadPanel.jsx      # Multi-Modal Document Upload
│   │   │   ├── LiveFeed.jsx         # SSE Real-Time Toast Feed
│   │   │   ├── StatsBar.jsx         # Animated System Metrics
│   │   │   ├── ActivityFeed.jsx     # User Activity History
│   │   │   ├── Canvas3D.jsx         # Three.js Particle Background
│   │   │   ├── NodeDetail.jsx       # Graph Node Inspector
│   │   │   ├── LoginPage.jsx        # Firebase Auth Portal
│   │   │   ├── LandingPage.jsx      # Marketing Homepage
│   │   │   └── ProtectedRoute.jsx   # Auth Route Guard
│   │   ├── pages/
│   │   │   ├── Workspace.jsx        # Main Dashboard Layout
│   │   │   ├── AboutPage.jsx        # Mission, Team & Tech Stack
│   │   │   ├── ArchitecturePage.jsx # Pipeline & IoT Architecture
│   │   │   ├── PricingPage.jsx      # Subscription Plans + Razorpay
│   │   │   └── NotFoundPage.jsx     # 404 Page
│   │   ├── services/
│   │   │   └── firestoreService.js  # Firestore CRUD Operations
│   │   ├── firebase.js              # Firebase SDK Config
│   │   ├── App.jsx                  # Root Router + State
│   │   ├── main.jsx                 # React DOM Entry Point
│   │   └── index.css                # Design System + Animations
│   ├── package.json
│   └── vite.config.js
│
├── backend/                         # FastAPI Python API
│   ├── main.py                      # 18 API Endpoints + Middleware
│   ├── gemini_engine.py             # LLM Extraction + Query + Lyzr
│   ├── graph_engine.py              # NetworkX Graph + Supabase Sync
│   ├── audio_handler.py             # Audio Format Utilities
│   ├── requirements.txt             # 13 Python Dependencies
│   ├── .env.example                 # Environment Template
│   └── graph_data.json              # Local Graph Persistence
│
├── rpi/                             # Raspberry Pi Edge Scripts
│   ├── sensor_hub.py                # ESP32 Gateway + Cloud Sync
│   ├── nexusiq_edge.py              # Incident Simulator (8 templates)
│   └── edge_agent.py                # Production Daemon + GPIO + Queue
│
├── esp32/                           # ESP32 Arduino Firmware
│   ├── esp32_sensor.ino             # DHT11 + Relay Control
│   └── README.md                    # Wiring & Library Guide
│
├── .gitignore                       # Security-hardened exclusions
├── vercel.json                      # Vercel SPA deployment config
├── start.bat                        # Windows launcher
├── start.sh                         # Linux/macOS launcher
├── README.md                        # Enterprise README
└── DOCUMENTATION.md                 # This file
```

---

## 14. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key from AI Studio |
| `OPENROUTER_API_KEY` | Optional | OpenRouter free model fallback key |
| `RAZORPAY_KEY_ID` | Optional | Razorpay key ID for payment orders |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay secret for HMAC verification |
| `LYZR_WEBHOOK_URL` | Optional | Lyzr SuperFlow webhook endpoint URL |
| `LYZR_API_KEY` | Optional | Lyzr API authentication key |
| `SUPABASE_URL` | Optional | Supabase project REST API URL |
| `SUPABASE_KEY` | Optional | Supabase service role key |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Optional | Backend URL (defaults to Railway production) |
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Optional | Firebase app ID |
| `VITE_RAZORPAY_KEY_ID` | Optional | Razorpay publishable key |

---

## 15. Dependencies

### Backend (Python)

| Package | Purpose |
|---------|---------|
| fastapi | ASGI web framework |
| uvicorn | ASGI server |
| google-generativeai | Gemini LLM SDK |
| pymupdf (fitz) | PDF text extraction |
| networkx | Knowledge graph engine |
| python-multipart | File upload parsing |
| aiofiles | Async file I/O |
| python-dotenv | Environment variable loading |
| requests | HTTP client (OpenRouter, Lyzr, Supabase) |
| gunicorn | Production WSGI/ASGI server |
| slowapi | Rate limiting |
| razorpay | Payment SDK |
| supabase | Database client |

### Frontend (Node.js)

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.2.0 | UI library |
| react-dom | ^18.2.0 | DOM rendering |
| react-router-dom | ^7.18.2 | Client-side routing |
| axios | ^1.4.0 | HTTP client |
| d3 | ^7.8.5 | Knowledge graph visualization |
| three | ^0.185.1 | 3D particle backgrounds |
| firebase | ^12.17.0 | Auth + Firestore SDK |
| lucide-react | ^1.28.0 | Icon library |
| tailwindcss | ^3.3.0 | Utility CSS framework |
| vite | ^4.4.0 | Build tool + dev server |

---

<p align="center">
  <strong>NexusIQ Documentation v2.0</strong><br>
  Built with ❤️ for InnovaHack 2026<br>
  Domain 3: Gen AI · Powered by Lyzr AI SuperFlow & Google Gemini<br>
  Team Nexus · Contact: h9696838@gmail.com
</p>
