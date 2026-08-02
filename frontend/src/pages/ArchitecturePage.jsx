import { Link } from 'react-router-dom'
import { FileUp, BrainCircuit, Network, Search, FileCheck, ArrowLeft, CheckCircle2, ArrowDown } from 'lucide-react'

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
    <div className="min-h-[calc(100vh-61px)] bg-nexus-900 text-white p-8 overflow-y-auto animate-fade-in relative z-10">
      <div className="max-w-4xl mx-auto space-y-12">
        <Link to="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-text">System Architecture</h1>
          <p className="text-xl text-purple-300 font-light">End-to-End Pipeline</p>
        </div>

        <div className="flex flex-col items-center py-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center w-full max-w-lg">
              <div className="w-full bg-nexus-800/80 glass-strong p-6 rounded-2xl border border-purple-900/30 flex items-center gap-6 hover-lift glow-border animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="w-16 h-16 shrink-0 rounded-xl bg-purple-950/80 border border-purple-700/40 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-900/20">
                  <step.icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-100">{step.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{step.desc}</p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="my-4 animate-pulse">
                  <ArrowDown className="w-8 h-8 text-purple-500/50" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-nexus-800/80 glass-strong p-8 rounded-2xl glow-border">
          <h2 className="text-2xl font-bold mb-6 text-purple-100 text-center">Evaluation Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.map((metric, i) => (
              <div key={i} className="bg-nexus-900/50 p-5 rounded-xl border border-purple-900/30 flex items-start gap-4">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
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
