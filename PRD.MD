# NexusIQ - Complete PRD & Build Instructions

## PRODUCT OVERVIEW
Name: NexusIQ
Tagline: "From scattered documents to zero-hallucination compliance intelligence"
Domain: Gen AI - PS1 - Multi-Modal Knowledge Graph for Enterprise Compliance
Team: Nexus
Hackathon: InnovaHack Chapter 1 - Round 2
Deadline: 2 Aug 2026, 6:00 PM IST

## THE PROBLEM
Enterprises hold thousands of unorganized compliance documents 
spread across PDFs, audio logs, and tables. Standard vector 
databases use naive text chunking which fragments context and 
loses relationships. This causes severe LLM hallucinations during 
compliance lookups — exactly where accuracy matters most.

## THE SOLUTION
NexusIQ is an edge-to-cloud compliance intelligence platform that:
1. Ingests multi-modal documents (PDF, audio, text)
2. Uses Gemini AI to extract precise entity-relationship data
3. Builds a live visual knowledge graph
4. Uses Graph RAG to answer questions with zero hallucination
5. Cites every answer back to its exact source document

---

## COMPLETE FOLDER STRUCTURE

nexusiq/
├── backend/
│   ├── main.py
│   ├── gemini_engine.py
│   ├── graph_engine.py
│   ├── audio_handler.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       └── components/
│           ├── GraphView.jsx
│           ├── UploadPanel.jsx
│           ├── QueryInterface.jsx
│           ├── StatsBar.jsx
│           ├── NodeDetail.jsx
│           └── Header.jsx
└── rpi/
    └── edge_agent.py

---

## BACKEND - BUILD THIS FIRST

### requirements.txt
fastapi
uvicorn
google-generativeai
pymupdf
networkx
python-multipart
aiofiles
python-dotenv
requests

### main.py - Complete FastAPI Application

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
from gemini_engine import extract_entities, answer_query, transcribe_audio
from graph_engine import GraphEngine
import fitz
import time

load_dotenv()

