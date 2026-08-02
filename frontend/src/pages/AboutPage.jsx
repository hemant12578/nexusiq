import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { 
  ArrowLeft, Target, ShieldCheck, CheckCircle2, FileText, 
  Smartphone, Database, Globe, Network, Cpu 
} from 'lucide-react'

const ThreeHero = () => {
  const mountRef = useRef(null)

  useEffect(() => {
    if (!mountRef.current) return
    const w = mountRef.current.clientWidth
    const h = mountRef.current.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mountRef.current.appendChild(renderer.domElement)

    // Icosahedron with wireframe
    const geometry = new THREE.IcosahedronGeometry(2, 1)
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x8b5cf6, // purple-500
      wireframe: true, 
      transparent: true, 
      opacity: 0.6 
    })
    const icosahedron = new THREE.Mesh(geometry, material)
    scene.add(icosahedron)

    // Inner core
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 0)
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4, // cyan-500
      wireframe: true,
      transparent: true,
      opacity: 0.3
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    scene.add(core)

    // Floating Particles
    const particlesGeo = new THREE.BufferGeometry()
    const particlesCount = 300
    const posArray = new Float32Array(particlesCount * 3)
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 15
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    const particlesMat = new THREE.PointsMaterial({ 
      size: 0.03, 
      color: 0x06b6d4, 
      transparent: true, 
      opacity: 0.6 
    })
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat)
    scene.add(particlesMesh)

    let req
    const animate = () => {
      req = requestAnimationFrame(animate)
      icosahedron.rotation.x += 0.002
      icosahedron.rotation.y += 0.003
      core.rotation.x -= 0.002
      core.rotation.y -= 0.001
      particlesMesh.rotation.y -= 0.001
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
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(req)
      geometry.dispose()
      material.dispose()
      coreGeo.dispose()
      coreMat.dispose()
      particlesGeo.dispose()
      particlesMat.dispose()
      renderer.dispose()
      if (mountRef.current) {
        mountRef.current.innerHTML = ''
      }
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-none opacity-60 mix-blend-screen" />
}

