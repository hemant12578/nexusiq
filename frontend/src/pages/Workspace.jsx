import { useState } from 'react'
import axios from 'axios'
import GraphView from '../components/GraphView'
import UploadPanel from '../components/UploadPanel'
import QueryInterface from '../components/QueryInterface'
import StatsBar from '../components/StatsBar'
import NodeDetail from '../components/NodeDetail'
import ActivityFeed from '../components/ActivityFeed'
import { BrainCircuit, FileUp, Mic, FileText, Cpu, Radio } from 'lucide-react'
import { getApiUrl } from '../utils/api'

export default function Workspace({ API, graphData, stats, loading, setLoading, selectedNode, setSelectedNode, fetchGraph, fetchStats, handleUploadSuccess, user }) {
  const [activityRefreshKey, setActivityRefreshKey] = useState(0)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const wrappedHandleUploadSuccess = () => {
    handleUploadSuccess()
    setActivityRefreshKey(prev => prev + 1)
  }

  const handleDeleteNode = async (nodeId) => {
    try {
      const baseUrl = getApiUrl(API)
      await axios.post(`${baseUrl}/delete-node`, { node_id: nodeId })
      setSelectedNode(null)
      fetchGraph()
      fetchStats()
    } catch (err) {
      console.error("Failed to delete node:", err)
    }
  }

  const handleClearGraphClick = () => {
    setShowClearConfirm(true)
  }

  const executeClearGraph = async () => {
    setShowClearConfirm(false)
    setLoading(true)
    try {
      const baseUrl = getApiUrl(API)
      await axios.post(`${baseUrl}/clear-graph`)
      setSelectedNode(null)
      fetchGraph()
      fetchStats()
    } catch (err) {
      console.error("Failed to clear graph:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative z-10 flex flex-col h-[calc(100vh-61px)] overflow-hidden">
      <StatsBar stats={stats} />

      <div className="flex flex-1 overflow-hidden">

        <div className="w-80 border-r border-purple-900/20 overflow-y-auto glass-strong">
          <UploadPanel
            API={API}
            onUploadSuccess={wrappedHandleUploadSuccess}
            setLoading={setLoading}
            user={user}
          />
        </div>


        <div className="flex-1 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex items-center justify-center animate-fade-in">
              <div className="flex flex-col items-center gap-4">

                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
                  <div className="absolute inset-2 border-2 border-cyan-500/20 border-b-cyan-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                  <div className="absolute inset-4 border-2 border-pink-500/20 border-t-pink-400 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
                </div>
                <div className="text-purple-300 text-base font-semibold glow-text animate-pulse">
                  Building Knowledge Web...
                </div>
                <div className="text-gray-500 text-xs font-light">Synthesizing entity-relationship graph</div>
              </div>
            </div>
          )}

          <GraphView
            graphData={graphData}
            onNodeClick={setSelectedNode}
            onClearGraph={handleClearGraphClick}
          />


          {/* show empty state if no nodes */}
          {graphData.nodes.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-5 animate-float pointer-events-auto max-w-md p-8 rounded-3xl bg-nexus-800/40 backdrop-blur-xl border border-purple-900/30 glow-border">
                <div className="w-16 h-16 rounded-2xl bg-purple-950/80 border border-purple-700/40 flex items-center justify-center text-purple-400 mx-auto shadow-xl shadow-purple-900/30">
                  <BrainCircuit className="w-8 h-8" />
                </div>
                <div className="text-xl font-bold tracking-tight gradient-text">
                  Knowledge Graph Empty
                </div>
                <p className="text-xs text-gray-400 font-light leading-relaxed">
                  Upload compliance PDFs, audio logs, or text streams using the left panel to synthesize your live graph.
                </p>
                <div className="flex justify-center gap-6 pt-2">
                  {[
                    { icon: FileUp, label: "PDF Documents" },
                    { icon: Mic, label: "Audio Logs" },
                    { icon: FileText, label: "Text Streams" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5 text-xs text-purple-300/80 font-medium">
                      <item.icon className="w-3.5 h-3.5 text-purple-400" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {selectedNode && (
            <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} onDeleteNode={handleDeleteNode} />
          )}
        </div>


        <div className="w-96 border-l border-purple-900/20 flex flex-col glass-strong">
          <div className="flex-1 overflow-y-auto">
            <QueryInterface API={API} onQuery={() => { fetchGraph(); fetchStats(); setActivityRefreshKey(prev => prev + 1); }} user={user} />
          </div>
          <ActivityFeed user={user} refreshKey={activityRefreshKey} />
        </div>
      </div>

      {showClearConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-nexus-800 border border-red-500/30 rounded-2xl p-6 shadow-2xl max-w-sm w-full glow-border">
            <h3 className="text-xl font-bold text-gray-100 mb-2">Clear Knowledge Graph?</h3>
            <p className="text-sm text-gray-400 mb-6">
              This action will permanently delete all nodes and relationships. This cannot be undone. Are you sure?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeClearGraph}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600/80 hover:bg-red-500 text-white shadow-lg shadow-red-900/50 transition-colors"
              >
                Yes, clear it
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
