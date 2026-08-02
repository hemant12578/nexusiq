import { useState } from 'react'
import axios from 'axios'
import GraphView from '../components/GraphView'
import UploadPanel from '../components/UploadPanel'
import QueryInterface from '../components/QueryInterface'
import StatsBar from '../components/StatsBar'
import NodeDetail from '../components/NodeDetail'
import { BrainCircuit, FileUp, Mic, FileText, Cpu, Radio } from 'lucide-react'

export default function Workspace({ API, graphData, stats, loading, setLoading, selectedNode, setSelectedNode, fetchGraph, fetchStats, handleUploadSuccess, user }) {
  const [rpiSending, setRpiSending] = useState(false)
  const [rpiToast, setRpiToast] = useState(null)

  const sendRPiIncident = async () => {
    setRpiSending(true)
    setLoading(true)
    try {
      await axios.post(`${API}/upload-text`, {
        text: `Live edge incident: Unauthorized access to server room detected by RPi sensor node at ${new Date().toLocaleTimeString()}. Employee badge scan failed. ISO 27001 Section 9.1 violation. Escalated to CISO.`,
        source_name: "RPi_EdgeNode_Live"
      })
      setRpiToast("📡 RPi Edge Incident Synced to Graph!")
      setTimeout(() => setRpiToast(null), 5000)
      handleUploadSuccess()
    } catch (err) {
      console.error("RPi simulation error:", err)
      setRpiToast("⚠️ Failed to send RPi incident")
      setTimeout(() => setRpiToast(null), 3000)
    } finally {
      setRpiSending(false)
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
            onUploadSuccess={handleUploadSuccess}
            setLoading={setLoading}
            user={user}
          />
        </div>


        <div className="flex-1 relative overflow-hidden">
          {/* RPi Live Simulation Button */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
            {rpiToast && (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-semibold shadow-lg backdrop-blur-md animate-fade-in flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>{rpiToast}</span>
              </div>
            )}
            <button
              onClick={sendRPiIncident}
              disabled={rpiSending}
              className="px-4 py-2 bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/50 hover-lift focus-glow disabled:opacity-50"
              title="Simulate live Internet-of-Things (IoT) Raspberry Pi incident stream"
            >
              <Cpu className={`w-4 h-4 text-emerald-400 ${rpiSending ? 'animate-spin' : 'animate-pulse'}`} />
              <span>{rpiSending ? "Transmitting..." : "Simulate RPi Input"}</span>
            </button>
          </div>

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
          />


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
            <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
          )}
        </div>


        <div className="w-96 border-l border-purple-900/20 overflow-y-auto glass-strong">
          <QueryInterface API={API} onQuery={() => { fetchGraph(); fetchStats(); }} user={user} />
        </div>
      </div>
    </div>
  )
}
