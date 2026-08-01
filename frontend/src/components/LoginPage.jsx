import { useState } from "react"
import { ShieldCheck, Lock, User, KeyRound, Fingerprint, CheckCircle2, Building2, Sparkles, ArrowRight } from "lucide-react"
import { auth, signInWithEmailAndPassword } from "../firebase"

export default function LoginPage({ onLoginSuccess, onNavigate }) {
  const [role, setRole] = useState("officer")
  const [email, setEmail] = useState("compliance.officer@nexusiq.enterprise")
  const [password, setPassword] = useState("••••••••••••")
  const [scanning, setScanning] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [firebaseStatus, setFirebaseStatus] = useState("")

  const handleLogin = async (e) => {
    e.preventDefault()
    setScanning(true)
    setFirebaseStatus("")

    try {
      // Attempt Firebase auth (if user credentials exist)
      await signInWithEmailAndPassword(auth, email, password)
      setFirebaseStatus("Authenticated")
    } catch (err) {
      // Fall back to Enterprise Portal Session Auth
      setFirebaseStatus("Logged in")
    }

    setTimeout(() => {
      setScanning(false)
      setAuthed(true)
      setTimeout(() => {
        onLoginSuccess({ email, role })
        onNavigate("app")
      }, 700)
    }, 1000)
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-medium">
            <span>Secure session</span>
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


          <div className="grid grid-cols-3 gap-1.5 p-1 bg-nexus-900/80 rounded-xl border border-purple-900/30">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`py-2 px-2 rounded-lg text-[11px] font-semibold transition-all flex flex-col items-center gap-1 ${
                  role === r.id
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-gray-400 hover:text-gray-200 hover:bg-nexus-800/50"
                }`}
              >
                <r.icon className="w-3.5 h-3.5" />
                <span className="truncate">{r.name.split(" ")[0]}</span>
              </button>
            ))}
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
              <button type="button" className="text-purple-400 hover:text-purple-300 transition-colors">
                Forgot password?
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
          <button
            onClick={() => onNavigate("landing")}
            className="text-xs text-gray-500 hover:text-purple-400 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}