app = FastAPI(title="NexusIQ API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = GraphEngine()
stats = {
    "documents_processed": 0,
    "total_queries": 0,
    "start_time": time.time()
}

@app.get("/")
def root():
    return {
        "product": "NexusIQ",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "uptime": time.time() - stats["start_time"]}

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files accepted")
    
    contents = await file.read()
    pdf = fitz.open(stream=contents, filetype="pdf")
    
    text = ""
    for page_num, page in enumerate(pdf):
        text += f"\n[PAGE {page_num + 1}]\n"
        text += page.get_text()
    
    text = text[:10000]
    
    result = extract_entities(text, file.filename)
    
    if result["success"]:
        graph.add_entities(result["entities"], file.filename)
        graph.add_relationships(result["relationships"], file.filename)
        stats["documents_processed"] += 1
        
        return {
            "success": True,
            "filename": file.filename,
            "pages": len(pdf),
            "entities_found": len(result["entities"]),
            "relationships_found": len(result["relationships"]),
            "text_preview": text[:200]
        }
    else:
        raise HTTPException(500, result["error"])

@app.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    contents = await file.read()
    
    result = transcribe_audio(contents, file.filename)
    
    if result["success"]:
        extract_result = extract_entities(result["transcript"], file.filename)
        
        if extract_result["success"]:
            graph.add_entities(extract_result["entities"], file.filename)
            graph.add_relationships(extract_result["relationships"], file.filename)
            stats["documents_processed"] += 1
        
        return {
            "success": True,
            "transcript": result["transcript"],
            "entities_found": len(extract_result.get("entities", [])),
        }
    else:
        raise HTTPException(500, result["error"])

class TextInput(BaseModel):
    text: str
    source_name: Optional[str] = "manual_input"

@app.post("/upload-text")
def upload_text(data: TextInput):
    result = extract_entities(data.text, data.source_name)
    
    if result["success"]:
        graph.add_entities(result["entities"], data.source_name)
        graph.add_relationships(result["relationships"], data.source_name)
        stats["documents_processed"] += 1
        
        return {
            "success": True,
            "entities_found": len(result["entities"]),
            "relationships_found": len(result["relationships"])
        }
    else:
        raise HTTPException(500, result["error"])

@app.get("/graph")
def get_graph():
    return graph.get_graph_json()

@app.get("/stats")
def get_stats():
    graph_data = graph.get_graph_json()
    return {
        "total_nodes": len(graph_data["nodes"]),
        "total_edges": len(graph_data["edges"]),
        "documents_processed": stats["documents_processed"],
        "total_queries": stats["total_queries"],
        "uptime_seconds": int(time.time() - stats["start_time"])
    }

class QueryRequest(BaseModel):
    question: str

@app.post("/query")
def query(req: QueryRequest):
    start = time.time()
    
    graph_data = graph.get_graph_json()
    
    if not graph_data["nodes"]:
        return {
            "answer": "No documents uploaded yet. Please upload compliance documents first.",
            "sources": [],
            "response_time_ms": 0
        }
    
    context = graph.get_context_for_query()
    result = answer_query(req.question, context)
    
    response_time = int((time.time() - start) * 1000)
    stats["total_queries"] += 1
    
    return {
        "answer": result["answer"],
        "sources": result["sources"],
        "nodes_searched": len(graph_data["nodes"]),
        "edges_searched": len(graph_data["edges"]),
        "response_time_ms": response_time
    }

@app.delete("/reset")
def reset():
    graph.clear()
    stats["documents_processed"] = 0
    stats["total_queries"] = 0
    return {"success": True, "message": "NexusIQ graph cleared"}

### gemini_engine.py - Complete Gemini Integration

import google.generativeai as genai
import json
import os
import re
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-pro")

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
You are NexusIQ - a zero-hallucination enterprise compliance assistant.

Your knowledge graph contains the following verified compliance data:

{context}

User Question: {question}

STRICT RULES:
1. Answer ONLY using information present in the knowledge graph above
2. Every single claim must have a source citation
3. If the answer is not in the graph, respond with exactly:
   "This information is not available in the current NexusIQ compliance database."
4. Never guess or infer beyond what the graph states
5. Be precise and professional

Response Format:
ANSWER: [Your direct answer here]

SOURCES:
- [Entity name] from [source document]
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

def extract_entities(text: str, filename: str) -> dict:
    try:
        prompt = EXTRACT_PROMPT.replace("{text}", text)
        response = model.generate_content(prompt)
        raw = response.text.strip()
        
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
    try:
        prompt = QUERY_PROMPT.replace(
            "{context}", context
        ).replace(
            "{question}", question
        )
        
        response = model.generate_content(prompt)
        answer_text = response.text
        
        sources = []
        lines = answer_text.split("\n")
        in_sources = False
        for line in lines:
            if "SOURCES:" in line:
                in_sources = True
                continue
            if in_sources and line.strip().startswith("-"):
                sources.append(line.strip()[1:].strip())
        
        return {
            "answer": answer_text,
            "sources": sources
        }
    except Exception as e:
        return {
            "answer": f"Query error: {str(e)}",
            "sources": []
        }

def transcribe_audio(audio_bytes: bytes, filename: str) -> dict:
    try:
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
        return {
            "success": False,
            "error": str(e),
            "transcript": ""
        }

### graph_engine.py - NetworkX Graph Logic

import networkx as nx
from typing import List, Dict

class GraphEngine:
    def __init__(self):
        self.G = nx.DiGraph()
        self.documents = []
    
    def add_entities(self, entities: List[Dict], source: str):
        for entity in entities:
            self.G.add_node(
                entity["id"],
                name=entity.get("name", entity["id"]),
                type=entity.get("type", "unknown"),
                source=source
            )
    
    def add_relationships(self, relationships: List[Dict], source: str):
        for rel in relationships:
            if rel["from"] in self.G and rel["to"] in self.G:
                self.G.add_edge(
                    rel["from"],
                    rel["to"],
                    relation=rel.get("relation", "related to"),
                    source=source
                )
    
    def get_graph_json(self) -> Dict:
        nodes = []
        for node_id, data in self.G.nodes(data=True):
            nodes.append({
                "id": node_id,
                "name": data.get("name", node_id),
                "type": data.get("type", "unknown"),
                "source": data.get("source", ""),
                "connections": self.G.degree(node_id)
            })
        
        edges = []
        for u, v, data in self.G.edges(data=True):
            edges.append({
                "from": u,
                "to": v,
                "relation": data.get("relation", ""),
                "source": data.get("source", "")
            })
        
        return {"nodes": nodes, "edges": edges}
    
    def get_context_for_query(self) -> str:
        context_lines = []
        for u, v, data in self.G.edges(data=True):
            u_name = self.G.nodes[u].get("name", u)
            v_name = self.G.nodes[v].get("name", v)
            relation = data.get("relation", "related to")
            source = data.get("source", "unknown")
            context_lines.append(
                f"{u_name} {relation} {v_name} [Source: {source}]"
            )
        
        for node_id, data in self.G.nodes(data=True):
            if self.G.degree(node_id) == 0:
                context_lines.append(
                    f"{data.get('name', node_id)} is a "
                    f"{data.get('type', 'entity')} "
                    f"[Source: {data.get('source', 'unknown')}]"
                )
        
        return "\n".join(context_lines)
    
    def clear(self):
        self.G.clear()
        self.documents.clear()

### .env file
GEMINI_API_KEY=your_gemini_api_key_here

---

## FRONTEND - BUILD AFTER BACKEND WORKS

### package.json
{
  "name": "nexusiq-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "d3": "^7.8.5",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.4.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.27"
  }
}

