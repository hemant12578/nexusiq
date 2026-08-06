import { useEffect, useState } from "react"
import { Activity, Database, Layers, FolderCheck, ShieldCheck, Gauge } from "lucide-react"
import ComplianceBreakdown from "./ComplianceBreakdown"

// Component to animate number increments smoothly
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
  const [showCompliancePopup, setShowCompliancePopup] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Remove fallback values for compliance metrics
  const complianceScore = stats.compliance_score ?? '—'
  const riskLevel = stats.risk_level ?? "N/A"

  return (
    <div data-tour-step="tour-stats-bar" className={`scan-line bg-purple-950/20 border-b border-purple-900/20 px-6 py-2 flex items-center justify-between gap-6 text-xs text-gray-400 font-light transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
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

        <span 
          className="flex items-center gap-1.5 transition-all duration-300 hover:text-gray-200 cursor-help"
          title={stats.hallucination_stats ? `Queries: ${stats.hallucination_stats.total_queries} | Grounded: ${stats.hallucination_stats.grounded} | Refused: ${stats.hallucination_stats.refused} | Unverified: ${stats.hallucination_stats.unverified}` : "No stats available"}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{stats.hallucination_stats?.hallucination_rate?.toFixed(1) ?? '0.0'}% hallucination rate</span>
        </span>
      </div>

      <div className="flex items-center gap-4 relative">
        <button 
          onClick={() => setShowCompliancePopup(!showCompliancePopup)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/80 border border-purple-700/50 text-xs cursor-pointer hover:bg-purple-900/90 transition-all whitespace-nowrap shadow-md shadow-purple-950/50 hover-lift"
        >
          <Gauge className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-gray-300 font-medium whitespace-nowrap">Compliance Readiness:</span>
          <span className="text-cyan-300 font-bold font-mono text-xs whitespace-nowrap"><AnimatedNumber value={complianceScore} />%</span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase whitespace-nowrap border shadow-sm ${
            riskLevel === 'LOW' 
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' 
              : riskLevel === 'HIGH' || riskLevel === 'CRITICAL'
                ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                : 'bg-amber-950/90 text-amber-300 border-amber-500/40'
          }`}>
            {riskLevel} RISK
          </span>
        </button>

        {showCompliancePopup && (
          <ComplianceBreakdown 
            score={complianceScore} 
            breakdown={stats.compliance_breakdown} 
            onClose={() => setShowCompliancePopup(false)} 
          />
        )}

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
