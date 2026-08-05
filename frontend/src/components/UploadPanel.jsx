import { useState, useRef, useEffect } from "react"
import axios from "axios"
import { FolderUp, FileUp, Mic, FileText, Video, CheckCircle2, Zap, Sparkles, Database, Layers, AlertTriangle, X, Radio } from "lucide-react"
import { saveUploadRecord } from '../services/firestoreService'
import { getApiUrl, friendlyError } from '../utils/api'

export default function UploadPanel({ API, onUploadSuccess, setLoading, user }) {
  const [uploads, setUploads] = useState([])
  const [recording, setRecording] = useState(false)
  const [text, setText] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [successFlash, setSuccessFlash] = useState(false)
  const [toast, setToast] = useState(null)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const toastTimer = useRef(null)
  const baseUrl = getApiUrl(API)

  const [edgeHealthy, setEdgeHealthy] = useState(false)
  const [edgeIncident, setEdgeIncident] = useState(null)

  useEffect(() => {
    axios.get(`${baseUrl}/health`)
      .then(() => setEdgeHealthy(true))
      .catch(() => setEdgeHealthy(false))
  }, [baseUrl])

  const showToast = (msg, type = 'error') => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }

  const flashSuccess = () => {
    setSuccessFlash(true)
    setTimeout(() => setSuccessFlash(false), 1200)
  }

  const uploadPDF = async (file) => {
    setLoading(true)
    setUploading(true)
    const form = new FormData()
    form.append("file", file)
    try {
      const res = await axios.post(`${baseUrl}/upload-pdf`, form, {
        timeout: 60000
      })
      setUploads(prev => [...prev, {
        name: file.name,
        entities: res.data.entities_found,
        relationships: res.data.relationships_found,
        truncated: res.data.truncated,
        type: "pdf",
        ts: Date.now()
      }])
      saveUploadRecord(user?.uid, file.name, 'pdf', res.data.entities_found, res.data.relationships_found)
      onUploadSuccess()
      flashSuccess()
    } catch (e) {
      console.error("Upload PDF error:", e)
      showToast(friendlyError(e))
    }
    setLoading(false)
    setUploading(false)
  }

  const uploadVideo = async (file) => {
    setLoading(true)
    setUploading(true)
    const form = new FormData()
    form.append("file", file)
    try {
      const res = await axios.post(`${baseUrl}/upload-video`, form)
      setUploads(prev => [...prev, {
        name: file.name,
        entities: res.data.entities_found,
        relationships: res.data.relationships_found || 0,
        type: "video",
        ts: Date.now()
      }])
      saveUploadRecord(user?.uid, file.name, 'video', res.data.entities_found, res.data.relationships_found || 0)
      onUploadSuccess()
      flashSuccess()
    } catch (e) {
      showToast(friendlyError(e))
    }
    setLoading(false)
    setUploading(false)
  }

  const processFiles = async (files) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const name = file.name.toLowerCase();
      if (name.endsWith('.pdf')) {
        await uploadPDF(file);
      } else if (name.endsWith('.mp4') || name.endsWith('.webm') || name.endsWith('.mov') || name.endsWith('.avi') || name.endsWith('.mkv')) {
        await uploadVideo(file);
      } else if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.m4a') || name.endsWith('.aac') || name.endsWith('.ogg')) {
        const form = new FormData();
        form.append("file", file);
        setLoading(true);
        setUploading(true);
        try {
          const res = await axios.post(`${baseUrl}/upload-audio`, form);
          setUploads(prev => [...prev, {
            name: file.name,
            entities: res.data.entities_found,
            relationships: 0,
            type: "audio",
            ts: Date.now()
          }]);
          saveUploadRecord(user?.uid, file.name, 'audio', res.data.entities_found, 0);
          onUploadSuccess();
          flashSuccess();
        } catch (e) {
          showToast(friendlyError(e));
        }
        setLoading(false);
        setUploading(false);
      } else {
        showToast(`Unsupported file type: ${file.name}`);
      }
    }
  }

  const startRecording = async () => {
    try {
      // Initialize MediaRecorder for audio capture
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRef.current = new MediaRecorder(stream)
      chunksRef.current = []
      mediaRef.current.ondataavailable = e => chunksRef.current.push(e.data)
      mediaRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        const form = new FormData()
        form.append("file", blob, "recording.webm")
        setLoading(true)
        setUploading(true)
        try {
          const res = await axios.post(`${baseUrl}/upload-audio`, form)
          setUploads(prev => [...prev, {
            name: "Audio Recording Log",
            entities: res.data.entities_found,
            relationships: 0,
            type: "audio",
            ts: Date.now()
          }])
          saveUploadRecord(user?.uid, 'Audio Recording', 'audio', res.data.entities_found, 0)
          onUploadSuccess()
          flashSuccess()
        } catch (e) {
          showToast(friendlyError(e))
        }
        setLoading(false)
        setUploading(false)
        stream.getTracks().forEach(track => track.stop())
      }
      mediaRef.current.start()
      setRecording(true)
    } catch (e) {
      showToast('Microphone access denied')
    }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    setRecording(false)
  }

  const uploadText = async () => {
    if (!text.trim()) return
    setLoading(true)
    setUploading(true)
    try {
      const res = await axios.post(`${baseUrl}/upload-text`, {
        text: text,
        source_name: "manual_input"
      })
      setUploads(prev => [...prev, {
        name: "Text Input Stream",
        entities: res.data.entities_found,
        relationships: res.data.relationships_found,
        type: "text",
        ts: Date.now()
      }])
      saveUploadRecord(user?.uid, 'Text Input', 'text', res.data.entities_found, res.data.relationships_found)
      setText("")
      onUploadSuccess()
      flashSuccess()
    } catch (e) {
      showToast(friendlyError(e))
    }
    setLoading(false)
    setUploading(false)
  }

  useEffect(() => {
    const handleTrigger = () => triggerEdgeIncident()
    window.addEventListener("trigger-rpi-incident", handleTrigger)
    return () => window.removeEventListener("trigger-rpi-incident", handleTrigger)
  }, [baseUrl, user])

  const triggerEdgeIncident = async () => {
    setLoading(true)
    setUploading(true)
    const temp = (32.5 + Math.random() * 5).toFixed(1)
    const incidentText = `[CRITICAL INCIDENT] Edge node ESP32_DHT11 reported temperature ${temp}C exceeding threshold 32.0C in Server Room B. Cooling fan failure detected. Violation of ISO 27001 physical environmental security policy.`
    try {
      const res = await axios.post(`${baseUrl}/upload-text`, {
        text: incidentText,
        source_name: "rpi_edge_sensor"
      })
      setUploads(prev => [...prev, {
        name: "Edge Incident Log",
        entities: res.data.entities_found,
        relationships: res.data.relationships_found,
        type: "text",
        ts: Date.now()
      }])
      setEdgeIncident({ temp, timestamp: new Date().toLocaleTimeString(), severity: "CRITICAL" })
      saveUploadRecord(user?.uid, 'Edge Incident', 'text', res.data.entities_found, res.data.relationships_found)
      onUploadSuccess()
      flashSuccess()
    } catch (e) {
      showToast(friendlyError(e))
    }
    setLoading(false)
    setUploading(false)
  }

  const typeIcons = { pdf: FileUp, audio: Mic, text: FileText, video: Video }
  const typeColors = { pdf: "from-purple-500/10 to-purple-900/10", audio: "from-rose-500/10 to-rose-900/10", text: "from-cyan-500/10 to-cyan-900/10", video: "from-amber-500/10 to-amber-900/10" }

  return (
    <div className="p-4 space-y-4 animate-slide-in-left relative">

      {successFlash && (
        <div className="absolute inset-0 bg-emerald-500/5 z-10 pointer-events-none animate-fade-in rounded-lg" />
      )}

      {toast && (
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium animate-slide-up ${
          toast.type === 'error'
            ? 'bg-red-950/80 border border-red-800/40 text-red-300'
            : 'bg-amber-950/80 border border-amber-800/40 text-amber-300'
        }`}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="p-0.5 hover:text-white transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <h2 className="text-purple-400 font-semibold text-xs uppercase tracking-widest flex items-center gap-2">
        <Database className="w-4 h-4 text-purple-400" />
        <span>Upload documents</span>
      </h2>


      <div
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-500 ripple-effect hover-lift ${
          dragOver
            ? "border-purple-400 bg-purple-900/25 scale-[1.02] shadow-lg shadow-purple-900/20"
            : uploading
              ? "border-purple-500/50 shimmer"
              : "border-purple-800/40 hover:border-purple-500/50 drop-zone-idle"
        }`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          processFiles(e.dataTransfer.files)
        }}
        onClick={() => document.getElementById("pdfInput").click()}
      >
        <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400 transition-transform duration-500 ${dragOver ? 'scale-110 animate-bounce' : 'hover-pop'}`}>
          <FolderUp className="w-6 h-6" />
        </div>
        <div className="text-sm text-gray-300 font-medium">
          {uploading ? 'Processing file...' : 'Drop files here or click to upload'}
        </div>
        <div className="text-xs text-purple-400/80 mt-1 font-light">PDF, Video (MP4/WebM), Audio, or Text</div>
        <input
          id="pdfInput"
          type="file"
          accept=".pdf,.mp4,.webm,.mov,.avi,.mkv,.mp3,.wav,.m4a"
          multiple
          className="hidden"
          onChange={e => processFiles(e.target.files)}
        />
      </div>


      <button
        onClick={recording ? stopRecording : startRecording}
        className={`w-full py-3.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all duration-500 ripple-effect hover-lift flex items-center justify-center gap-2 ${
          recording
            ? "bg-gradient-to-r from-rose-600 to-red-600 shadow-lg shadow-red-600/40 animate-pulse text-white"
            : "bg-gradient-to-r from-purple-700 via-violet-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white shadow-lg shadow-purple-700/25"
        }`}
      >
        <Mic className="w-4 h-4" />
        <span>{recording ? "Stop Audio Incident Capture" : "Record Audio Incident Log"}</span>
      </button>


      <div className="space-y-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste raw compliance text or schematic notes..."
          className="w-full h-24 bg-nexus-800/80 border border-purple-900/40 rounded-xl p-3.5 text-xs text-gray-300 resize-none focus:outline-none focus-glow transition-all placeholder-gray-600 font-light"
        />
        <button
          onClick={uploadText}
          disabled={!text.trim() || uploading}
          className="w-full py-2.5 bg-purple-900/50 hover:bg-purple-800/60 disabled:opacity-25 disabled:cursor-not-allowed rounded-xl text-xs font-semibold uppercase tracking-wider text-purple-200 transition-all border border-purple-800/30 hover:border-purple-600/40 ripple-effect hover-lift flex items-center justify-center gap-1.5"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
              <span>Analyzing...</span>
            </span>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Analyze Text Input</span>
            </>
          )}
        </button>
      </div>

      <div className="pt-2 border-t border-purple-900/40 mt-4 space-y-3" data-tour-step="tour-edge-sim">
        <div className="flex items-center justify-between">
          <h2 className="text-purple-400 font-semibold text-xs uppercase tracking-widest flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Edge Hardware Simulator</span>
          </h2>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-[9px] uppercase">
            <span className={`w-1.5 h-1.5 rounded-full ${edgeHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            <span className={edgeHealthy ? 'text-emerald-300' : 'text-red-400'}>{edgeHealthy ? 'RPi Connected' : 'Offline'}</span>
          </div>
        </div>
        
        <button
          onClick={triggerEdgeIncident}
          disabled={uploading}
          className="w-full py-2.5 bg-amber-950/60 hover:bg-amber-900/80 rounded-xl text-xs font-semibold uppercase tracking-wider text-amber-300 transition-all border border-amber-800/40 shadow-lg shadow-amber-900/20 ripple-effect hover-lift flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Trigger Edge Incident</span>
        </button>

        {edgeIncident && (
          <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-3 text-xs animate-fade-in">
            <div className="flex justify-between items-center text-red-300 font-mono text-[10px] mb-1">
              <span>DEVICE: ESP32_DHT11</span>
              <span>{edgeIncident.timestamp}</span>
            </div>
            <div className="text-gray-300">
              <span className="font-bold text-red-400">[{edgeIncident.severity}]</span> Temperature <span className="text-white font-bold">{edgeIncident.temp}°C</span> exceeded safe threshold. ISO 27001 violation logged.
            </div>
          </div>
        )}
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Uploaded ({uploads.length})</span>
          </h3>
          {uploads.map((u, i) => {
            const IconComp = typeIcons[u.type] || FileUp
            return (
              <div
                key={u.ts || i}
                className={`bg-gradient-to-r ${typeColors[u.type] || ''} rounded-xl p-3 border border-purple-900/20 hover:border-purple-600/30 transition-all hover-lift animate-slide-up`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-2.5">
                  <IconComp className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-medium truncate flex-1 text-gray-200">{u.name}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[10px] text-purple-400/70 mt-1.5 ml-6 flex items-center gap-2 font-mono">
                  <span className="px-1.5 py-0.5 bg-purple-900/40 rounded-md">{u.entities} nodes</span>
                  <span className="text-gray-600">•</span>
                  <span className="px-1.5 py-0.5 bg-purple-900/40 rounded-md">{u.relationships || 0} links</span>
                </div>
                {u.truncated && <div className="text-amber-400 text-[9px] mt-1 ml-6">⚠ Document truncated (large file)</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
