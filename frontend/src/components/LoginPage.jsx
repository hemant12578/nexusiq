import { useState } from "react"
import { ShieldCheck, Lock, User, KeyRound, Fingerprint, CheckCircle2, Building2, Sparkles, ArrowRight, Mail, AlertCircle, Zap } from "lucide-react"
import { auth, signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, googleProvider } from "../firebase"
import { useNavigate, Link } from "react-router-dom"
import { saveUserProfile } from "../services/firestoreService"

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate()
  const [role, setRole] = useState("officer")
  const [email, setEmail] = useState("judges@innovahack.com")
  const [password, setPassword] = useState("judges123")
  const [scanning, setScanning] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [firebaseStatus, setFirebaseStatus] = useState("")
  const [resetMsg, setResetMsg] = useState("")
  const [resetError, setResetError] = useState("")
  const [resetLoading, setResetLoading] = useState(false)

  const handleForgotPassword = async () => {
    if (!email) {
      setResetError("Enter your email first")
      return
    }
    setResetLoading(true)
    setResetMsg("")
    setResetError("")
    try {
      await sendPasswordResetEmail(auth, email)
      setResetMsg("Reset link sent to " + email)
    } catch (err) {
      setResetMsg("Reset link sent if account exists")
    }
    setResetLoading(false)
  }

  const executeLoginSuccess = (userObj) => {
    setScanning(false)
    setAuthed(true)
    setTimeout(() => {
      saveUserProfile(userObj.uid, userObj.email, userObj.role)
      try { localStorage.setItem('nexusiq_user', JSON.stringify(userObj)) } catch (e) {}
      onLoginSuccess(userObj)
      navigate("/workspace")
    }, 700)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setScanning(true)
    setFirebaseStatus("")

    try {
      const res = await signInWithEmailAndPassword(auth, email, password)
      setFirebaseStatus("Authenticated")
      executeLoginSuccess({ email: res.user.email, role, uid: res.user.uid })
    } catch (err) {
      console.error("Firebase auth failed:", err)
      setFirebaseStatus(err.message || "Authentication Failed")
      setScanning(false)
    }
  }

  const handleGoogleLogin = async () => {
    setScanning(true)
    setFirebaseStatus("Google OAuth")
    try {
      const result = await signInWithPopup(auth, googleProvider)
      executeLoginSuccess({ email: result.user.email, role: "officer", uid: result.user.uid })
    } catch (err) {
      console.error("Google login failed:", err)
      setFirebaseStatus(err.message || "Google Login Failed")
      setScanning(false)
    }
  }

  const roles = [
    { id: "officer", name: "Compliance Officer", icon: ShieldCheck },
    { id: "auditor", name: "Risk Auditor", icon: Building2 },
    { id: "admin", name: "System Admin", icon: KeyRound },
  ]

  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6 animate-fade-in">

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center font-bold text-xl mx-auto shadow-xl shadow-purple-600/30 animate-glow-pulse">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight gradient-text">NexusIQ Portal</h1>
          <p className="text-xs text-gray-400 font-light">Compliance workspace login</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-medium">
            <span>Judge Credentials Pre-filled</span>
          </div>
        </div>


        <div className="bg-nexus-800/80 backdrop-blur-2xl p-8 rounded-3xl border border-purple-800/30 shadow-2xl shadow-purple-950/50 space-y-6 glow-border relative overflow-hidden">

          {scanning && (
            <div className="absolute inset-0 bg-purple-950/80 backdrop-blur-md z-20 flex flex-col items-center justify-center space-y-4 animate-fade-in">
              <div className="relative">
                <Fingerprint className="w-16 h-16 text-purple-400 animate-pulse" />
                <div className="absolute inset-0 border-2 border-purple-400 rounded-full animate-ping opacity-40" />
              </div>
              <div className="text-xs text-purple-300 font-semibold uppercase tracking-widest animate-pulse text-center">
                <div>Logging in...</div>
                <div className="text-[10px] text-purple-400/80 font-mono mt-1 font-normal">Verifying credentials...</div>
              </div>
            </div>
          )}


          {authed && (
            <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md z-20 flex flex-col items-center justify-center space-y-3 animate-fade-in">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-check" />
              <div className="text-sm text-emerald-300 font-bold tracking-wide">
                Logged in
              </div>
              <div className="text-xs text-emerald-400/80 font-mono">{firebaseStatus || "Session Secured"}</div>
              <div className="text-[10px] text-gray-400 pt-1">Redirecting...</div>
            </div>
          )}

          {resetMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{resetMsg}</span>
            </div>
          )}

          {resetError && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{resetError}</span>
            </div>
          )}

          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-3 pt-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-bold text-sm transition-all hover-lift"
              >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              <span>Sign in with Google</span>
            </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-purple-900/40" />
            <span className="flex-shrink mx-3 text-[10px] text-gray-500 uppercase tracking-widest font-mono">Or use credentials</span>
            <div className="flex-grow border-t border-purple-900/40" />
          </div>

          <div className="grid grid-cols-3 gap-2 bg-nexus-900/80 p-1 rounded-xl border border-purple-900/30">
            {roles.map((r) => {
              const Icon = r.icon
              const active = role === r.id
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                    active
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{r.name.split(" ")[0]}</span>
                </button>
              )
            })}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium tracking-wide flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" /> Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-nexus-900/80 border border-purple-900/40 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus-glow transition-all font-light"
                  placeholder="name@enterprise.com"
                />
              </div>
            </div>


            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium tracking-wide flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" /> Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-nexus-900/80 border border-purple-900/40 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus-glow transition-all font-light"
                  placeholder="••••••••••••"
                />
              </div>
            </div>


            <div className="flex items-center justify-between text-xs text-gray-400 font-light">
              <label className="flex items-center gap-2 cursor-pointer hover:text-gray-300">
                <input type="checkbox" defaultChecked className="rounded bg-nexus-900 border-purple-800 text-purple-600 focus:ring-0" />
                <span>Remember session</span>
              </label>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-purple-400 hover:text-purple-300 transition-colors font-medium hover:underline disabled:opacity-50"
              >
                {resetLoading ? "Sending link..." : "Forgot password?"}
              </button>
            </div>


            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold text-sm text-white shadow-xl shadow-purple-700/30 transition-all hover-lift flex items-center justify-center gap-2 group"
            >
              <Sparkles className="w-4 h-4" />
              <span>Sign in</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>


          <div className="pt-2 text-center border-t border-purple-900/20 text-[11px] text-gray-500 font-light flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure connection</span>
          </div>
        </div>


        <div className="text-center">
          <Link
            to="/"
            className="text-xs text-gray-500 hover:text-purple-400 transition-colors"
          >
            ← Back
          </Link>
        </div>
      </div>
    </div>
  )
}
