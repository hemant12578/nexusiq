# NexusIQ — Technical Architecture Document

**InnovaHack Chapter 1 National Hackathon - Round 2 Submission**

NexusIQ is a real-time, AI-powered compliance knowledge graph and intelligence platform designed to automate regulatory audits, physical edge security, and knowledge retrieval.

## System Architecture Overview

NexusIQ is composed of three primary layers:
1. **React Frontend (Vite, TailwindCSS):** Provides an interactive, dynamic knowledge graph visualization, real-time edge monitoring, and a chat-based query interface.
2. **FastAPI Backend (Python):** Orchestrates data ingestion, orchestrates AI extraction, manages the in-memory NetworkX graph state, and calculates compliance readiness.
3. **Hardware / Edge Simulator (RPi/ESP32):** Ingests live telemetry or simulated hardware incidents (e.g., thermal breaches) directly into the knowledge graph.

---

## 1. Frontend (React + Vite)

The frontend is designed for high-performance data visualization and a "wow factor" aesthetic suitable for production.

### Core Components:
- **`Workspace.jsx`:** The primary application shell coordinating state between the graph, upload panel, stats, and query interface.
- **`GraphView.jsx`:** Uses `react-force-graph-2d` for interactive rendering of compliance entities (nodes) and their dependencies (edges). Uses custom canvas drawing for glowing and pulsing effects.
- **`UploadPanel.jsx`:** Handles multi-modal ingestion (PDF, Audio, Video, Text) and includes an **Edge Hardware Simulator** for injecting critical physical security incidents.
- **`StatsBar.jsx`:** A real-time telemetry dashboard showing dynamic calculations for Compliance Readiness, Risk Level, and AI Hallucination Rate.
- **`OnboardingTour.jsx`:** A 6-step interactive guide for first-time users, driven by `localStorage` and `getBoundingClientRect` dynamic spotlighting.

---

## 2. Backend (FastAPI + NetworkX)

The backend handles the core intelligence and state of the platform.

### API Endpoints:
- `POST /upload-[type]`: Ingests multi-modal data, passes to Gemini for extraction, and adds resulting entities/edges to the graph.
- `GET /stats`: Returns live telemetry, including node counts, query metrics, and hallucination rates.
- `GET /compliance-score`: Runs the `calculate_compliance_score()` engine.
- `POST /query`: Processes natural language questions against the graph context.

### Graph Engine (`graph_engine.py`)
NexusIQ relies on `networkx` to maintain the compliance state in memory:
- **Entity Extraction:** Maps people, policies, devices, and documents as discrete nodes.
- **Dynamic Compliance Calculation:**
  - Base Score: 50
  - Framework Bonus: Up to +20 (e.g., GDPR, ISO 27001).
  - Policy Bonus: Up to +15.
  - Relationship Density Bonus: Up to +15.
  - **Penalty Engine:** Subtracts up to -25 for critical incidents (e.g., cooling failure, unverified physical access).
- **Risk Level:** Dynamically shifts between `LOW`, `MEDIUM`, and `CRITICAL` based on the final calculated score.

---

## 3. AI Orchestration & Anti-Hallucination (`gemini_engine.py`)

NexusIQ leverages **Gemini 1.5/2.0** for zero-shot entity extraction and intelligent routing.

- **Extraction Prompts:** Instructs Gemini to return strictly formatted JSON containing `entities` (id, name, type) and `relationships` (from, to, relation).
- **RAG (Retrieval-Augmented Generation):** User queries do not query the LLM blindly. The LLM is fed a structured text representation of the current `networkx` graph.
- **Hallucination Tracking:** NexusIQ tracks whether the LLM's response successfully cites a valid source node from the graph. If no sources are cited, it is logged as an `unverified` query, impacting the live Hallucination Rate metric on the dashboard.
- **Multi-Modal Capabilities:** The engine supports sending raw audio blobs and video streams directly to Gemini for incident transcription and entity extraction.

---

## 4. Edge Hardware Integration

To demonstrate physical compliance (e.g., ISO 27001 environmental security), NexusIQ integrates physical telemetry.
- **IoT Simulator:** Found in `UploadPanel.jsx`, this simulates an ESP32 DHT11 thermal sensor. When triggered, it generates a critical temperature violation.
- **Graph Impact:** The incident is automatically logged, pushed through the LLM extraction pipeline, mapped as a new critical event node on the graph, and immediately degrades the overall Compliance Readiness score.

---
*Generated for InnovaHack 2026*
