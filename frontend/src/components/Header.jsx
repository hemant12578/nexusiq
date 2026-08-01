import { useState, useEffect, useRef } from "react"
import { Cpu, Layers, Network, Activity, ShieldCheck, Lock, Globe, FolderKanban, LogOut } from "lucide-react"

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

export default function Header({ stats, currentPage, onNavigate, user, onLogout }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <header className={`border-b border-purple-900/30 px-6 py-3.5 flex items-center justify-between bg-nexus-900/95 backdrop-blur-2xl z-30 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
      {/* Brand & Logo */}
      <div className="flex items-center gap-6">
        <div
          onClick={() => onNavigate("landing")}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/30 animate-glow-pulse group-hover:scale-105 transition-transform duration-300 relative">
            <Cpu className="w-5 h-5 text-white relative z-10" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-600 via-violet-500 to-indigo-600 blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight gradient-text">NexusIQ</div>
            <div className="text-[10px] text-gray-500 font-light tracking-wide">
              Zero-Hallucination Compliance Intelligence
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 pl-6 border-l border-purple-900/30">
          <button
            onClick={() => onNavigate("landing")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentPage === "landing"
                ? "bg-purple-900/50 text-purple-300 border border-purple-700/40"
                : "text-gray-400 hover:text-gray-200 hover:bg-nexus-800/40"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => onNavigate("app")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentPage === "app"
                ? "bg-purple-900/50 text-purple-300 border border-purple-700/40"
                : "text-gray-400 hover:text-gray-200 hover:bg-nexus-800/40"
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </button>
        </nav>
      </div>

      {/* Right Stats & Auth controls */}
      <div className="flex gap-6 text-sm items-center">
        {currentPage === "app" && (
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

            {/* Hallucination Badge */}
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

        {/* User Auth Action */}
        <div className="pl-4 border-l border-purple-900/30">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-200 truncate max-w-[140px]">{user.email.split("@")[0]}</div>
                <div className="text-[10px] text-purple-400 font-medium uppercase tracking-wider">{user.role}</div>
              </div>
              <button
                onClick={onLogout}
                title="Logout"
                className="p-2 rounded-lg bg-nexus-800/80 hover:bg-red-950/40 text-gray-400 hover:text-red-400 border border-purple-900/30 hover:border-red-900/40 transition-all hover-pop"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate("login")}
              className="px-4 py-2 bg-purple-900/40 hover:bg-purple-800/50 border border-purple-700/40 rounded-xl text-xs font-semibold text-purple-200 transition-all hover-lift flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Portal Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
