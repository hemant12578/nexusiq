import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { FileUp, BrainCircuit, Network, Search, FileCheck, ArrowLeft, CheckCircle2, ArrowDown, Layers, Cpu, Wifi, Thermometer, ShieldCheck, Zap, RefreshCw } from 'lucide-react'

const ArchitectureHero3D = () => {
  const mountRef = useRef(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 320

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)

    // Full-page constellation particle network
    const particleCount = 260
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    const colorChoices = [
      new THREE.Color("#7c3aed"), // Purple
      new THREE.Color("#06b6d4"), // Cyan
      new THREE.Color("#ec4899"), // Pink
      new THREE.Color("#00ff88"), // Emerald
    ]

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 900
      positions[i * 3 + 1] = (Math.random() - 0.5) * 900
      positions[i * 3 + 2] = (Math.random() - 0.5) * 450

      const col = colorChoices[Math.floor(Math.random() * colorChoices.length)]
      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    // Radial texture
    const canvas = document.createElement("canvas")
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext("2d")
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0, "rgba(255, 255, 255, 1)")
    grad.addColorStop(0.3, "rgba(6, 182, 212, 0.9)")
    grad.addColorStop(1, "rgba(6, 182, 212, 0)")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 64, 64)

    const texture = new THREE.CanvasTexture(canvas)

    const material = new THREE.PointsMaterial({
      size: 15,
      vertexColors: true,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const particleSystem = new THREE.Points(geometry, material)
    scene.add(particleSystem)

    // Constellation lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
    })

    const lineGeometry = new THREE.BufferGeometry()
    const linePositions = new Float32Array(particleCount * particleCount * 6)
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3))
    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial)
    scene.add(lineMesh)

    let mouseX = 0
    let mouseY = 0
    const handleMouseMove = (e) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.15
      mouseY = (e.clientY - window.innerHeight / 2) * 0.15
    }
    window.addEventListener("mousemove", handleMouseMove)

    let req
    const clock = new THREE.Clock()
    const animate = () => {
      req = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()

      particleSystem.rotation.y = -elapsedTime * 0.04
      particleSystem.rotation.x = elapsedTime * 0.025
      lineMesh.rotation.y = -elapsedTime * 0.04
      lineMesh.rotation.x = elapsedTime * 0.025

      camera.position.x += (mouseX - camera.position.x) * 0.04
      camera.position.y += (-mouseY - camera.position.y) * 0.04
      camera.lookAt(scene.position)

      const pos = particleSystem.geometry.attributes.position.array
      let lineIndex = 0
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = pos[i * 3] - pos[j * 3]
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1]
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2]
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (dist < 120) {
            linePositions[lineIndex++] = pos[i * 3]
            linePositions[lineIndex++] = pos[i * 3 + 1]
            linePositions[lineIndex++] = pos[i * 3 + 2]
            linePositions[lineIndex++] = pos[j * 3]
            linePositions[lineIndex++] = pos[j * 3 + 1]
            linePositions[lineIndex++] = pos[j * 3 + 2]
          }
        }
      }
      lineGeometry.setDrawRange(0, lineIndex / 3)
      lineGeometry.attributes.position.needsUpdate = true

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(req)
      geometry.dispose()
      material.dispose()
      lineGeometry.dispose()
      lineMaterial.dispose()
      texture.dispose()
      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-none opacity-75 overflow-hidden" />
}

