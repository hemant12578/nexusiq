import { X, ShieldAlert, ShieldCheck, Bookmark, Activity } from "lucide-react";

export default function ComplianceBreakdown({ score, breakdown, onClose }) {
  if (!breakdown) return null;

  return (
    <div className="absolute top-12 right-6 z-50 w-80 bg-nexus-900/95 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-900/40 p-5 glow-border animate-fade-in pointer-events-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-cyan-300 font-bold text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Compliance Breakdown
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs text-gray-300">
          <span>Base Score</span>
          <span className="font-mono">{breakdown.base}%</span>
        </div>
        
        <div className="flex justify-between items-center text-xs text-emerald-300">
          <span className="flex items-center gap-1.5"><Bookmark className="w-3.5 h-3.5" /> Frameworks (+{breakdown.frameworks}%)</span>
          <span className="font-mono">{breakdown.frameworks_detected.join(", ") || "None"}</span>
        </div>
        
        <div className="flex justify-between items-center text-xs text-emerald-300">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Policies (+{breakdown.policies}%)</span>
        </div>

        <div className="flex justify-between items-center text-xs text-emerald-300">
          <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Relationships (+{breakdown.relationships}%)</span>
        </div>

        <div className="flex justify-between items-center text-xs text-red-400 border-b border-purple-900/40 pb-3">
          <span className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Violations/Incidents ({breakdown.violations}%)</span>
        </div>
        
        <div className="flex justify-between items-center text-sm font-bold text-cyan-300 pt-1">
          <span>Total Score</span>
          <span className="font-mono">{score}%</span>
        </div>
      </div>
    </div>
  );
}
