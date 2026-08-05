import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.graphics.shapes import (
    Drawing, Rect, String, Line, Group, Polygon
)

def create_architecture_diagram():
    """Native vector drawing of High-Level 5-Layer System Architecture"""
    d = Drawing(540, 210)
    
    # Background card container
    d.add(Rect(0, 0, 540, 210, fillColor=colors.HexColor("#F8FAFC"), strokeColor=colors.HexColor("#CBD5E1"), strokeWidth=1, rx=8, ry=8))

    # Title label inside drawing
    d.add(String(15, 192, "FIGURE 1: NEXUSIQ END-TO-END SYSTEM ARCHITECTURE", fontName="Helvetica-Bold", fontSize=9, fillColor=colors.HexColor("#4F46E5")))

    # Function to draw styled box
    def draw_box(x, y, w, h, bg_color, border_color, title, subtitle):
        d.add(Rect(x, y, w, h, fillColor=bg_color, strokeColor=border_color, strokeWidth=1.5, rx=5, ry=5))
        d.add(String(x + 8, y + h - 14, title, fontName="Helvetica-Bold", fontSize=8.5, fillColor=colors.HexColor("#0F172A")))
        
        # Split subtitle by line break if needed
        lines = subtitle.split("\n")
        curr_y = y + h - 26
        for line in lines:
            d.add(String(x + 8, curr_y, line, fontName="Helvetica", fontSize=7.5, fillColor=colors.HexColor("#475569")))
            curr_y -= 10

    # Layer 1: IoT Edge (Left)
    draw_box(15, 105, 155, 70, colors.HexColor("#FEF3C7"), colors.HexColor("#F59E0B"), 
             "1. IoT Edge Hardware", "ESP32 + DHT11 (GPIO 4)\n4-Relay Fan Stop (GPIO 26)\nRPi Gateway (Port 5001)")

    # Layer 2: Frontend SPA (Top Middle)
    draw_box(190, 105, 160, 70, colors.HexColor("#EEF2FF"), colors.HexColor("#6366F1"), 
             "2. Frontend Web SPA", "Vite + React 18 (Vercel)\nD3.js 2D Force Graph\nThree.js 3D Constellation")

    # Layer 3: Backend Core Engine (Right)
    draw_box(370, 105, 155, 70, colors.HexColor("#F0FDF4"), colors.HexColor("#10B981"), 
             "3. FastAPI Cloud Engine", "FastAPI Server (Railway)\nNetworkX DiGraph Engine\nDynamic Scoring Math")

    # Layer 4: Multi-Model AI Layer (Bottom Left-Middle)
    draw_box(15, 15, 250, 70, colors.HexColor("#FAF5FF"), colors.HexColor("#A855F7"), 
             "4. Agentic Multi-Model AI Layer", "Primary: Lyzr AI SuperFlow Webhook Agent\nBase: Google Gemini 2.5 Flash (Multimodal)\nFallback: OpenRouter LLaMA 3.3 70B -> Regex")

    # Layer 5: Persistence & Payments (Bottom Right)
    draw_box(280, 15, 245, 70, colors.HexColor("#ECFEFF"), colors.HexColor("#06B6D4"), 
             "5. Persistence & Security", "Supabase PostgreSQL (nexusiq_graphs)\nFirebase Auth & Cloud Firestore\nRazorpay HMAC Payment Verification")

    # Arrows & Connections
    def draw_arrow(x1, y1, x2, y2, color=colors.HexColor("#64748B")):
        d.add(Line(x1, y1, x2, y2, strokeColor=color, strokeWidth=1.5))
        # Arrowhead
        if x1 < x2: # Pointing Right
            d.add(Polygon([x2, y2, x2 - 5, y2 + 3, x2 - 5, y2 - 3], fillColor=color, strokeColor=color))
        elif x1 > x2: # Pointing Left
            d.add(Polygon([x2, y2, x2 + 5, y2 + 3, x2 + 5, y2 - 3], fillColor=color, strokeColor=color))
        elif y1 > y2: # Pointing Down
            d.add(Polygon([x2, y2, x2 - 3, y2 + 5, x2 + 3, y2 + 5], fillColor=color, strokeColor=color))
        elif y1 < y2: # Pointing Up
            d.add(Polygon([x2, y2, x2 - 3, y2 - 5, x2 + 3, y2 - 5], fillColor=color, strokeColor=color))

    # Connection lines
    draw_arrow(170, 140, 190, 140)  # Edge -> Frontend
    draw_arrow(350, 140, 370, 140)  # Frontend -> Backend
    draw_arrow(445, 105, 445, 85)   # Backend -> Layer 5 (DB)
    draw_arrow(400, 105, 265, 85)   # Backend -> Layer 4 (AI)

    return d

