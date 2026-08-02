import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { FileUp, BrainCircuit, Network, Search, FileCheck, ArrowLeft, CheckCircle2, ArrowDown, Layers } from 'lucide-react'

const ArchitectureHero3D = () => {
  const mountRef = useRef(null)

  useEffect(() => {
    if (!mountRef.current) return
    const w = mountRef.current.clientWidth
    const h = mountRef.current.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000)
    camera.position.z = 240

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)

    // Particle constellation matching Canvas3D
    const particleCount = 130
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
      positions[i * 3] = (Math.random() - 0.5) * 550
      positions[i * 3 + 1] = (Math.random() - 0.5) * 350
      positions[i * 3 + 2] = (Math.random() - 0.5) * 300

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
    grad.addColorStop(0.3, "rgba(6, 182, 212, 0.8)")
    grad.addColorStop(1, "rgba(6, 182, 212, 0)")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 64, 64)

    const texture = new THREE.CanvasTexture(canvas)

    const material = new THREE.PointsMaterial({
      size: 13,
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
      opacity: 0.22,
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
      mouseX = (e.clientX - window.innerWidth / 2) * 0.1
      mouseY = (e.clientY - window.innerHeight / 2) * 0.1
    }
    window.addEventListener("mousemove", handleMouseMove)

    let req
    const clock = new THREE.Clock()
    const animate = () => {
      req = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()

      particleSystem.rotation.y = -elapsedTime * 0.03
      particleSystem.rotation.x = elapsedTime * 0.02
      lineMesh.rotation.y = -elapsedTime * 0.03
      lineMesh.rotation.x = elapsedTime * 0.02

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
          if (dist < 105) {
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
      if (!mountRef.current) return
      const width = mountRef.current.clientWidth
      const height = mountRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
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
      if (mountRef.current) {
        mountRef.current.innerHTML = ""
      }
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-none opacity-80" />
}

export default function ArchitecturePage() {
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
      title: "Cited Answer",
      desc: "Grounded response with source document citations",
      icon: FileCheck
    }
  ]

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
    <div className="min-h-screen bg-nexus-900 text-white overflow-y-auto relative">
      {/* 3D Visual Hero */}
      <div className="relative w-full h-[380px] flex flex-col justify-center items-center overflow-hidden border-b border-purple-500/20">
        <ArchitectureHero3D />
        <div className="absolute top-6 left-6 z-20">
          <Link to="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors focus-glow rounded-md px-2 py-1">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
        <div className="relative z-10 text-center space-y-4 max-w-3xl px-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-mono font-medium">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Multi-Modal Knowledge Graph Engine</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold gradient-text tracking-tight">
            System Architecture
          </h1>
          <p className="text-lg md:text-xl text-purple-200 font-light tracking-wide">
            End-to-End Pipeline &amp; Graph RAG Flow
          </p>
        </div>
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
      </div>
    </div>
  )
}