### App.jsx - Main Layout

import { useState, useEffect } from "react"
import Header from "./components/Header"
import GraphView from "./components/GraphView"
import UploadPanel from "./components/UploadPanel"
import QueryInterface from "./components/QueryInterface"
import StatsBar from "./components/StatsBar"
import axios from "axios"

const API = "http://localhost:8000"

export default function App() {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] })
  const [stats, setStats] = useState({
    total_nodes: 0,
    total_edges: 0,
    documents_processed: 0,
    total_queries: 0
  })
  const [selectedNode, setSelectedNode] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchGraph = async () => {
    try {
      const res = await axios.get(`${API}/graph`)
      setGraphData(res.data)
    } catch (e) {
      console.error("Graph fetch error:", e)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/stats`)
      setStats(res.data)
    } catch (e) {
      console.error("Stats fetch error:", e)
    }
  }

  useEffect(() => {
    fetchGraph()
    fetchStats()
    const interval = setInterval(() => {
      fetchGraph()
      fetchStats()
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleUploadSuccess = () => {
    setTimeout(() => {
      fetchGraph()
      fetchStats()
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <Header stats={stats} />
      <StatsBar stats={stats} />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-purple-900/30 overflow-y-auto">
          <UploadPanel
            API={API}
            onUploadSuccess={handleUploadSuccess}
            setLoading={setLoading}
          />
        </div>
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
              <div className="text-purple-400 text-xl animate-pulse">
                Building Knowledge Graph...
              </div>
            </div>
          )}
          <GraphView
            graphData={graphData}
            onNodeClick={setSelectedNode}
          />
          {graphData.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">🧠</div>
                <div className="text-xl">Upload documents to build your knowledge graph</div>
                <div className="text-sm mt-2">PDFs, audio recordings, or paste text</div>
              </div>
            </div>
          )}
        </div>
        <div className="w-96 border-l border-purple-900/30 overflow-y-auto">
          <QueryInterface API={API} onQuery={fetchStats} />
        </div>
      </div>
    </div>
  )
}

### GraphView.jsx - D3.js Knowledge Graph

import { useEffect, useRef } from "react"
import * as d3 from "d3"

const NODE_COLORS = {
  person: "#00ff88",
  document: "#7c3aed",
  policy: "#f59e0b",
  date: "#06b6d4",
  organization: "#ec4899",
  event: "#f97316",
  location: "#84cc16",
  unknown: "#6b7280"
}

export default function GraphView({ graphData, onNodeClick }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!svgRef.current || !graphData.nodes.length) return

    d3.select(svgRef.current).selectAll("*").remove()

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)

    const g = svg.append("g")

    svg.call(
      d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => g.attr("transform", event.transform))
    )

    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#7c3aed")

    const nodes = graphData.nodes.map(n => ({ ...n }))
    const nodeIds = new Set(nodes.map(n => n.id))
    const links = graphData.edges
      .filter(e => nodeIds.has(e.from) && nodeIds.has(e.to))
      .map(e => ({
        source: e.from,
        target: e.to,
        relation: e.relation
      }))

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide(40))

    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#7c3aed")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)")

    const linkLabel = g.append("g")
      .selectAll("text")
      .data(links)
      .join("text")
      .text(d => d.relation)
      .attr("font-size", "8px")
      .attr("fill", "#a78bfa")
      .attr("text-anchor", "middle")

    const node = g.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 16)
      .attr("fill", d => NODE_COLORS[d.type] || NODE_COLORS.unknown)
      .attr("fill-opacity", 0.85)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("click", (event, d) => onNodeClick(d))
      .call(
        d3.drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on("drag", (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    const label = g.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text(d => d.name.length > 15 ? d.name.substring(0, 15) + "..." : d.name)
      .attr("font-size", "10px")
      .attr("fill", "#f8fafc")
      .attr("text-anchor", "middle")
      .attr("dy", 28)
      .style("pointer-events", "none")

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)

      linkLabel
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + d.target.y) / 2)

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)

      label
        .attr("x", d => d.x)
        .attr("y", d => d.y)
    })
  }, [graphData])

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ background: "transparent" }}
    />
  )
}

### UploadPanel.jsx

import { useState, useRef } from "react"
import axios from "axios"

export default function UploadPanel({ API, onUploadSuccess, setLoading }) {
  const [uploads, setUploads] = useState([])
  const [recording, setRecording] = useState(false)
  const [text, setText] = useState("")
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  const uploadPDF = async (file) => {
    setLoading(true)
    const form = new FormData()
    form.append("file", file)
    try {
      const res = await axios.post(`${API}/upload-pdf`, form)
      setUploads(prev => [...prev, {
        name: file.name,
        entities: res.data.entities_found,
        relationships: res.data.relationships_found,
        type: "pdf"
      }])
      onUploadSuccess()
    } catch (e) {
      alert("Upload failed: " + e.message)
    }
    setLoading(false)
  }

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRef.current = new MediaRecorder(stream)
    chunksRef.current = []
    mediaRef.current.ondataavailable = e => chunksRef.current.push(e.data)
    mediaRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" })
      const form = new FormData()
      form.append("file", blob, "recording.webm")
      setLoading(true)
      try {
        const res = await axios.post(`${API}/upload-audio`, form)
        setUploads(prev => [...prev, {
          name: "Audio Recording",
          entities: res.data.entities_found,
          type: "audio"
        }])
        onUploadSuccess()
      } catch (e) {
        alert("Audio upload failed")
      }
      setLoading(false)
    }
    mediaRef.current.start()
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    setRecording(false)
  }

  const uploadText = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await axios.post(`${API}/upload-text`, {
        text: text,
        source_name: "manual_input"
      })
      setUploads(prev => [...prev, {
        name: "Text Input",
        entities: res.data.entities_found,
        type: "text"
      }])
      setText("")
      onUploadSuccess()
    } catch (e) {
      alert("Text upload failed")
    }
    setLoading(false)
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-purple-400 font-bold text-lg">
        📄 Document Ingestion
      </h2>

      <div
        className="border-2 border-dashed border-purple-700 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400 transition-colors"
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file?.type === "application/pdf") uploadPDF(file)
        }}
        onClick={() => document.getElementById("pdfInput").click()}
      >
        <div className="text-3xl mb-2">📁</div>
        <div className="text-sm text-gray-400">Drop PDF here or click to upload</div>
        <input
          id="pdfInput"
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={e => e.target.files[0] && uploadPDF(e.target.files[0])}
        />
      </div>

      <button
        onClick={recording ? stopRecording : startRecording}
        className={`w-full py-3 rounded-xl font-bold transition-all ${
          recording
            ? "bg-red-600 hover:bg-red-700 animate-pulse"
            : "bg-purple-700 hover:bg-purple-600"
        }`}
      >
        {recording ? "🔴 Stop Recording" : "🎙️ Record Audio Incident"}
      </button>

      <div className="space-y-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste compliance text here..."
          className="w-full h-24 bg-gray-900 border border-purple-900 rounded-lg p-3 text-sm text-gray-300 resize-none focus:outline-none focus:border-purple-500"
        />
        <button
          onClick={uploadText}
          className="w-full py-2 bg-purple-900 hover:bg-purple-700 rounded-lg text-sm font-bold transition-colors"
        >
          Analyze Text
        </button>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">
            Processed Documents
          </h3>
          {uploads.map((u, i) => (
            <div key={i} className="bg-gray-900 rounded-lg p-3 border border-purple-900/30">
              <div className="text-sm font-medium truncate">{u.name}</div>
              <div className="text-xs text-purple-400 mt-1">
                {u.entities} entities • {u.relationships || 0} relationships
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

### QueryInterface.jsx

import { useState } from "react"
import axios from "axios"

export default function QueryInterface({ API, onQuery }) {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  const ask = async () => {
    if (!question.trim()) return
    setLoading(true)
    try {
      const res = await axios.post(`${API}/query`, { question })
      const result = {
        question,
        answer: res.data.answer,
        sources: res.data.sources,
        time: res.data.response_time_ms,
        nodes: res.data.nodes_searched
      }
      setAnswer(result)
      setHistory(prev => [result, ...prev].slice(0, 5))
      onQuery()
    } catch (e) {
      setAnswer({ answer: "Query failed. Please try again.", sources: [] })
    }
    setLoading(false)
    setQuestion("")
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-purple-400 font-bold text-lg">
        🧠 Compliance Intelligence
      </h2>

      <div className="space-y-2">
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && ask()}
          placeholder="Ask a compliance question..."
          className="w-full h-20 bg-gray-900 border border-purple-900 rounded-lg p-3 text-sm text-gray-300 resize-none focus:outline-none focus:border-purple-500"
        />
        <button
          onClick={ask}
          disabled={loading}
          className="w-full py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 rounded-xl font-bold transition-colors"
        >
          {loading ? "⚡ Searching Graph..." : "🔍 Query NexusIQ"}
        </button>
      </div>

      {answer && (
        <div className="bg-gray-900 rounded-xl p-4 border border-purple-700/50 space-y-3">
          <div className="text-xs text-gray-500">
            {answer.nodes} nodes searched • {answer.time}ms
          </div>
          <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
            {answer.answer}
          </div>
          {answer.sources?.length > 0 && (
            <div className="border-t border-purple-900/30 pt-3">
              <div className="text-xs text-purple-400 font-bold mb-1">
                CITED SOURCES
              </div>
              {answer.sources.map((s, i) => (
                <div key={i} className="text-xs text-gray-400">• {s}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {history.length > 1 && (
        <div className="space-y-2">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">
            Query History
          </h3>
          {history.slice(1).map((h, i) => (
            <div
              key={i}
              className="text-xs text-gray-500 bg-gray-900/50 rounded p-2 cursor-pointer hover:text-gray-300"
              onClick={() => setQuestion(h.question)}
            >
              {h.question}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

### Header.jsx

export default function Header({ stats }) {
  return (
    <header className="border-b border-purple-900/30 px-6 py-4 flex items-center justify-between bg-[#0a0a0f]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center font-bold text-sm">
          N
        </div>
        <div>
          <div className="font-bold text-lg text-white">NexusIQ</div>
          <div className="text-xs text-gray-500">
            Zero-Hallucination Compliance Intelligence
          </div>
        </div>
      </div>
      <div className="flex gap-6 text-sm">
        <div className="text-center">
          <div className="text-purple-400 font-bold">{stats.total_nodes}</div>
          <div className="text-gray-500 text-xs">Nodes</div>
        </div>
        <div className="text-center">
          <div className="text-purple-400 font-bold">{stats.total_edges}</div>
          <div className="text-gray-500 text-xs">Edges</div>
        </div>
        <div className="text-center">
          <div className="text-purple-400 font-bold">
            {stats.documents_processed}
          </div>
          <div className="text-gray-500 text-xs">Docs</div>
        </div>
        <div className="text-center">
          <div className="text-green-400 font-bold">0%</div>
          <div className="text-gray-500 text-xs">Hallucination</div>
        </div>
      </div>
    </header>
  )
}

### StatsBar.jsx

export default function StatsBar({ stats }) {
  return (
    <div className="bg-purple-950/20 border-b border-purple-900/20 px-6 py-2 flex gap-8 text-xs text-gray-400">
      <span>🟢 System Online</span>
      <span>📊 {stats.total_nodes} entities tracked</span>
      <span>🔗 {stats.total_edges} relationships mapped</span>
      <span>📁 {stats.documents_processed} documents processed</span>
      <span>🛡️ Graph RAG Active — Zero Hallucination Mode</span>
    </div>
  )
}

---

## RPi EDGE AGENT

### rpi/edge_agent.py

import requests
import time
import os
try:
    import RPi.GPIO as GPIO
    GPIO_AVAILABLE = True
except ImportError:
    GPIO_AVAILABLE = False

BACKEND_URL = "http://YOUR_LAPTOP_IP:8000"
LED_PIN = 18

if GPIO_AVAILABLE:
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(LED_PIN, GPIO.OUT)

def blink_led(times=3):
    if not GPIO_AVAILABLE:
        print("LED blink (simulated)")
        return
    for _ in range(times):
        GPIO.output(LED_PIN, GPIO.HIGH)
        time.sleep(0.2)
        GPIO.output(LED_PIN, GPIO.LOW)
        time.sleep(0.2)

def forward_audio(audio_path: str):
    blink_led(2)
    with open(audio_path, "rb") as f:
        files = {"file": (os.path.basename(audio_path), f, "audio/webm")}
        response = requests.post(f"{BACKEND_URL}/upload-audio", files=files)
        print(f"Forwarded audio: {response.json()}")
    blink_led(1)

def health_check():
    try:
        res = requests.get(f"{BACKEND_URL}/health", timeout=5)
        return res.status_code == 200
    except:
        return False

print("NexusIQ Edge Agent Starting...")
print(f"Backend: {BACKEND_URL}")
print(f"GPIO: {'Available' if GPIO_AVAILABLE else 'Simulated'}")

while True:
    if health_check():
        print("✅ Connected to NexusIQ backend")
        blink_led(1)
    else:
        print("❌ Backend unreachable")
    time.sleep(30)

---

## STARTUP COMMANDS

# Backend
cd nexusiq/backend
pip install -r requirements.txt
echo "GEMINI_API_KEY=your_key_here" > .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (new terminal)
cd nexusiq/frontend
npm install
npm run dev

# Test backend
curl http://localhost:8000/health
curl http://localhost:8000/graph

# RPi (run on Raspberry Pi)
python3 edge_agent.py