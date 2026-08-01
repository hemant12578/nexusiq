import { useEffect, useState } from "react"
import { User, FileText, ShieldAlert, Calendar, Building2, Bookmark, MapPin, HelpCircle, X, Layers, Link2 } from "lucide-react"

const NODE_COLORS = {
  person: "#00ff88",
  document: "#7c3aed",
  policy: "#f59e0b",
  date: "#06b6d4",
  organization: "#ec4899",
  event: "#f97316",
  location: "#84cc16",
  unknown: "#6b7280"
}

const NODE_ICONS = {
  person: User,
  document: FileText,
  policy: ShieldAlert,
  date: Calendar,
  organization: Building2,
  event: Bookmark,
  location: MapPin,
  unknown: HelpCircle
}

export default function NodeDetail({ node, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    return () => setVisible(false)
  }, [node])

  if (!node) return null

  const color = NODE_COLORS[node.type] || NODE_COLORS.unknown
  const IconComp = NODE_ICONS[node.type] || NODE_ICONS.unknown

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  return (
    <div className={`absolute bottom-6 left-6 w-80 z-20 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}>
      <div className="bg-nexus-800/95 backdrop-blur-2xl rounded-2xl border border-purple-700/25 shadow-2xl shadow-purple-900/40 overflow-hidden glow-border">
        {/* Animated color accent bar */}
        <div className="h-1 relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}60, transparent)` }}
          />
        </div>

        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl hover-pop relative"
                style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}
              >
                <IconComp className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-white text-xs tracking-tight">{node.name}</div>
                <div
                  className="text-[10px] font-bold uppercase tracking-widest mt-0.5"
                  style={{ color }}
                >
                  {node.type}
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-white transition-all w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details list */}
          <div className="space-y-0 text-xs">
            <div className="flex items-center justify-between py-2 border-t border-purple-900/15">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3 text-purple-400" /> Source
              </span>
              <span className="text-gray-300 font-medium truncate ml-3 max-w-[170px]">{node.source || "Unknown"}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-purple-900/15">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Link2 className="w-3 h-3 text-purple-400" /> Connections
              </span>
              <span className="text-purple-400 font-bold font-mono">{node.connections || 0}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-purple-900/15">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-purple-400" /> Node ID
              </span>
              <span className="text-gray-500 font-mono text-[10px]">{node.id}</span>
            </div>
          </div>

          {/* Connection strength progress bar */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Node Degree Density</span>
              <span className="text-[10px] text-purple-400 font-semibold font-mono">
                {Math.min((node.connections || 0) * 15, 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-nexus-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min((node.connections || 0) * 15, 100)}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}80)`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
