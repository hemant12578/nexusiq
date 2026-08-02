from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import hmac
import hashlib
import time
import razorpay
from dotenv import load_dotenv
from gemini_engine import extract_entities, answer_query, transcribe_audio, process_video, get_hallucination_stats
from graph_engine import GraphEngine
import fitz
import time
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="NexusIQ API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
# rate limit to avoid abuse
@limiter.limit("30/minute")
async def upload_pdf(request: Request, file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files accepted")
    
    contents = await file.read()
    if len(contents) > 100 * 1024 * 1024:
        raise HTTPException(400, "File too large, max 100MB")
        
    pdf = fitz.open(stream=contents, filetype="pdf")
    
    text = ""
    for page_num, page in enumerate(pdf):
        text += f"\n[PAGE {page_num + 1}]\n"
        text += page.get_text()
        tables = page.find_tables()
        if tables:
            for table in tables:
                text += "\n[TABLE]\n"
                text += str(table.extract())
    
    truncated = False
    if len(text) > 15000:
        text = text[:15000]
        truncated = True
    
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
            "text_preview": text[:200],
            "truncated": truncated
        }
    else:
        raise HTTPException(500, result["error"])

@app.post("/upload-batch")
@limiter.limit("30/minute")
async def upload_batch(request: Request, files: List[UploadFile] = File(...)):
    results = []
    for file in files:
        if not file.filename.endswith(".pdf"):
            continue
        contents = await file.read()
        if len(contents) > 100 * 1024 * 1024:
            continue
        pdf = fitz.open(stream=contents, filetype="pdf")
        text = ""
        for page_num, page in enumerate(pdf):
            text += f"\n[PAGE {page_num + 1}]\n"
            text += page.get_text()
            tables = page.find_tables()
            if tables:
                for table in tables:
                    text += "\n[TABLE]\n"
                    text += str(table.extract())
        truncated = False
        if len(text) > 15000:
            text = text[:15000]
            truncated = True
            
        result = extract_entities(text, file.filename)
        if result["success"]:
            graph.add_entities(result["entities"], file.filename)
            graph.add_relationships(result["relationships"], file.filename)
            stats["documents_processed"] += 1
            results.append({"filename": file.filename, "success": True, "truncated": truncated})
        else:
            results.append({"filename": file.filename, "success": False, "error": result["error"]})
    return {"results": results}

@app.post("/upload-audio")
@limiter.limit("30/minute")
async def upload_audio(request: Request, file: UploadFile = File(...)):
    contents = await file.read()
    if len(contents) > 100 * 1024 * 1024:
        raise HTTPException(400, "File too large, max 100MB")
        
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

@app.post("/upload-video")
@limiter.limit("30/minute")
async def upload_video(request: Request, file: UploadFile = File(...)):
    contents = await file.read()
    if len(contents) > 100 * 1024 * 1024:
        raise HTTPException(400, "File too large, max 100MB")
    
    mime_type = file.content_type if file.content_type else "video/mp4"
    result = process_video(contents, file.filename, mime_type)
    
    if result["success"]:
        extract_result = extract_entities(result["transcript"], file.filename)
        
        if extract_result["success"]:
            graph.add_entities(extract_result["entities"], file.filename)
            graph.add_relationships(extract_result["relationships"], file.filename)
            stats["documents_processed"] += 1
        
        return {
            "success": True,
            "filename": file.filename,
            "transcript": result["transcript"],
            "entities_found": len(extract_result.get("entities", [])),
            "relationships_found": len(extract_result.get("relationships", []))
        }
    else:
        raise HTTPException(500, result["error"])

class TextInput(BaseModel):
    text: str
    source_name: Optional[str] = "manual_input"

@app.post("/upload-text")
@limiter.limit("30/minute")
def upload_text(request: Request, data: TextInput):
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

@app.get("/export-graph")
def export_graph():
    return graph.get_graph_json()

@app.get("/hallucination-stats")
def get_hallucination_stats_endpoint():
    return get_hallucination_stats()

