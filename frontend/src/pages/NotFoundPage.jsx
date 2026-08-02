import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-61px)] bg-nexus-900 text-white flex items-center justify-center relative z-10 animate-fade-in">
      <div className="text-center space-y-6 p-8 glass-strong rounded-3xl glow-border max-w-md w-full mx-4 hover-lift">
        <h1 className="text-8xl font-bold gradient-text">404</h1>
        <div className="text-xl text-purple-300 font-light">Page not found</div>
        <p className="text-gray-400 text-sm">
          The node you are looking for does not exist in the knowledge graph.
        </p>
        <div className="pt-4">
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-xl transition-all text-purple-200 font-medium">
            <ArrowLeft className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