export default function ArchitecturePage() {
  // Define system architecture steps
  const steps = [
    {
      id: 1,
      title: "Document Upload",
      desc: "PDFs, Audio, Text ingested via REST API",
      icon: FileUp
    },
    {
      id: 2,
      title: "Gemini Extraction",
      desc: "LLM extracts entities & relationships as JSON",
      icon: BrainCircuit
    },
    {
      id: 3,
      title: "Knowledge Graph",
      desc: "NetworkX DiGraph stores nodes, edges, metadata",
      icon: Network
    },
    {
      id: 4,
      title: "Graph RAG",
      desc: "2-hop subgraph retrieval for query-relevant context",
      icon: Search
    },
    {
      id: 5,
      title: "Lyzr SuperFlow",
      desc: "Agentic orchestration routes context through Lyzr AI for zero-hallucination answers",
      icon: Zap
    },
    {
      id: 6,
      title: "Cited Answer",
      desc: "Grounded response with source document citations",
      icon: FileCheck
    }
  ]

  // Define evaluation metrics
  const metrics = [
    {
      name: "Retrieval Precision",
      approach: "Subgraph retrieval, keyword matching, BFS"
    },
    {
      name: "Entity Extraction F1",
      approach: "Deduplication, canonical IDs, cross-doc merging"
    },
    {
      name: "Hallucination Containment",
      approach: "Strict graph-only answers, refusal when not found"
    },
    {
      name: "Citation Traceability",
      approach: "Every answer cites entity name + source document"
    }
  ]

  return (
    <div className="min-h-screen bg-nexus-900/90 text-white overflow-y-auto relative z-10">
      {/* Full-Page 3D Constellation Visual Background */}
      <ArchitectureHero3D />

      {/* Navigation header */}
      <div className="max-w-4xl mx-auto px-6 pt-8 pb-4 relative z-20">
        <Link to="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors focus-glow rounded-md px-3 py-1.5 bg-nexus-800/60 border border-purple-500/30 glass-strong">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Hero Title Block */}
      <div className="relative z-10 text-center space-y-4 max-w-3xl mx-auto px-6 py-8 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-mono font-medium">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Multi-Modal Knowledge Graph Engine • Powered by Lyzr AI</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold gradient-text tracking-tight">
          System Architecture
        </h1>
        <p className="text-lg md:text-xl text-purple-200 font-light tracking-wide">
          End-to-End Pipeline &amp; Lyzr SuperFlow Orchestration
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12 relative z-10">
        <div className="flex flex-col items-center py-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center w-full max-w-lg">
              <div className="w-full bg-nexus-800/80 glass-strong p-6 rounded-2xl border border-purple-900/30 flex items-center gap-6 hover-lift glow-border animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="w-16 h-16 shrink-0 rounded-xl bg-purple-950/80 border border-purple-700/40 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-900/20">
                  <step.icon className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-100">{step.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{step.desc}</p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="my-4 animate-pulse">
                  <ArrowDown className="w-8 h-8 text-cyan-400/60" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-nexus-800/80 glass-strong p-8 rounded-2xl glow-border">
          <h2 className="text-2xl font-bold mb-6 text-purple-100 text-center">Evaluation Metrics &amp; Guarantees</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.map((metric, i) => (
              <div key={i} className="bg-nexus-900/50 p-5 rounded-xl border border-purple-900/30 flex items-start gap-4 hover-lift">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-purple-200">{metric.name}</div>
                  <div className="text-sm text-gray-400 mt-1">{metric.approach}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Fallback Chain */}
        <div className="bg-nexus-800/80 glass-strong p-8 rounded-2xl glow-border">
          <h2 className="text-2xl font-bold mb-6 text-purple-100 text-center">AI Orchestration Chain — Zero-Fail Design</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {[
              { name: "Lyzr AI SuperFlow", desc: "Primary agentic orchestration", icon: Zap, color: "text-indigo-400" },
              { name: "Google Gemini 2.5 Flash", desc: "Primary extraction via SDK", icon: BrainCircuit, color: "text-purple-400" },
              { name: "OpenRouter Free Models", desc: "10+ free model fallback", icon: RefreshCw, color: "text-cyan-400" },
              { name: "Local Regex Extractor", desc: "Offline, zero-dependency", icon: Cpu, color: "text-emerald-400" }
            ].map((tier, i) => (
              <React.Fragment key={i}>
                <div className="bg-nexus-900/80 p-5 rounded-xl border border-purple-500/30 hover-lift text-center flex-1 w-full md:max-w-xs">
                  <div className="w-12 h-12 mx-auto bg-purple-900/50 rounded-full flex items-center justify-center mb-3 border border-purple-500/50">
                    <tier.icon className={`w-6 h-6 ${tier.color}`} />
                  </div>
                  <h4 className="font-bold text-gray-100 text-sm">{tier.name}</h4>
                  <span className="text-xs text-gray-400 mt-1 block">{tier.desc}</span>
                </div>
                {i < 3 && (
                  <div className="hidden md:block text-purple-400/60 text-xs font-mono">→ fallback →</div>
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 mt-4">System never fails — always produces results regardless of API availability</p>
        </div>

        {/* IoT Edge Pipeline */}
        <div className="bg-nexus-800/80 glass-strong p-8 rounded-2xl glow-border">
          <h2 className="text-2xl font-bold mb-8 text-purple-100 text-center flex items-center justify-center gap-2">
            <Wifi className="w-6 h-6 text-cyan-400" />
            IoT Edge Pipeline
          </h2>
          <div className="flex flex-col items-center gap-4">
            {[
              { title: "ESP32 + DHT11 Sensor", desc: "Reads temperature & humidity every 2 seconds. Triggers relay at 32°C threshold.", icon: Thermometer },
              { title: "Raspberry Pi Gateway", desc: "HTTP server on port 5001. Receives sensor data, generates compliance incidents.", icon: Cpu },
              { title: "NexusIQ Cloud Backend", desc: "POST /upload-text ingestion. SSE stream to frontend. Knowledge Graph update.", icon: Network },
              { title: "Compliance Alert", desc: "ISO 27001 PE-14 thermal incident auto-generated. Entities extracted and graphed.", icon: ShieldCheck }
            ].map((step, i) => (
              <React.Fragment key={i}>
                <div className="w-full max-w-lg bg-nexus-900/80 p-5 rounded-xl border border-cyan-900/30 flex items-center gap-5 hover-lift animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-14 h-14 shrink-0 rounded-xl bg-cyan-950/80 border border-cyan-700/40 flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-100">{step.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">{step.desc}</p>
                  </div>
                </div>
                {i < 3 && (
                  <div className="animate-pulse">
                    <ArrowDown className="w-6 h-6 text-cyan-400/60" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="bg-nexus-800/80 glass-strong p-8 rounded-2xl glow-border text-center">
          <h2 className="text-2xl font-bold mb-4 text-purple-100">Platform at a Glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Features", value: "31+" },
              { label: "AI Models", value: "4" },
              { label: "Input Formats", value: "4" },
              { label: "IoT Sensors", value: "3" }
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-xl bg-nexus-900/60 border border-purple-900/30">
                <div className="text-2xl font-bold text-purple-300">{stat.value}</div>
                <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
