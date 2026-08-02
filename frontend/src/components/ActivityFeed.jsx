import { useState, useEffect } from 'react'
import { getQueryHistory, getUploadHistory } from '../services/firestoreService'
import { Activity, ChevronDown, ChevronUp, Search, FileUp, Mic, FileText } from 'lucide-react'

export default function ActivityFeed({ user, refreshKey }) {
  const [activities, setActivities] = useState([])
  const [isOpen, setIsOpen] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchActivities() {
      if (!user?.uid) return
      setLoading(true)
      try {
        const queries = await getQueryHistory(user.uid, 5)
        const uploads = await getUploadHistory(user.uid, 5)

        const combined = [
          ...queries.map(q => ({
            id: q.id,
            type: 'query',
            text: q.question,
            timestamp: q.timestamp?.toDate ? q.timestamp.toDate() : new Date(),
          })),
          ...uploads.map(u => ({
            id: u.id,
            type: 'upload',
            text: u.filename,
            fileType: u.type,
            timestamp: u.timestamp?.toDate ? u.timestamp.toDate() : new Date(),
          }))
        ]

        combined.sort((a, b) => b.timestamp - a.timestamp)
        setActivities(combined.slice(0, 10))
      } catch (err) {
        console.error("failed to fetch activities", err)
      }
      setLoading(false)
    }
    fetchActivities()
  }, [user, refreshKey])

  const getIcon = (item) => {
    if (item.type === 'query') return <Search className="w-3.5 h-3.5 text-purple-400" />
    if (item.fileType === 'audio') return <Mic className="w-3.5 h-3.5 text-cyan-400" />
    if (item.fileType === 'text') return <FileText className="w-3.5 h-3.5 text-emerald-400" />
    return <FileUp className="w-3.5 h-3.5 text-pink-400" />
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!user) return null

  return (
    <div className="border-t border-purple-900/30 bg-nexus-900/50 backdrop-blur-md">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-nexus-800/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Recent Activity</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
      </div>

      {isOpen && (
        <div className="p-3 pt-0 max-h-60 overflow-y-auto space-y-2">
          {loading && activities.length === 0 ? (
             <div className="text-center text-xs text-gray-500 py-2">Loading...</div>
          ) : activities.length === 0 ? (
             <div className="text-center text-xs text-gray-500 py-2">No recent activity</div>
          ) : (
            activities.map((item, idx) => (
              <div key={item.id || idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-nexus-800/30 border border-purple-900/20 hover:border-purple-700/30 transition-colors group">
                <div className="mt-0.5 p-1.5 rounded-md bg-nexus-900/80 group-hover:bg-nexus-900 transition-colors">
                  {getIcon(item)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-gray-300 truncate font-medium">
                    {item.text}
                  </div>
                  <div className="text-[9px] text-gray-500 mt-0.5">
                    {item.type === 'query' ? 'Searched Graph' : 'Uploaded File'} • {formatTime(item.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