def create_workflow_diagram():
    """Native vector drawing of Graph RAG 2-Hop BFS Traversal Workflow"""
    d = Drawing(540, 105)
    
    # Background container
    d.add(Rect(0, 0, 540, 105, fillColor=colors.HexColor("#F8FAFC"), strokeColor=colors.HexColor("#CBD5E1"), strokeWidth=1, rx=8, ry=8))

    d.add(String(15, 88, "FIGURE 2: ZERO-HALLUCINATION GRAPH RAG QUERY WORKFLOW", fontName="Helvetica-Bold", fontSize=9, fillColor=colors.HexColor("#4F46E5")))

    # 5 Workflow Stage Boxes
    stages = [
        ("1. User Query", "NL Question\nInput", colors.HexColor("#E0E7FF"), colors.HexColor("#4F46E5")),
        ("2. FastAPI Route", "Extract Keyword\nEntities", colors.HexColor("#F1F5F9"), colors.HexColor("#64748B")),
        ("3. 2-Hop BFS", "Extract Local\nSubgraph", colors.HexColor("#FEF3C7"), colors.HexColor("#D97706")),
        ("4. Lyzr Agent", "Grounded Context\nVerification", colors.HexColor("#F3E8FF"), colors.HexColor("#9333EA")),
        ("5. Cited Answer", "0.0% Hallucination\nOutput", colors.HexColor("#DCFCE7"), colors.HexColor("#16A34A"))
    ]

    box_w = 90
    gap = 16
    start_x = 15
    y = 15
    h = 60

    for i, (title, subtitle, bg, border) in enumerate(stages):
        x = start_x + i * (box_w + gap)
        d.add(Rect(x, y, box_w, h, fillColor=bg, strokeColor=border, strokeWidth=1.5, rx=4, ry=4))
        d.add(String(x + 5, y + h - 14, title, fontName="Helvetica-Bold", fontSize=8, fillColor=colors.HexColor("#0F172A")))
        
        lines = subtitle.split("\n")
        curr_y = y + h - 26
        for line in lines:
            d.add(String(x + 5, curr_y, line, fontName="Helvetica", fontSize=7.5, fillColor=colors.HexColor("#334155")))
            curr_y -= 10

        # Arrow to next box
        if i < len(stages) - 1:
            arrow_x1 = x + box_w
            arrow_x2 = arrow_x1 + gap
            arrow_y = y + (h / 2)
            d.add(Line(arrow_x1, arrow_y, arrow_x2, arrow_y, strokeColor=colors.HexColor("#64748B"), strokeWidth=1.5))
            d.add(Polygon([arrow_x2, arrow_y, arrow_x2 - 4, arrow_y + 3, arrow_x2 - 4, arrow_y - 3], fillColor=colors.HexColor("#64748B"), strokeColor=colors.HexColor("#64748B")))

    return d

