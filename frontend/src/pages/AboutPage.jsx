import { Link } from 'react-router-dom'
import { Code2, Database, Cpu, Network, Globe, Layers, Zap, Lock, Server, CircuitBoard, Palette, Rocket, ArrowLeft } from 'lucide-react'

export default function AboutPage() {
  const stack = [
    { name: 'React', icon: Code2 },
    { name: 'FastAPI', icon: Zap },
    { name: 'Python', icon: Server },
    { name: 'NetworkX', icon: Network },
    { name: 'Google Gemini', icon: Cpu },
    { name: 'D3.js', icon: Globe },
    { name: 'Three.js', icon: Layers },
    { name: 'Firebase Auth', icon: Lock },
    { name: 'Railway', icon: Rocket },
    { name: 'Raspberry Pi', icon: CircuitBoard },
    { name: 'Tailwind CSS', icon: Palette },
    { name: 'Vite', icon: Database },
  ]

  return (
    <div className="min-h-[calc(100vh-61px)] bg-nexus-900 text-white p-8 overflow-y-auto animate-fade-in relative z-10">
      <div className="max-w-4xl mx-auto space-y-12">
        <Link to="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-text">Built by Team Nexus</h1>
          <p className="text-xl text-purple-300 font-light">InnovaHack Chapter 1 — Round 2</p>
        </div>

        <div className="bg-nexus-800/80 glass-strong p-8 rounded-2xl glow-border hover-lift animate-slide-up">
          <h2 className="text-2xl font-bold mb-4 text-purple-100">The Problem</h2>
          <p className="text-gray-300 leading-relaxed text-sm">
            Compliance teams drown in unstructured data—PDFs, audio logs, and text streams. Extracting meaningful relationships, tracking entities, and avoiding hallucinated answers in traditional RAG pipelines is a challenge. NexusIQ solves this by building a live, interactive Knowledge Graph that grounds every answer in verifiable facts and provides a visual interface for complex compliance queries.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6 text-purple-100 text-center">Tech Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stack.map((tech) => (
              <div key={tech.name} className="bg-nexus-800/60 glass-strong p-4 rounded-xl border border-purple-900/30 flex items-center gap-3 hover-lift group hover:border-purple-500/50 transition-all">
                <div className="p-2 bg-purple-900/50 rounded-lg group-hover:bg-purple-800/80 transition-colors">
                  <tech.icon className="w-5 h-5 text-purple-400 group-hover:text-purple-200" />
                </div>
                <span className="font-medium text-gray-200 text-sm">{tech.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-nexus-800/80 glass-strong p-8 rounded-2xl glow-border hover-lift">
          <h2 className="text-2xl font-bold mb-6 text-purple-100">Team Nexus</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="font-semibold text-purple-200">Team Nexus</div>
              <div className="text-sm text-gray-400">Full Stack</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-purple-200">Team Nexus</div>
              <div className="text-sm text-gray-400">ML/AI</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-purple-200">Team Nexus</div>
              <div className="text-sm text-gray-400">Systems</div>
            </div>
          </div>
        </div>

        <footer className="text-center text-sm text-gray-500 pt-8 pb-4">
          <p>Created for InnovaHack Chapter 1 — Round 2</p>
        </footer>
      </div>
    </div>
  )
}
