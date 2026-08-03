import { useEffect, useState } from "react"
import { User, FileText, ShieldAlert, Calendar, Building2, Bookmark, MapPin, HelpCircle, X, Layers, Link2, Sparkles, Trash2 } from "lucide-react"

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

export default function NodeDetail({ node, onClose, onDeleteNode }) {
  // Manage component visibility for mount animations
  const [visible, setVisible] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  const handleDelete = async () => {
    if (deleting) return
    setDeleting(true)
    if (onDeleteNode) {
      await onDeleteNode(node.id)
    }
    handleClose()
  }

  return (
    <div className={`absolute bottom-6 left-6 w-80 z-20 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}>
      <div className="bg-nexus-800/95 backdrop-blur-2xl rounded-2xl border border-purple-700/25 shadow-2xl shadow-purple-900/40 overflow-hidden glow-border">

        <div className="h-1 relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}60, transparent)` }}
          />
        </div>

        <div className="p-5 space-y-4">

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl hover-pop relative"
                style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}
              >
                <IconComp className="w-5 h-5" />
              </div>
              <div className="min-w-0 max-w-[170px]">
                <div className="font-semibold text-white text-xs tracking-tight truncate">{node.name}</div>
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

          {/* Display detailed entity properties */}
          <div className="space-y-0 text-xs">
            <div className="flex items-center justify-between py-2 border-t border-purple-900/15">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3 text-purple-400" /> Source
              </span>
              <span className="text-gray-300 font-medium truncate ml-3 max-w-[170px]" title={Array.isArray(node.sources) ? node.sources.join(", ") : (node.source || "Unknown")}>
                {Array.isArray(node.sources) ? node.sources.join(", ") : (node.source || "Unknown")}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-purple-900/15">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> Importance
              </span>
              <span className="text-cyan-400 font-bold font-mono">{node.importance_score || 0}%</span>
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
              <span className="text-gray-500 font-mono text-[10px] truncate max-w-[140px]">{node.id}</span>
            </div>
          </div>

          <div className="pt-1 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Connectivity</span>
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

            {/* Remove Node Action Button */}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 hover:text-red-100 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-red-950/20 hover-lift disabled:opacity-50"
              title="Remove this node and its connections from knowledge graph"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>{deleting ? "Removing..." : "Remove Node From Graph"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
