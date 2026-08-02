import { useState, useEffect, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Cpu, Layers, Network, Activity, ShieldCheck, Lock, Globe, FolderKanban, LogOut, FileSpreadsheet, Sparkles } from "lucide-react"
import axios from "axios"
import { auth, signOut } from "../firebase"

function AnimatedNumber({ value, className }) {
  const [display, setDisplay] = useState(value)
  const [animating, setAnimating] = useState(false)
  const prevRef = useRef(value)

  useEffect(() => {
    if (prevRef.current !== value) {
      setAnimating(true)
      const timeout = setTimeout(() => {
        setDisplay(value)
        prevRef.current = value
      }, 150)
      const reset = setTimeout(() => setAnimating(false), 500)
      return () => { clearTimeout(timeout); clearTimeout(reset) }
    }
  }, [value])

  return (
    <span className={`${className} inline-block transition-all duration-300 ${animating ? 'stat-update' : ''}`}>
      {display}
    </span>
  )
}

export default function Header({ stats, user, onLogout, API }) {
  const [mounted, setMounted] = useState(false)
  const [downloadingReport, setDownloadingReport] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => { setMounted(true) }, [])

  const handleExportAuditReport = async () => {
    setDownloadingReport(true)
    try {
      const apiEndpoint = API || import.meta.env.VITE_API_URL || "https://nexusiq-backend-production.up.railway.app"
      const res = await axios.get(`${apiEndpoint}/export-report`)
      const reportData = res.data

      const markdownContent = `# ${reportData.report_title}
Generated: ${reportData.timestamp}
Overall Compliance Readiness Score: ${reportData.overall_compliance_score} (${reportData.risk_level} Risk)

## Executive Summary
- Total Entities Mapped: ${reportData.total_entities}
- Total Relationships Tracked: ${reportData.total_relationships}
- Source Documents Indexed: ${reportData.documents_indexed.join(', ') || 'None'}
- Regulatory Frameworks Verified: ${reportData.framework_coverage.join(', ')}

## Top Critical Compliance Entities
${reportData.top_critical_entities.map((e, idx) => `${idx + 1}. **${e.name}** (${e.type}) — Connections: ${e.connections}, Centrality Score: ${e.importance_score}`).join('\n') || 'No entities mapped yet.'}

## Zero-Hallucination Audit Verdict
${reportData.audit_verdict}
`

      const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `NexusIQ_Compliance_Audit_Brief_${Date.now()}.md`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error("Report export failed:", e.message)
    }
    setDownloadingReport(false)
  }

  return (
    <header className={`border-b border-purple-900/30 px-6 py-3.5 flex items-center justify-between bg-nexus-900/95 backdrop-blur-2xl z-30 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>

      <div className="flex items-center gap-6">
        <Link
          to="/"
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/30 animate-glow-pulse group-hover:scale-105 transition-transform duration-300 relative">
            <Cpu className="w-5 h-5 text-white relative z-10" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-600 via-violet-500 to-indigo-600 blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight gradient-text">NexusIQ</div>
            <div className="text-[10px] text-gray-500 font-light tracking-wide">
              Compliance Knowledge Graph
            </div>
          </div>
        </Link>


        <nav className="hidden md:flex items-center gap-1.5 pl-6 border-l border-purple-900/30">
          <Link
            to="/"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              location.pathname === "/"
                ? "bg-purple-900/50 text-purple-300 border border-purple-700/40"
                : "text-gray-400 hover:text-gray-200 hover:bg-nexus-800/40"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Overview</span>
          </Link>

          <Link
            to="/workspace"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              location.pathname === "/workspace"
                ? "bg-purple-900/50 text-purple-300 border border-purple-700/40"
                : "text-gray-400 hover:text-gray-200 hover:bg-nexus-800/40"
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </Link>

          <Link
            to="/about"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              location.pathname === "/about"
                ? "bg-purple-900/50 text-purple-300 border border-purple-700/40"
                : "text-gray-400 hover:text-gray-200 hover:bg-nexus-800/40"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>About</span>
          </Link>

          <Link
            to="/architecture"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              location.pathname === "/architecture"
                ? "bg-purple-900/50 text-purple-300 border border-purple-700/40"
                : "text-gray-400 hover:text-gray-200 hover:bg-nexus-800/40"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture</span>
          </Link>

          <Link
            to="/pricing"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              location.pathname === "/pricing"
                ? "bg-purple-900/50 text-purple-300 border border-purple-700/40"
                : "text-gray-400 hover:text-gray-200 hover:bg-nexus-800/40"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pricing</span>
          </Link>
        </nav>
      </div>


      <div className="flex gap-6 text-sm items-center">
        {location.pathname === "/workspace" && (
          <div className="hidden lg:flex items-center gap-6">
            {[
              { label: 'Nodes', value: stats.total_nodes, color: 'text-purple-400', icon: Network },
              { label: 'Edges', value: stats.total_edges, color: 'text-purple-400', icon: Layers },
              { label: 'Docs', value: stats.documents_processed, color: 'text-purple-400', icon: Activity },
              { label: 'Queries', value: stats.total_queries, color: 'text-cyan-400', icon: Cpu },
            ].map((s) => (
              <div key={s.label} className="text-center group cursor-default hover-pop">
                <AnimatedNumber
                  value={s.value}
                  className={`${s.color} font-bold text-base stat-glow block`}
                />
                <div className="text-gray-500 text-[10px] uppercase tracking-widest group-hover:text-gray-400 transition-colors flex items-center justify-center gap-1">
                  <s.icon className="w-3 h-3 text-purple-500/70" />
                  <span>{s.label}</span>
                </div>
              </div>
            ))}


            <button
              onClick={handleExportAuditReport}
              disabled={downloadingReport}
              className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-700/40 text-purple-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-purple-900/20 hover-lift"
              title="Download official compliance audit report"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
              <span>{downloadingReport ? "Generating..." : "Export Audit Brief"}</span>
            </button>


            <div className="flex items-center gap-2 pl-4 border-l border-purple-900/30">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-40" />
              </div>
              <div className="text-emerald-400 text-xs font-semibold tracking-wide flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>0% Hallucination</span>
              </div>
            </div>
          </div>
        )}


        <div className="pl-4 border-l border-purple-900/30">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-200 truncate max-w-[140px]">{user.email.split("@")[0]}</div>
                <div className="text-[10px] text-purple-400 font-medium uppercase tracking-wider">{user.role}</div>
              </div>
              <button
                onClick={() => { signOut(auth); onLogout(); navigate('/'); }}
                title="Logout"
                className="p-2 rounded-lg bg-nexus-800/80 hover:bg-red-950/40 text-gray-400 hover:text-red-400 border border-purple-900/30 hover:border-red-900/40 transition-all hover-pop"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-purple-900/40 hover:bg-purple-800/50 border border-purple-700/40 rounded-xl text-xs font-semibold text-purple-200 transition-all hover-lift flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
