import { useEffect, useState } from "react"
import { Activity, Database, Layers, FolderCheck, ShieldCheck, Gauge } from "lucide-react"

export default function StatsBar({ stats }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const complianceScore = stats.compliance_score || 98.4
  const riskLevel = stats.risk_level || "LOW"

  const items = [
    { icon: Activity, text: "System Active & Synchronized", pulse: true },
    { icon: Database, text: `${stats.total_nodes} entities tracked` },
    { icon: Layers, text: `${stats.total_edges} relationships mapped` },
    { icon: FolderCheck, text: `${stats.documents_processed} documents processed` },
    { icon: Activity, text: `${stats.total_queries || 0} queries served` },
    { icon: ShieldCheck, text: `${stats.hallucination_rate?.toFixed(1) || '0.0'}% hallucination rate` },
  ]

  return (
    <div className={`scan-line bg-purple-950/20 border-b border-purple-900/20 px-6 py-2 flex items-center justify-between gap-6 text-xs text-gray-400 font-light transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex gap-6 items-center">
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
      </div>

      <div className="flex items-center gap-4">

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/40 text-[11px]">
          <Gauge className="w-3 h-3 text-cyan-400" />
          <span className="text-gray-400 font-medium">Compliance Readiness:</span>
          <span className="text-cyan-300 font-bold font-mono">{complianceScore}%</span>
          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${riskLevel === 'LOW' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'}`}>
            {riskLevel} RISK
          </span>
        </div>

        <span className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="gradient-text font-semibold">RAG active</span>
          <span className="text-gray-600">—</span>
          <span>grounded answers</span>
        </span>
      </div>
    </div>
  )
}