def create_hardware_diagram():
    """Native vector drawing of Physical IoT Thermal Incident Workflow"""
    d = Drawing(540, 105)
    
    # Background container
    d.add(Rect(0, 0, 540, 105, fillColor=colors.HexColor("#FFF1F2"), strokeColor=colors.HexColor("#FECDD3"), strokeWidth=1, rx=8, ry=8))

    d.add(String(15, 88, "FIGURE 3: PHYSICAL HARDWARE THERMAL INCIDENT PIPELINE", fontName="Helvetica-Bold", fontSize=9, fillColor=colors.HexColor("#E11D48")))

    stages = [
        ("ESP32 Sensor", "Temp >= 32°C\nBreach Alert", colors.HexColor("#FFE4E6"), colors.HexColor("#E11D48")),
        ("4-Relay Control", "Emergency Fan\nStop (GPIO 26)", colors.HexColor("#FEF3C7"), colors.HexColor("#D97706")),
        ("RPi Gateway", "POST Port 5001\nQueue Buffer", colors.HexColor("#F1F5F9"), colors.HexColor("#64748B")),
        ("FastAPI Cloud", "Inject Alert Node\n-10% Score Math", colors.HexColor("#F3E8FF"), colors.HexColor("#9333EA")),
        ("Live React UI", "Red Alert Badge\nSSE Event Feed", colors.HexColor("#DCFCE7"), colors.HexColor("#16A34A"))
    ]

    box_w = 90
    gap = 16
    start_x = 15
    y = 15
    h = 60

    for i, (title, subtitle, bg, border) in enumerate(stages):
        x = start_x + i * (box_w + gap)
        d.add(Rect(x, y, box_w, h, fillColor=bg, strokeColor=border, strokeWidth=1.5, rx=4, ry=4))
        d.add(String(x + 5, y + h - 14, title, fontName="Helvetica-Bold", fontSize=8, fillColor=colors.HexColor("#0F172A")))
        
        lines = subtitle.split("\n")
        curr_y = y + h - 26
        for line in lines:
            d.add(String(x + 5, curr_y, line, fontName="Helvetica", fontSize=7.5, fillColor=colors.HexColor("#334155")))
            curr_y -= 10

        if i < len(stages) - 1:
            arrow_x1 = x + box_w
            arrow_x2 = arrow_x1 + gap
            arrow_y = y + (h / 2)
            d.add(Line(arrow_x1, arrow_y, arrow_x2, arrow_y, strokeColor=colors.HexColor("#E11D48"), strokeWidth=1.5))
            d.add(Polygon([arrow_x2, arrow_y, arrow_x2 - 4, arrow_y + 3, arrow_x2 - 4, arrow_y - 3], fillColor=colors.HexColor("#E11D48"), strokeColor=colors.HexColor("#E11D48")))

    return d

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

    # Premium Executive Color Palette
    primary_color = colors.HexColor("#4F46E5")   # Indigo
    secondary_color = colors.HexColor("#7C3AED") # Purple
    accent_dark = colors.HexColor("#0F172A")     # Slate 900
    text_dark = colors.HexColor("#1E293B")       # Slate 800
    text_muted = colors.HexColor("#64748B")      # Slate 500
    bg_light = colors.HexColor("#F8FAFC")        # Slate 50
    border_color = colors.HexColor("#CBD5E1")    # Slate 300
    card_bg = colors.HexColor("#EEF2FF")         # Soft Indigo

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=primary_color,
        alignment=0,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=secondary_color,
        spaceAfter=10
    )

    meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=text_muted,
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13.5,
        leading=17,
        textColor=accent_dark,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=primary_color,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=text_dark,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=text_dark
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell_style,
        fontName='Helvetica-Bold',
        textColor=accent_dark
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    box_title_style = ParagraphStyle(
        'BoxTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=primary_color,
        spaceAfter=3
    )

    story = []

    # HEADER / COVER TITLE BLOCK
    story.append(Paragraph("NexusIQ 🧠 — Master Technical Architecture & Product Briefing", title_style))
    story.append(Paragraph("Prepared for Senior Engineering Advisor & Lead Presenter: <b>Sumit Sharan</b>", subtitle_style))
    story.append(Paragraph("<b>Event:</b> InnovaHack Chapter 1 National Hackathon 2026 (Round 2 Finals — Domain 3: Gen AI)<br/><b>Live App:</b> https://nexusiq2.vercel.app | <b>Backend API:</b> https://nexusiq-backend-production.up.railway.app | <b>GitHub:</b> github.com/hemant12578/nexusiq", meta_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=0, spaceAfter=10))

    # SECTION 1: PROBLEM STATEMENT & VALUE PROPOSITION
    story.append(Paragraph("1. Executive Problem Statement & Solution Architecture", h1_style))
    story.append(Paragraph(
        "In modern enterprises, compliance audits (ISO 27001, GDPR, HIPAA, SOC 2, EU AI Act) require evaluating thousands of regulatory documents, vendor contracts, audio logs, and physical server room hardware security telemetry.",
        body_style
    ))
    story.append(Paragraph(
        "<b>The Flaw of Standard Vector RAG:</b> Traditional Enterprise AI tools use vector embeddings (chunking text into vector databases). In strict compliance environments, vector RAG fails due to three critical flaws:",
        body_style
    ))
    story.append(Paragraph("• <b>Blind Chunking:</b> Severing sentences destroys multi-page policy relationships (e.g., <i>'Section A applies EXCEPT when overridden by Section B on page 40'</i>).", bullet_style))
    story.append(Paragraph("• <b>AI Hallucinations:</b> Cosine similarity pulls 'sounds related' chunks, prompting the LLM to invent missing facts. In compliance, an AI hallucination leads directly to legal lawsuits.", bullet_style))
    story.append(Paragraph("• <b>Physical Disconnect:</b> Software vector databases are blind to real-world physical events (e.g., server room thermal spikes or hardware failures).", bullet_style))

    story.append(Spacer(1, 4))

    # Solution Highlight Box
    solution_text = "<b>The NexusIQ Solution:</b> NexusIQ replaces raw vector lookups with a <b>Directed Knowledge Graph RAG Engine</b> paired with a physical <b>IoT Edge Hardware Feed</b>. Every policy, person, and hardware device becomes an explicit Node, and every rule becomes a Directed Edge. Queries execute via <b>2-Hop BFS Subgraph Traversal</b>, forcing the LLM to provide 100% citation-grounded answers with zero hallucination."
    card_table = Table([[Paragraph(solution_text, body_style)]], colWidths=[7.5*inch])
    card_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), card_bg),
        ('BOX', (0,0), (-1,-1), 1, primary_color),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(card_table)
    story.append(Spacer(1, 8))

    # SECTION 2: SYSTEM ARCHITECTURE & DIAGRAM 1
    story.append(Paragraph("2. System Architecture & 5-Layer Component Breakdown", h1_style))
    story.append(Paragraph(
        "NexusIQ is built across 5 decoupled production layers designed for zero-latency execution, multi-model resilience, and real-time physical edge telemetry.",
        body_style
    ))

    # VECTOR DIAGRAM 1: System Architecture
    story.append(create_architecture_diagram())
    story.append(Spacer(1, 8))

    # Table of Layers
    arch_data = [
        [Paragraph("Layer", table_header_style), Paragraph("Technology Stack", table_header_style), Paragraph("Role & Detailed Production Function", table_header_style)],
        [
            Paragraph("Layer 1: IoT Edge", table_cell_bold),
            Paragraph("ESP32 DevKit V1<br/>Raspberry Pi Gateway", table_cell_style),
            Paragraph("Reads DHT11 temp/humidity every 2s. Trips 4-channel active-low relay fan control at >=32°C. RPi listens on port 5001 and posts physical alerts to Railway backend.", table_cell_style)
        ],
        [
            Paragraph("Layer 2: Frontend", table_cell_bold),
            Paragraph("React 18, Vite, D3.js,<br/>Three.js (Vercel)", table_cell_style),
            Paragraph("Renders 2D force-directed knowledge graph (D3.js), 3D starfield canvas (Three.js), interactive spotlight onboarding tour (`OnboardingTour.jsx`), and live SSE event stream.", table_cell_style)
        ],
        [
            Paragraph("Layer 3: Backend", table_cell_bold),
            Paragraph("FastAPI, NetworkX,<br/>PyMuPDF, SlowAPI", table_cell_style),
            Paragraph("Async Python REST API maintaining NetworkX DiGraph in memory. Computes dynamic compliance readiness math, tracks hallucination rates, and streams SSE feed.", table_cell_style)
        ],
        [
            Paragraph("Layer 4: AI Layer", table_cell_bold),
            Paragraph("Lyzr AI SuperFlow,<br/>Gemini 2.5, OpenRouter", table_cell_style),
            Paragraph("Primary: Lyzr AI SuperFlow Agentic Webhook. Multimodal Base: Gemini 2.5 Flash (PDF/Audio/Video). Fallback: LLaMA 3.3 70B via OpenRouter -> Local Regex Extractor.", table_cell_style)
        ],
        [
            Paragraph("Layer 5: Database", table_cell_bold),
            Paragraph("Supabase PostgreSQL,<br/>Firebase Auth & Firestore", table_cell_style),
            Paragraph("Stores full graph state JSON in `nexusiq_graphs` table. Handles Google OAuth & user query audit logs in Firestore. Razorpay HMAC verification for subscriptions.", table_cell_style)
        ]
    ]
    arch_table = Table(arch_data, colWidths=[1.2*inch, 1.8*inch, 4.5*inch])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,1), (-1,-1), bg_light),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(arch_table)

    story.append(Spacer(1, 10))

    # SECTION 3: WORKFLOW ARCHITECTURES & VECTOR DIAGRAMS 2 & 3
    story.append(Paragraph("3. Detailed System Workflow Pipelines", h1_style))

    story.append(Paragraph("A. Zero-Hallucination Graph RAG Query Pipeline", h2_style))
    story.append(Paragraph("When a user asks a question, NexusIQ runs a 2-Hop Breadth-First Search (BFS) graph traversal to extract connected assertions, passing them to Lyzr AI SuperFlow to guarantee 100% cited answers.", body_style))
    story.append(create_workflow_diagram())

    story.append(Spacer(1, 8))

    story.append(Paragraph("B. Physical IoT Edge Hardware Incident Pipeline", h2_style))
    story.append(Paragraph("When server room temperatures exceed 32°C, ESP32 hardware trips an emergency relay and posts an alert to the Raspberry Pi, which logs an ISO 27001 physical security violation directly into the graph.", body_style))
    story.append(create_hardware_diagram())

    story.append(Spacer(1, 10))

    # SECTION 4: MATHEMATICAL MODELS & FORMULAS
    story.append(Paragraph("4. Mathematical & Algorithmic Scoring Formulas", h1_style))

    formula_box = [
        [Paragraph("<b>Dynamic Compliance Readiness Score Formula:</b>", box_title_style)],
        [Paragraph("<b>Score = Clamp( 50 + (5 × F) + (2 × P) + (1 × R) - (10 × C) - (5 × V) , 0 , 100 )</b>", ParagraphStyle('FormulaText', parent=body_style, fontName='Helvetica-Bold', fontSize=9.5, textColor=colors.HexColor("#1E1B4B")))],
        [Paragraph("• <b>F</b> = Recognized Compliance Frameworks (ISO 27001, GDPR, HIPAA, SOC 2, EU AI Act) (+5% per framework)<br/>• <b>P</b> = Count of Policy nodes (+2% per node) | <b>R</b> = Count of verified Relationship edges (+1% per edge)<br/>• <b>C</b> = Critical Hardware/Thermal Incident nodes (-10% penalty) | <b>V</b> = Unresolved Violation nodes (-5% penalty)", body_style)],
        [Spacer(1, 3)],
        [Paragraph("<b>Hallucination Rate Tracking Formula:</b>", box_title_style)],
        [Paragraph("<b>Hallucination Rate (%) = [ (Total Queries - Grounded Queries) / Total Queries ] × 100</b>", ParagraphStyle('FormulaText2', parent=body_style, fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor("#1E1B4B")))],
        [Paragraph("• Every query containing verified <b>[SOURCE: doc.pdf]</b> node assertions increments Grounded Queries (0.0% rate maintained).", body_style)]
    ]
    formula_table = Table(formula_box, colWidths=[7.5*inch])
    formula_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(formula_table)

    story.append(Spacer(1, 10))

    # SECTION 5: HACKATHON PITCH SCRIPT FOR SUMIT SHARAN
    story.append(Paragraph("5. Official 5-Minute Hackathon Finals Presentation Script (For Sumit Sharan)", h1_style))
    story.append(Paragraph(
        "As Senior Engineering Advisor & Lead Presenter, use this structured demonstration script during the round 2 finals presentation:",
        body_style
    ))

    script_data = [
        [Paragraph("Time", table_header_style), Paragraph("Screen Action", table_header_style), Paragraph("Exact Script to Deliver to Judges", table_header_style)],
        [
            Paragraph("0:00 - 1:00", table_cell_bold),
            Paragraph("Show Landing Page<br/>(nexusiq2.vercel.app)", table_cell_style),
            Paragraph("<b>'Honorable judges, traditional enterprise AI fails in compliance because vector chunking destroys context and leads to hallucinations. In compliance, a single AI hallucination leads to a multi-million dollar lawsuit. Welcome to NexusIQ: the world\'s first Zero-Hallucination Compliance Platform powered by Knowledge Graphs, Lyzr AI SuperFlow, and IoT Edge hardware.'</b>", table_cell_style)
        ],
        [
            Paragraph("1:00 - 2:00", table_cell_bold),
            Paragraph("Click 'Enter Workspace'<br/>Highlight StatsBar", table_cell_style),
            Paragraph("<b>'Notice our top metrics bar. Our Compliance Score (87.5%) and Hallucination Rate (0.0%) are not hardcoded numbers—they are calculated live from graph mathematics via our FastAPI backend.'</b>", table_cell_style)
        ],
        [
            Paragraph("2:00 - 3:00", table_cell_bold),
            Paragraph("Drag & drop ISO 27001 PDF into Upload Panel", table_cell_style),
            Paragraph("<b>'Watch what happens when we upload an ISO 27001 document. Google Gemini extracts entities and relationships. Look at our D3.js canvas: nodes for ISO 27001, Encryption Policy, and Lead Auditor form live in real-time.'</b>", table_cell_style)
        ],
        [
            Paragraph("3:00 - 4:00", table_cell_bold),
            Paragraph("Type in chat:<br/>'What is our retention policy?'", table_cell_style),
            Paragraph("<b>'When we ask a question, NexusIQ runs a 2-hop BFS on our graph and passes context to Lyzr AI SuperFlow. Notice the answer: it explicitly cites [SOURCE: ISO_27001_Section_4.pdf]. If data isn\'t in the graph, it strictly refuses to answer.'</b>", table_cell_style)
        ],
        [
            Paragraph("4:00 - 5:00", table_cell_bold),
            Paragraph("Click 'Trigger Edge Incident'<br/>Export Audit Report", table_cell_style),
            Paragraph("<b>'Compliance is not just digital; it\'s physical. We connected custom ESP32 hardware. When server room temp exceeds 32°C, a red Alert Node appears and our score drops by 10%. NexusIQ bridges physical and digital compliance into one zero-hallucination platform. Thank you!'</b>", table_cell_style)
        ]
    ]

    script_table = Table(script_data, colWidths=[1.0*inch, 1.8*inch, 4.7*inch])
    script_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), secondary_color),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('BACKGROUND', (0,1), (-1,-1), colors.white),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(script_table)

    story.append(Spacer(1, 12))

    # FOOTER & TEAM CREDITS
    team_text = "<b>Team NexusIQ:</b> Hemant Prakash (Lead Full Stack & AI Architect) | Shubham Kumar (QA Lead) | <b>Sumit Sharan (Senior Engineering Advisor, Developer & Presentation Lead)</b>"
    story.append(Paragraph(team_text, meta_style))

    doc.build(story)
    print(f"Successfully generated Master PDF: {filename}")

if __name__ == '__main__':
    out_path = "M:\\NexusIQ\\NexusIQ_Master_Briefing_Sumit_Sharan.pdf"
    build_pdf(out_path)