export default function AboutPage() {
  const metrics = [
    { 
      title: "Retrieval Precision", 
      desc: "Subgraph BFS retrieval narrows context and drastically eliminates noise.", 
      icon: Target,
      delay: "0ms" 
    },
    { 
      title: "Entity Extraction F1", 
      desc: "Dedup + canonical IDs + cross-doc merging guarantees highly accurate entity linking.", 
      icon: Database,
      delay: "100ms" 
    },
    { 
      title: "Hallucination Containment", 
      desc: "Strict graph-only answers + refusal mechanisms prevent fabricated facts.", 
      icon: ShieldCheck,
      delay: "200ms" 
    },
    { 
      title: "Citation Traceability", 
      desc: "Every answer directly cites identifiable, verifiable source documents.", 
      icon: FileText,
      delay: "300ms" 
    }
  ]

  const techCategories = [
    { title: "Frontend", items: ["React 18", "Vite", "Tailwind CSS", "D3.js", "Three.js"], delay: "0ms" },
    { title: "Backend", items: ["FastAPI", "Python", "NetworkX", "Google Gemini"], delay: "100ms" },
    { title: "Infrastructure", items: ["Railway", "Firebase Auth", "Vercel"], delay: "200ms" },
    { title: "Edge", items: ["Raspberry Pi", "Edge Agent", "GPIO", "Offline Queue"], delay: "300ms" }
  ]

  const pipelineSteps = [
    { title: "Multi-Modal Input", desc: "PDF / Audio / Text", icon: Smartphone },
    { title: "LLM Extraction", desc: "Gemini Entities", icon: Cpu },
    { title: "Knowledge Graph", desc: "NetworkX DiGraph", icon: Network },
    { title: "Graph RAG", desc: "BFS + PageRank", icon: Globe },
    { title: "Grounded Answer", desc: "Cited & Verified", icon: CheckCircle2 }
  ]

  const team = [
    { name: "Hemant Prakash", role: "Lead Full Stack & AI", skills: ["React", "FastAPI", "Three.js", "Gemini"] },
    { name: "Aarav Sharma", role: "Backend & Systems", skills: ["Python", "NetworkX", "Cloud Infra"] },
    { name: "Riya Patel", role: "Edge Architect", skills: ["Raspberry Pi", "IoT", "Performance"] }
  ]

  return (
    <div className="min-h-screen bg-nexus-900 text-white overflow-y-auto relative">
      <style>{`
        @keyframes flowPulse {
          0% { opacity: 0.3; text-shadow: 0 0 0px transparent; }
          50% { opacity: 1; filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.9)); }
          100% { opacity: 0.3; text-shadow: 0 0 0px transparent; }
        }
        .animate-flow-pulse {
          animation: flowPulse 2s ease-in-out infinite;
        }
      `}</style>
      
      {/* 3D Hero Section */}
      <div className="relative w-full h-[450px] flex flex-col justify-center items-center overflow-hidden border-b border-purple-500/20">
        <ThreeHero />
        <div className="absolute top-6 left-6 z-20">
          <Link to="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors focus-glow rounded-md px-2 py-1">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
        <div className="relative z-10 text-center space-y-6 max-w-3xl px-6 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-extrabold gradient-text tracking-tight pb-2">
            About NexusIQ
          </h1>
          <p className="text-xl md:text-2xl text-purple-200 font-light tracking-wide drop-shadow-md">
            Built for InnovaHack Chapter 1 — Round 2 <br className="hidden md:block"/> 
            <span className="text-cyan-400 font-medium">Domain 3: Gen AI</span>
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-24 relative z-10">
        
        {/* Mission / Problem Statement Section */}
        <section className="relative bg-nexus-800/60 glass-strong p-8 md:p-12 rounded-2xl glow-border hover-lift animate-slide-up overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-purple-500 to-cyan-500 group-hover:w-3 transition-all duration-300" />
          <h2 className="text-3xl font-bold mb-6 text-white tracking-tight flex items-center gap-3">
            <Target className="text-purple-400 w-8 h-8" />
            The Problem We Solve
          </h2>
          <div className="space-y-6 text-gray-300 leading-relaxed text-lg font-light">
            <p>
              Modern enterprises are flooded with thousands of unstructured documents containing critical compliance, legal, and operational information. From complex PDF policies to lengthy audio transcripts, this data remains disorganized, making verifiable retrieval incredibly difficult.
            </p>
            <p>
              Standard vector databases and naive text-chunking pipelines fail spectacularly in these environments. They fragment vital context, sever relationships between entities, and frequently trigger severe LLM hallucinations when asked complex, multi-hop compliance questions.
            </p>
            <p className="text-purple-100 font-medium border-l-2 border-purple-500/50 pl-4 py-1 bg-purple-500/10 rounded-r-lg">
              NexusIQ tackles this by leveraging a live <span className="text-cyan-400 font-semibold">Knowledge Graph RAG</span> architecture. Instead of blind vector similarity, we maintain explicit entity relationships, ensuring every extracted answer is grounded in graph reality and immune to typical hallucinations.
            </p>
          </div>
        </section>

        {/* How We're Different Section */}
        <section>
          <h2 className="text-3xl font-bold mb-10 text-center gradient-text">How We're Different</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metrics.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-nexus-800/50 glass-strong p-6 rounded-2xl relative overflow-hidden group hover-lift border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: item.delay, animationFillMode: 'both' }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 group-hover:bg-cyan-400 transition-colors duration-300" />
                <div className="flex items-start gap-4 ml-2">
                  <div className="p-3 bg-purple-900/50 rounded-xl group-hover:bg-purple-600/30 transition-colors shadow-inner border border-purple-500/30">
                    <item.icon className="w-6 h-6 text-purple-300 group-hover:text-cyan-300 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">{item.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture Pipeline Section */}
        <section className="bg-nexus-800/40 glass-strong p-10 rounded-3xl glow-border">
          <h2 className="text-3xl font-bold mb-12 text-center text-white">Pipeline Architecture</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
            {pipelineSteps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="relative group flex-1 w-full md:w-auto">
                  <div className="bg-nexus-900/80 p-5 rounded-xl border border-purple-500/30 hover:border-cyan-400/50 transition-all duration-300 hover-lift text-center z-10 relative flex flex-col items-center shadow-lg">
                    <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-purple-500/50">
                      <step.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h4 className="font-bold text-gray-100 text-sm whitespace-nowrap">{step.title}</h4>
                    <span className="text-xs text-purple-300 mt-1 block whitespace-nowrap">{step.desc}</span>
                  </div>
                </div>
                {idx < pipelineSteps.length - 1 && (
                  <div className="hidden md:flex flex-1 h-0.5 border-t-2 border-dashed border-purple-500/40 animate-flow-pulse mx-2 relative top-[-10px]">
                  </div>
                )}
                {/* Vertical arrow for mobile */}
                {idx < pipelineSteps.length - 1 && (
                  <div className="md:hidden w-0.5 h-8 border-l-2 border-dashed border-purple-500/40 animate-flow-pulse"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* Tech Stack Section */}
        <section>
          <h2 className="text-3xl font-bold mb-10 text-center gradient-text">Advanced Technology Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techCategories.map((cat, idx) => (
              <div 
                key={idx} 
                className="bg-nexus-800/40 glass-strong p-6 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-colors animate-slide-up hover-lift"
                style={{ animationDelay: cat.delay, animationFillMode: 'both' }}
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  {cat.title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map((item, i) => (
                    <span key={i} className="px-3 py-1 bg-purple-900/40 text-purple-200 text-xs font-medium rounded-full border border-purple-500/20 shadow-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className="pb-10">
          <h2 className="text-3xl font-bold mb-10 text-center text-white">Team Nexus</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, idx) => (
              <div key={idx} className="bg-nexus-800/60 glass-strong p-6 rounded-2xl text-center hover-lift border border-purple-500/10 hover:border-cyan-500/40 transition-all group">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 p-1 mb-4 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full bg-nexus-900 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    {member.name.charAt(0)}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-100">{member.name}</h3>
                <p className="text-sm text-cyan-400 font-medium mb-4">{member.role}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {member.skills.map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-white/5 text-gray-300 text-xs rounded-md border border-white/10">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-purple-900/30 bg-nexus-900/80 backdrop-blur-md py-8 text-center text-sm text-gray-400">
        <p className="mb-2">Developed with ❤️ for <strong className="text-purple-300">InnovaHack Chapter 1 — Round 2</strong></p>
        <p>Domain 3: Gen AI &nbsp;|&nbsp; Team Nexus &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
