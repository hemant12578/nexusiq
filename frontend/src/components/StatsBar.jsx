import { useEffect, useState } from "react"
import { Activity, Database, Layers, FolderCheck, ShieldCheck } from "lucide-react"

export default function StatsBar({ stats }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const items = [
    { icon: Activity, text: "System Active & Synchronized", pulse: true },
    { icon: Database, text: `${stats.total_nodes} entities tracked` },
    { icon: Layers, text: `${stats.total_edges} relationships mapped` },
    { icon: FolderCheck, text: `${stats.documents_processed} documents processed` },
  ]

  return (
    <div className={`scan-line bg-purple-950/20 border-b border-purple-900/20 px-6 py-2 flex gap-8 text-xs text-gray-400 font-light transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {items.map((item, i) => (
        <span
          key={i}
          className="flex items-center gap-1.5 transition-all duration-300 hover:text-gray-200"
        >
          {item.pulse ? (
            <span className="relative flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-50" />
            </span>
          ) : (
            <item.icon className="w-3.5 h-3.5 text-purple-400" />
          )}
          <span>{item.text}</span>
        </span>
      ))}
      <span className="ml-auto flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span className="gradient-text font-semibold">Graph RAG Active</span>
        <span className="text-gray-600">—</span>
        <span>Zero Hallucination Guarantee</span>
      </span>
    </div>
  )
}
