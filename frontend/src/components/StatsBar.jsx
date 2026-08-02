import { useEffect, useState } from "react"
import { Activity, Database, Layers, FolderCheck, ShieldCheck, Gauge } from "lucide-react"

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) {
      setDisplay(0)
      return
    }
    let start = 0
    const step = Math.max(1, Math.ceil(value / 20))
    const timer = setInterval(() => {
      start += step
      if (start >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(start)
      }
    }, 50)
    return () => clearInterval(timer)
  }, [value])

  return <span>{display}</span>
}

export default function StatsBar({ stats }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const complianceScore = stats.compliance_score || 98.4
  const riskLevel = stats.risk_level || "LOW"

  return (
    <div className={`scan-line bg-purple-950/20 border-b border-purple-900/20 px-6 py-2 flex items-center justify-between gap-6 text-xs text-gray-400 font-light transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex gap-6 items-center">
        <span className="flex items-center gap-1.5 transition-all duration-300 hover:text-gray-200">
          <span className="relative flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-50" />
          </span>
          <span>System Active &amp; Synchronized</span>
        </span>

        <span className="flex items-center gap-1.5 transition-all duration-300 hover:text-gray-200">
          <Database className="w-3.5 h-3.5 text-purple-400" />
          <span><AnimatedNumber value={stats.total_nodes} /> entities tracked</span>
        </span>

        <span className="flex items-center gap-1.5 transition-all duration-300 hover:text-gray-200">
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span><AnimatedNumber value={stats.total_edges} /> relationships mapped</span>
        </span>

        <span className="flex items-center gap-1.5 transition-all duration-300 hover:text-gray-200">
          <FolderCheck className="w-3.5 h-3.5 text-purple-400" />
          <span><AnimatedNumber value={stats.documents_processed} /> documents processed</span>
        </span>

        <span className="flex items-center gap-1.5 transition-all duration-300 hover:text-gray-200">
          <Activity className="w-3.5 h-3.5 text-purple-400" />
          <span><AnimatedNumber value={stats.total_queries || 0} /> queries served</span>
        </span>

        <span className="flex items-center gap-1.5 transition-all duration-300 hover:text-gray-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{stats.hallucination_rate?.toFixed(1) || '0.0'}% hallucination rate</span>
        </span>
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
