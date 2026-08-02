import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
// Lazy load components to optimize bundle size
import Header from './components/Header'
import Canvas3D from './components/Canvas3D'
import LandingPage from './components/LandingPage'
import LoginPage from './components/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import Workspace from './pages/Workspace'
import AboutPage from './pages/AboutPage'
import ArchitecturePage from './pages/ArchitecturePage'
import PricingPage from './pages/PricingPage'
import NotFoundPage from './pages/NotFoundPage'
import LiveFeed from './components/LiveFeed'
import axios from 'axios'
import { auth, onAuthStateChanged, signOut } from './firebase'

// Configure API endpoint based on environment
const API = import.meta.env.VITE_API_URL || 'https://nexusiq-backend-production.up.railway.app'

export default function App() {
  // Persist user state to prevent flickering during auth initialization
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nexusiq_user')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object' && parsed.email) {
          return parsed
        }
      }
      return null
    } catch (e) {
      return null
    }
  })
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] })
  const [stats, setStats] = useState({
    total_nodes: 0, total_edges: 0, documents_processed: 0, total_queries: 0
  })
  const [selectedNode, setSelectedNode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const u = { email: firebaseUser.email, role: 'officer', uid: firebaseUser.uid }
        setUser(u)
        localStorage.setItem('nexusiq_user', JSON.stringify(u))
      } else {
        // user signed out from another tab or session expired
        setUser(null)
        localStorage.removeItem('nexusiq_user')
      }
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = () => {
    signOut(auth).catch(e => console.error('Logout error:', e))
    localStorage.removeItem('nexusiq_user')
    setUser(null)
  }

  const fetchGraph = async () => {
    try {
      const res = await axios.get(`${API}/graph`)
      setGraphData(res.data)
    } catch (e) { 
      // Handle edge case where empty graph throws 500 error
      console.error('Graph fetch error:', e) 
    }
  }

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/stats`)
      setStats(res.data)
    } catch (e) { console.error('Stats fetch error:', e) }
  }

  useEffect(() => { fetchGraph(); fetchStats() }, [])

  const handleUploadSuccess = () => {
    setTimeout(() => { fetchGraph(); fetchStats() }, 1000)
  }

  return (
    <BrowserRouter>
      <div className={`min-h-screen bg-nexus-900 text-white flex flex-col font-sans transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <Canvas3D />
        <Header stats={stats} user={user} onLogout={handleLogout} API={API} />
        <LiveFeed API={API} />
        <Routes>
          <Route path="/" element={<LandingPage user={user} />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={setUser} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/pricing" element={<PricingPage user={user} />} />
          <Route path="/workspace" element={
            <ProtectedRoute user={user}>
              <Workspace
                API={API}
                user={user}
                graphData={graphData}
                stats={stats}
                loading={loading}
                setLoading={setLoading}
                selectedNode={selectedNode}
                setSelectedNode={setSelectedNode}
                fetchGraph={fetchGraph}
                fetchStats={fetchStats}
                handleUploadSuccess={handleUploadSuccess}
              />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
