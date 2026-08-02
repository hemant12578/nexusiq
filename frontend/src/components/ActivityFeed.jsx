import { useState, useEffect } from 'react'
import { getQueryHistory, getUploadHistory, clearUserHistory } from '../services/firestoreService'
import { Activity, ChevronDown, ChevronUp, Search, FileUp, Mic, FileText, Trash2, Clock, History } from 'lucide-react'

export default function ActivityFeed({ user, refreshKey }) {
  const [activities, setActivities] = useState([])
  const [isOpen, setIsOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showFullModal, setShowFullModal] = useState(false)

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const uid = user?.uid || 'anon'
      const queries = await getQueryHistory(uid, 20)
      const uploads = await getUploadHistory(uid, 20)

      const parseDate = (ts) => {
        if (!ts) return new Date()
        if (typeof ts === 'string') return new Date(ts)
        if (ts.toDate) return ts.toDate()
        if (ts.seconds) return new Date(ts.seconds * 1000)
        return new Date(ts)
      }

      const combined = [
        ...queries.map(q => ({
          id: q.id || 'q_' + Math.random(),
          type: 'query',
          text: q.question,
          answer: q.answer,
          sources: q.sources,
          timestamp: parseDate(q.timestamp),
        })),
        ...uploads.map(u => ({
          id: u.id || 'u_' + Math.random(),
          type: 'upload',
          text: u.filename,
          fileType: u.type,
          entities: u.entitiesFound,
          relationships: u.relationshipsFound,
          timestamp: parseDate(u.timestamp),
        }))
      ]

      combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      setActivities(combined)
    } catch (err) {
      console.error("Failed to fetch activity history:", err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchActivities()
  }, [user, refreshKey])

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear your local session history?")) {
      clearUserHistory(user?.uid)
      setActivities([])
    }
  }

  const getIcon = (item) => {
    if (item.type === 'query') return <Search className="w-3.5 h-3.5 text-purple-400" />
    if (item.fileType === 'audio') return <Mic className="w-3.5 h-3.5 text-cyan-400" />
    if (item.fileType === 'text') return <FileText className="w-3.5 h-3.5 text-emerald-400" />
    return <FileUp className="w-3.5 h-3.5 text-pink-400" />
  }

  const formatTime = (date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return "Just now"
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return ""
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="border-t border-purple-900/30 bg-nexus-900/50 backdrop-blur-md">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-nexus-800/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Session Activity & History</span>
          {activities.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-purple-900/60 text-[10px] text-purple-300 font-bold">
              {activities.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {activities.length > 0 && (
            <button
              onClick={() => setShowFullModal(true)}
              className="p-1 rounded hover:bg-purple-900/40 text-purple-400 hover:text-purple-200 transition-colors text-[10px] flex items-center gap-1"
              title="View full audit log"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View All</span>
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-gray-400 hover:text-white"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-3 pt-0 max-h-60 overflow-y-auto space-y-2">
          {loading && activities.length === 0 ? (
             <div className="text-center text-xs text-purple-400/60 py-3 animate-pulse">Loading history...</div>
          ) : activities.length === 0 ? (
             <div className="text-center text-xs text-gray-500 py-3">No activity logged in this session</div>
          ) : (
            activities.slice(0, 10).map((item, idx) => (
              <div key={item.id || idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-nexus-800/30 border border-purple-900/20 hover:border-purple-700/30 transition-colors group">
                <div className="mt-0.5 p-1.5 rounded-md bg-nexus-900/80 group-hover:bg-nexus-900 transition-colors">
                  {getIcon(item)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-gray-300 truncate font-medium">
                    {item.text}
                  </div>
                  <div className="text-[9px] text-gray-500 mt-0.5 flex items-center justify-between">
                    <span>{item.type === 'query' ? 'Searched Graph RAG' : `Uploaded ${item.fileType || 'file'}`}</span>
                    <span>{formatTime(item.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Full Audit Log Modal */}
      {showFullModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-nexus-900 border border-purple-800/40 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-purple-900/40 flex items-center justify-between bg-nexus-950">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-sm">Account Audit & Activity History</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 text-xs font-semibold flex items-center gap-1.5 border border-red-800/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
                <button
                  onClick={() => setShowFullModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">No activity records found.</div>
              ) : (
                activities.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 rounded-xl bg-nexus-800/40 border border-purple-900/30 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-nexus-900 border border-purple-800/40">
                      {getIcon(item)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white flex items-center justify-between">
                        <span className="truncate">{item.text}</span>
                        <span className="text-[10px] text-purple-400 font-mono shrink-0 ml-2">{formatDate(item.timestamp)}</span>
                      </div>
                      {item.type === 'query' && item.answer && (
                        <div className="mt-1.5 text-[11px] text-gray-400 bg-nexus-950/60 p-2 rounded-lg border border-purple-900/20 line-clamp-3">
                          {item.answer}
                        </div>
                      )}
                      {item.type === 'upload' && (
                        <div className="mt-1 text-[10px] text-emerald-400 flex items-center gap-3">
                          <span>{item.entities || 0} entities extracted</span>
                          <span>{item.relationships || 0} relationships mapped</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