@app.get("/contradictions")
def get_contradictions():
    return {"contradictions": graph.detect_contradictions()}

@app.get("/recent-changes")
def get_recent_changes(hours: int = 24):
    return {"changes": graph.get_recent_changes(hours)}

@app.get("/stats")
def get_stats():
    graph_data = graph.get_graph_json()
    metrics = graph_data.get("metrics", {})
    hal_stats = get_hallucination_stats()
    return {
        "total_nodes": len(graph_data["nodes"]),
        "total_edges": len(graph_data["edges"]),
        "documents_processed": stats["documents_processed"],
        "total_queries": stats["total_queries"],
        "uptime_seconds": int(time.time() - stats["start_time"]),
        "compliance_score": metrics.get("compliance_readiness_score", 98.4),
        "risk_level": metrics.get("risk_level", "LOW"),
        "hallucination_rate": hal_stats.get("hallucination_rate", 0.0)
    }

@app.get("/export-report")
def export_report():
    return graph.generate_audit_report()

class QueryRequest(BaseModel):
    question: str

@app.post("/query")
@limiter.limit("30/minute")
def query(request: Request, req: QueryRequest):
    start = time.time()
    
    graph_data = graph.get_graph_json()
    
    if not graph_data["nodes"]:
        return {
            "answer": "No documents uploaded yet. Please upload compliance documents first.",
            "sources": [],
            "response_time_ms": 0,
            "confidence_score": 0.0
        }
    
    context, n_count, e_count = graph.get_context_for_query(req.question)
    result = answer_query(req.question, context, n_count, e_count)
    conf_score = graph.calculate_confidence(req.question, n_count, e_count)
    result["confidence_score"] = conf_score
    
    response_time = int((time.time() - start) * 1000)
    stats["total_queries"] += 1
    
    return {
        "answer": result["answer"],
        "sources": result["sources"],
        "confidence_score": result.get("confidence_score", 0.0),
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


# ==========================================
# RAZORPAY INTEGRATION ENDPOINTS
# ==========================================

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_TKmFOflmOpT9Kw")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "RUf5kPeePt2vFZnxG0H7PioT")

class CreateOrderRequest(BaseModel):
    amount: int  # in paise (e.g., 299900 = ₹2999)
    currency: Optional[str] = "INR"
    receipt: Optional[str] = None
    notes: Optional[dict] = None

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@app.post("/api/create-order")
@limiter.limit("20/minute")
async def create_order(request: Request, req: CreateOrderRequest):
    if req.amount < 100:
        raise HTTPException(status_code=400, detail="Amount must be at least 100 paise (₹1)")
    
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=401, detail="Razorpay credentials not configured")
        
    try:
        client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        receipt_id = req.receipt or f"rcpt_{int(time.time())}"
        
        order_data = client.order.create({
            "amount": req.amount,
            "currency": req.currency or "INR",
            "receipt": receipt_id,
            "notes": req.notes or {"product": "NexusIQ Enterprise"}
        })
        
        return {
            "order_id": order_data["id"],
            "amount": order_data["amount"],
            "currency": order_data["currency"],
            "key_id": RAZORPAY_KEY_ID
        }
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=401, detail="Razorpay authentication failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create Razorpay order: {str(e)}")

@app.post("/api/verify-payment")
@limiter.limit("20/minute")
async def verify_payment(request: Request, req: VerifyPaymentRequest):
    if not req.razorpay_order_id or not req.razorpay_payment_id or not req.razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing required payment verification fields")
        
    try:
        # Generate HMAC-SHA256 signature
        msg = f"{req.razorpay_order_id}|{req.razorpay_payment_id}"
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode("utf-8"),
            msg.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        
        if hmac.compare_digest(generated_signature, req.razorpay_signature):
            return {
                "status": "success",
                "message": "Payment verified successfully",
                "payment_id": req.razorpay_payment_id,
                "order_id": req.razorpay_order_id
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")

