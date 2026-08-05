import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=0.5*inch,
        leftMargin=0.5*inch,
        topMargin=0.5*inch,
        bottomMargin=0.5*inch
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette - Modern Dark Theme accents on crisp white page
    primary_color = colors.HexColor("#4F46E5")   # Indigo
    secondary_color = colors.HexColor("#7C3AED") # Purple
    accent_dark = colors.HexColor("#0F172A")     # Slate 900
    text_dark = colors.HexColor("#1E293B")       # Slate 800
    text_muted = colors.HexColor("#64748B")      # Slate 500
    bg_light = colors.HexColor("#F8FAFC")        # Slate 50
    border_color = colors.HexColor("#E2E8F0")    # Slate 200
    card_bg = colors.HexColor("#EEF2FF")         # Soft Indigo tint

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        alignment=0, # Left-aligned
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=secondary_color,
        spaceAfter=15
    )

    meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=text_muted,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=accent_dark,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=text_dark,
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=4,
        spaceAfter=4
    )

    box_title_style = ParagraphStyle(
        'BoxTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=primary_color,
        spaceAfter=4
    )

    story = []

    # HEADER / COVER TITLE BLOCK
    story.append(Paragraph("NexusIQ 🧠 — Master Technical Architecture", title_style))
    story.append(Paragraph("Special Briefing & Presentation Guide for Senior Engineering Advisor: <b>Sumit Sharan (Mama Ji)</b>", subtitle_style))
    story.append(Paragraph("<b>Event:</b> InnovaHack Chapter 1 National Hackathon 2026 (Round 2 Finals — Domain 3: Gen AI)<br/><b>Live App:</b> https://nexusiq2.vercel.app | <b>Backend API:</b> https://nexusiq-backend-production.up.railway.app", meta_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=0, spaceAfter=12))

    # SECTION 1: PROBLEM STATEMENT & VALUE PROPOSITION
    story.append(Paragraph("1. Executive Problem Statement & Core Value Proposition", h1_style))
    story.append(Paragraph(
        "In modern enterprises, compliance audits (ISO 27001, GDPR, HIPAA, SOC 2, EU AI Act) require sifting through thousands of multi-modal documents (PDFs, audio recordings, video transcripts, and physical server room hardware telemetry).",
        body_style
    ))
    story.append(Paragraph(
        "<b>The Flaw of Standard Vector RAG:</b> Traditional Enterprise AI uses vector embeddings (chunking text into vector databases). In strict compliance environments, vector RAG fails catastrophically due to:",
        body_style
    ))
    story.append(Paragraph("• <b>Blind Chunking:</b> Severing sentences destroys multi-page policy relationships (e.g., <i>'Section A applies unless overridden by Section B on page 40'</i>).", bullet_style))
    story.append(Paragraph("• <b>AI Hallucinations:</b> Cosine similarity pulls 'sounds related' chunks, leading the LLM to invent non-existent rules. In compliance, an AI hallucination leads to immediate legal lawsuits.", bullet_style))
    story.append(Paragraph("• <b>Physical Disconnect:</b> Software vector databases are completely blind to real-world physical events (e.g., server room thermal spikes or hardware failures).", bullet_style))

    story.append(Spacer(1, 6))

    # Highlight Card
    solution_text = "<b>The NexusIQ Solution:</b> NexusIQ replaces raw vector lookups with a <b>Directed Knowledge Graph RAG Engine</b> paired with a physical <b>IoT Edge Hardware Feed</b>. Every policy, person, and hardware device becomes an explicit Node, and every rule becomes a Directed Edge. Queries execute via <b>2-Hop BFS Subgraph Traversal</b>, forcing the LLM to provide 100% citation-grounded answers with zero hallucination."
    card_table = Table(
        [[Paragraph(solution_text, body_style)]],
        colWidths=[7.5*inch]
    )
    card_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), card_bg),
        ('BOX', (0,0), (-1,-1), 1, primary_color),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(card_table)
    story.append(Spacer(1, 10))

    # SECTION 2: SYSTEM ARCHITECTURE & DIAGRAMS
    story.append(Paragraph("2. System Architecture & Component Breakdown", h1_style))
    story.append(Paragraph(
        "NexusIQ is built across 5 decoupled production layers designed for zero-latency execution, multi-model resilience, and real-time physical edge telemetry.",
        body_style
    ))

    arch_data = [
        ["Layer", "Technology Stack", "Role & Function"],
        ["Layer 1: IoT Edge", "ESP32 DevKit V1 + RPi Gateway", "Reads DHT11 temp/humidity every 2s. Trips 4-relay fan control at >=32°C. Posts physical incidents to backend on port 5001."],
        ["Layer 2: Frontend", "React 18, Vite, D3.js, Three.js", "Renders 2D force-directed knowledge graph (D3.js), 3D starfield canvas (Three.js), and interactive spotlight onboarding tour."],
        ["Layer 3: Backend", "FastAPI, NetworkX, PyMuPDF, SlowAPI", "Async Python REST API maintaining NetworkX DiGraph in memory. Computes dynamic compliance readiness math & handles SSE."],
        ["Layer 4: AI Layer", "Lyzr SuperFlow, Gemini 2.5, OpenRouter", "Primary: Lyzr AI SuperFlow Agentic Webhook. Multimodal Base: Gemini 2.5. Fallback: LLaMA 3.3 70B via OpenRouter."],
        ["Layer 5: Database", "Supabase PostgreSQL, Firebase Auth", "Stores full graph state JSON in `nexusiq_graphs` table. Handles Google OAuth & user query audit logs in Firestore."]
    ]
    arch_table = Table(arch_data, colWidths=[1.4*inch, 2.0*inch, 4.1*inch])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,1), (-1,-1), bg_light),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8.5),
        ('LEADING', (0,1), (-1,-1), 11),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 10))

    # SECTION 3: WORKFLOW ARCHITECTURE DIAGRAMS (TEXTUAL / STRUCTURAL)
    story.append(Paragraph("3. Detailed System Workflow Architecture", h1_style))

    story.append(Paragraph("A. Document Ingestion & Graph Extraction Workflow", h2_style))
    story.append(Paragraph("1. User uploads PDF/Audio/Text via React UI (UploadPanel).", bullet_style))
    story.append(Paragraph("2. FastAPI passes text/file to PyMuPDF or Gemini 1.5 Pro audio transcription engine.", bullet_style))
    story.append(Paragraph("3. Google Gemini 2.5 Flash extracts entities & relationships matching explicit JSON schema.", bullet_style))
    story.append(Paragraph("4. NetworkX Engine ingests nodes/edges with canonical deduplication & updates Supabase PostgreSQL.", bullet_style))
    story.append(Paragraph("5. Server-Sent Events (SSE) stream `upload` signal to frontend -> D3.js graph animates live.", bullet_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("B. Zero-Hallucination Graph RAG Query Workflow", h2_style))
    story.append(Paragraph("1. User types natural language question in chat interface.", bullet_style))
    story.append(Paragraph("2. Backend extracts target entity keywords & executes 2-Hop Breadth-First Search (BFS) in NetworkX graph.", bullet_style))
    story.append(Paragraph("3. Subgraph context is formatted into grounded assertion block: <i>[SOURCE: ISO_27001.pdf] Node A -> GOVERNS -> Node B</i>.", bullet_style))
    story.append(Paragraph("4. Grounded block is sent to Lyzr AI SuperFlow webhook for deterministic answer generation.", bullet_style))
    story.append(Paragraph("5. Answer is parsed for citations. Hallucination metric updates (0.0% rate maintained).", bullet_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("C. Physical IoT Edge Hardware Incident Workflow", h2_style))
    story.append(Paragraph("1. ESP32 DHT11 sensor monitors server room temperature every 2 seconds.", bullet_style))
    story.append(Paragraph("2. If temp >= 32°C, ESP32 trips 4-channel active-low relay (emergency fan shutdown) and POSTs alert to RPi on port 5001.", bullet_style))
    story.append(Paragraph("3. Raspberry Pi forwards payload to Cloud Backend (`POST /upload-text`).", bullet_style))
    story.append(Paragraph("4. Backend creates red Alert Node, penalizes Compliance Readiness score (-10%), and pushes SSE event to live feed.", bullet_style))

    story.append(Spacer(1, 10))

    # SECTION 4: MATHEMATICAL & ALGORITHMIC FORMULAS
    story.append(Paragraph("4. Mathematical Models & Scoring Formulas", h1_style))

    formula_box = [
        [Paragraph("<b>Dynamic Compliance Readiness Score Formula:</b>", box_title_style)],
        [Paragraph("<b>Score = Clamp( 50 + (5 × F) + (2 × P) + (1 × R) - (10 × C) - (5 × V) , 0 , 100 )</b>", ParagraphStyle('FormulaText', parent=body_style, fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor("#1E1B4B")))],
        [Paragraph("• <b>F</b> = Count of recognized Compliance Framework entities (ISO 27001, GDPR, HIPAA, etc.)<br/>• <b>P</b> = Count of Policy nodes in graph | <b>R</b> = Count of verified Relationship edges<br/>• <b>C</b> = Count of Critical Thermal/Security Incident nodes (-10% penalty per incident)<br/>• <b>V</b> = Count of unresolved Violation nodes (-5% penalty per violation)", body_style)]
    ]
    formula_table = Table(formula_box, colWidths=[7.5*inch])
    formula_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F3F4F6")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#9CA3AF")),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(formula_table)

    story.append(Spacer(1, 10))

    # SECTION 5: HACKATHON FINALS DEMO SCRIPT & STRATEGY FOR SUMIT SHARAN
    story.append(Paragraph("5. 5-Minute Pitch Script & Strategy (For Sumit Sharan)", h1_style))
    story.append(Paragraph(
        "As Senior Engineering Advisor & Lead Presenter, use this step-by-step 5-minute demonstration script to captivate the judges:",
        body_style
    ))

    script_data = [
        ["Time", "Action on Screen", "Exact Script to Memorize & Deliver"],
        [
            "0:00 - 1:00",
            "Show Landing Page (nexusiq2.vercel.app)",
            "<b>'Honorable judges, traditional enterprise AI fails in compliance because vector chunking destroys context and leads to hallucinations. In compliance, a single AI hallucination leads to a multi-million dollar lawsuit. Welcome to NexusIQ: the world\'s first Zero-Hallucination Compliance Platform powered by Knowledge Graphs, Lyzr AI SuperFlow, and IoT Edge hardware.'</b>"
        ],
        [
            "1:00 - 2:00",
            "Click 'Enter Workspace' & point to StatsBar",
            "<b>'Notice our top metrics bar. Our Compliance Score (87.5%) and Hallucination Rate (0.0%) are not hardcoded numbers—they are calculated live from graph mathematics via our FastAPI backend.'</b>"
        ],
        [
            "2:00 - 3:00",
            "Drag & drop ISO 27001 PDF into Upload Panel",
            "<b>'Watch what happens when we upload an ISO 27001 document. Google Gemini extracts entities and relationships. Look at our D3.js canvas: nodes for ISO 27001, Encryption Policy, and Lead Auditor form live in real-time.'</b>"
        ],
        [
            "3:00 - 4:00",
            "Type in chat: 'What are our retention policies?'",
            "<b>'When we ask a question, NexusIQ runs a 2-hop BFS on our graph and passes context to Lyzr AI SuperFlow. Notice the answer: it explicitly cites [SOURCE: ISO_27001_Section_4.pdf]. If data isn\'t in the graph, it strictly refuses to answer.'</b>"
        ],
        [
            "4:00 - 5:00",
            "Click 'Trigger Edge Incident' & Export Report",
            "<b>'Compliance is not just digital; it\'s physical. We connected custom ESP32 hardware. When server room temp exceeds 32C, a red Alert Node appears and our score drops by 10%. NexusIQ bridges physical and digital compliance into one zero-hallucination platform. Thank you!'</b>"
        ]
    ]

    script_table = Table(script_data, colWidths=[0.9*inch, 2.1*inch, 4.5*inch])
    script_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), secondary_color),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8.5),
        ('BOTTOMPADDING', (0,0), (-1,0), 5),
        ('TOPPADDING', (0,0), (-1,0), 5),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,1), (-1,-1), colors.white),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('LEADING', (0,1), (-1,-1), 11),
    ]))
    story.append(script_table)

    story.append(Spacer(1, 14))

    # FOOTER & TEAM CREDITS
    team_text = "<b>Team NexusIQ:</b> Hemant Prakash (Lead Full Stack & AI Architect) | Shubham Kumar (QA Lead) | <b>Sumit Sharan / Mama Ji (Senior Engineering Advisor, Developer & Presentation Lead)</b>"
    story.append(Paragraph(team_text, meta_style))

    doc.build(story)
    print(f"Successfully generated PDF: {filename}")

if __name__ == '__main__':
    out_path = "M:\\NexusIQ\\NexusIQ_Master_Briefing_Sumit_Sharan.pdf"
    build_pdf(out_path)
