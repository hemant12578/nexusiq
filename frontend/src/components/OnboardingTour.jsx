import { useState, useEffect } from "react"
import { ArrowRight, ArrowLeft, X, Sparkles } from "lucide-react"

const TOUR_STEPS = [
  {
    title: "Welcome to NexusIQ",
    content: "Your AI-powered compliance knowledge graph. Let's take a quick tour to see how to transform your documents into interactive insights.",
    target: null, // Center screen
  },
  {
    title: "Data Ingestion",
    content: "Upload PDFs, audio logs, or text here. NexusIQ uses LLMs to automatically extract entities, policies, and relationships.",
    target: "tour-upload-panel",
  },
  {
    title: "Knowledge Graph",
    content: "Watch your compliance network build in real-time. Nodes represent people, documents, policies, and risks. Click any node for details.",
    target: "tour-graph-view",
  },
  {
    title: "AI Compliance Officer",
    content: "Ask natural language questions about your compliance posture. The RAG system will query the graph and cite specific sources.",
    target: "tour-query-panel",
  },
  {
    title: "Edge Hardware Integration",
    content: "Simulate IoT incidents (like a server room overheating) to see how physical events are mapped into the compliance graph instantly.",
    target: "tour-edge-sim",
  },
  {
    title: "Real-time Metrics",
    content: "Monitor your overall compliance readiness score, risk level, and AI hallucination rate all calculated live from your graph data.",
    target: "tour-stats-bar",
  }
];

export default function OnboardingTour({ onComplete }) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const updateTargetPosition = () => {
    const currentStep = TOUR_STEPS[step];
    if (currentStep.target) {
      const el = document.querySelector(`[data-tour-step="${currentStep.target}"]`);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener("resize", updateTargetPosition);
    return () => window.removeEventListener("resize", updateTargetPosition);
  }, [step]);

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleComplete = () => {
    localStorage.setItem("nexusiq_onboarding_done", "true");
    if (onComplete) onComplete();
  };

  const currentStep = TOUR_STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none transition-opacity duration-500">
      {/* Dark Overlay with Spotlight cut-out */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-all duration-500 pointer-events-auto"
        style={targetRect ? {
          clipPath: `polygon(
            0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
            ${targetRect.left - 10}px ${targetRect.top - 10}px,
            ${targetRect.left - 10}px ${targetRect.bottom + 10}px,
            ${targetRect.right + 10}px ${targetRect.bottom + 10}px,
            ${targetRect.right + 10}px ${targetRect.top - 10}px,
            ${targetRect.left - 10}px ${targetRect.top - 10}px
          )`
        } : {}}
      />
      
      {/* Highlight Box Outline */}
      {targetRect && (
        <div 
          className="absolute border-2 border-purple-500 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.5)] pointer-events-none transition-all duration-500"
          style={{
            top: targetRect.top - 10,
            left: targetRect.left - 10,
            width: targetRect.width + 20,
            height: targetRect.height + 20,
          }}
        />
      )}

      {/* Tour Dialog Box */}
      <div 
        className="absolute bg-nexus-800 border border-purple-500/40 rounded-2xl p-6 shadow-2xl shadow-purple-900/50 w-[340px] pointer-events-auto transition-all duration-500 z-[101]"
        style={targetRect ? {
          // Position relative to target, avoiding screen edges
          top: Math.min(Math.max(20, targetRect.bottom + 20), window.innerHeight - 250),
          left: Math.min(Math.max(20, targetRect.left + (targetRect.width / 2) - 170), window.innerWidth - 360),
        } : {
          // Center screen
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 text-purple-300 font-bold text-lg">
            <Sparkles className="w-5 h-5" />
            {currentStep.title}
          </div>
          <button onClick={handleComplete} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-300 text-sm leading-relaxed mb-6 font-light">
          {currentStep.content}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-purple-400 w-4' : 'bg-gray-600'}`}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrev}
              disabled={step === 0}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors rounded-lg hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleNext}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-900/40 flex items-center gap-2 transition-colors"
            >
              {step === TOUR_STEPS.length - 1 ? "Get Started" : "Next"}
              {step < TOUR_STEPS.length - 1 && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
