import { useState } from "react"
import { Link } from "react-router-dom"
import {
  ShieldCheck,
  Network,
  Layers,
  Cpu,
  Zap,
  CheckCircle2,
  ArrowRight,
  Lock,
  FileSearch,
  BarChart3,
  Database,
  Sparkles,
  ChevronDown,
  HelpCircle,
  FileText,
  Mic,
  Activity,
  Award,
  GitBranch,
  Terminal,
  Globe
} from "lucide-react"

export default function LandingPage({ user }) {
  const [activeTab, setActiveTab] = useState("pdf")
  const [openFaq, setOpenFaq] = useState(null)

  const featureTabs = {
    pdf: {
      title: "PDF parsing",
      desc: "Extract text and tables from PDFs with page-level mapping.",
      metrics: ["Multi-page OCR", "Table Structure Retention", "Page-level Source Mapping"],
      codeSnippet: `[PAGE 1] Policy ISO 27001 §4.2: Password parameters require 16+ chars, rotation every 90 days. Overseen by CISO John Doe.`
    },
    audio: {
      title: "Audio transcription",
      desc: "Transcribe audio logs and identify entities and compliance breaches.",
      metrics: ["WebM/WAV Support", "Severity Classification", "Real-Time Edge Ingestion"],
      codeSnippet: `{"transcript": "Incident #402: Unauthorized server room entry at 14:00 by contractor Mark V.", "severity": "high"}`
    },
    graph: {
      title: "Graph extraction",
      desc: "Parse unstructured text into a directed graph of entities and relations.",
      metrics: ["7 Entity Types", "Directed Relational Edges", "NetworkX Engine"],
      codeSnippet: `(John Doe: Person) -[OVERSEES]-> (ISO 27001 Policy: Policy) -[APPLIES_TO]-> (Nexus Corp: Organization)`
    },
    rag: {
      title: "Graph RAG with source verification",
      desc: "Answer queries using verified graph paths without guessing.",
      metrics: ["0% Hallucination Rule", "Exact Citation Linking", "Sub-1.5s Graph Search"],
      codeSnippet: `ANSWER: Password rotation is mandatory every 90 days.\nSOURCES:\n- ISO 27001 Policy from policy_doc.pdf`
    }
  }

  const faqs = [
    {
      q: "How does NexusIQ guarantee zero hallucination?",
      a: "We build an explicit entity-relationship graph instead of relying on vector embeddings. If a path doesn't exist, we don't guess."
    },
    {
      q: "What document formats are supported for ingestion?",
      a: "We support PDFs, audio files, and raw text."
    },
    {
      q: "Can NexusIQ be deployed on-premise or on edge hardware?",
      a: "Yes, you can run the edge agent on a Raspberry Pi to forward audio logs."
    },
    {
      q: "What regulatory frameworks does NexusIQ compliance engine cover?",
      a: "It's framework-agnostic and works with ISO 27001, GDPR, HIPAA, and custom handbooks."
    }
  ]

  return (
    <div className="relative z-10 min-h-screen text-white overflow-y-auto">
      <section className="relative px-6 pt-16 pb-20 max-w-6xl mx-auto text-center space-y-8 animate-fade-in">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-widest backdrop-blur-md shadow-lg shadow-purple-950/40 hover-lift">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Gen AI Round 2 • InnovaHack 2026 • Team Nexus</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight gradient-text max-w-5xl mx-auto">
          Turn compliance docs into a queryable knowledge graph
        </h1>

        <p className="text-gray-300 text-base md:text-lg max-w-3xl mx-auto font-light leading-relaxed">
          Transform unstructured compliance documents, audio logs, and regulatory text into a live interactive knowledge web powered by Graph RAG with zero hallucination.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/workspace"
            className="px-8 py-4 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold text-sm shadow-xl shadow-purple-700/30 transition-all hover-lift flex items-center gap-2.5 group"
          >
            <span>{user ? "Enter workspace" : "Open workspace"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          {!user && (
            <Link
              to="/login"
              className="px-8 py-4 bg-nexus-800/80 hover:bg-nexus-700/80 border border-purple-900/50 hover:border-purple-600/50 rounded-xl font-bold text-sm text-gray-300 transition-all hover-lift flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-purple-400" />
              <span>Sign in</span>
            </Link>
          )}

          <Link
            to="/pricing"
            className="px-8 py-4 bg-purple-900/40 hover:bg-purple-800/50 border border-purple-500/30 rounded-xl font-bold text-sm text-purple-200 transition-all hover-lift flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Pricing &amp; Plans</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8">
          {[
            { label: "Hallucination Rate", value: "0.0%", sub: "Strict Citation Linking" },
            { label: "Entity Types", value: "7 Types", sub: "Normalized Schema" },
            { label: "Graph Engine", value: "NetworkX", sub: "DiGraph Web" },
            { label: "Inference Latency", value: "< 1.2s", sub: "Fast Graph RAG" },
          ].map((s, i) => (
            <div key={i} className="bg-nexus-800/40 backdrop-blur-xl p-4 rounded-2xl border border-purple-900/30 text-center space-y-1 hover-lift">
              <div className="text-xl font-bold text-purple-300 font-mono">{s.value}</div>
              <div className="text-xs font-semibold text-gray-200">{s.label}</div>
              <div className="text-[10px] text-gray-500 font-light">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 bg-nexus-950/60 border-t border-purple-900/20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">The problem</h2>
            <p className="text-gray-400 text-xs md:text-sm max-w-2xl mx-auto font-light">
              Enterprises hold thousands of unorganized compliance documents spread across PDFs, audio logs, and tables. Standard vector databases rely on naive text chunking which fragments context.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-nexus-800/50 p-6 rounded-2xl border border-rose-900/30 space-y-3 hover-lift">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-400">
                <FileSearch className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-gray-200">Vector DBs lose context</h3>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                Naive chunking cuts sentences across boundaries, severing the link between a compliance rule and its responsible officer or penalty clause.
              </p>
            </div>

            <div className="bg-nexus-800/50 p-6 rounded-2xl border border-amber-900/30 space-y-3 hover-lift">
              <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-gray-200">LLMs hallucinate</h3>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                When vector search fails to retrieve exact relational context, LLMs generate convincing yet false compliance interpretations — leading to legal risks.
              </p>
            </div>

            <div className="bg-nexus-800/50 p-6 rounded-2xl border border-emerald-900/30 space-y-3 hover-lift">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-gray-200">Our approach</h3>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                NexusIQ constructs an explicit directed graph web. Answers are formed strictly from validated graph paths, citing exact document sources.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <div className="text-xs font-semibold text-purple-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Feature Capabilities
          </div>
          <h2 className="text-3xl font-bold tracking-tight gradient-text">How it works</h2>
          <p className="text-gray-400 text-xs md:text-sm max-w-xl mx-auto font-light">
            Explore how NexusIQ processes heterogeneous regulatory assets into zero-hallucination compliance intelligence.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
          {[
            { id: "pdf", label: "PDF Document Parsing", icon: FileText },
            { id: "audio", label: "Audio Incident Logs", icon: Mic },
            { id: "graph", label: "Graph Synthesis", icon: GitBranch },
            { id: "rag", label: "Graph RAG Engine", icon: Cpu },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "bg-nexus-800/60 text-gray-400 hover:text-gray-200 border border-purple-900/30"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {featureTabs[activeTab] && (
          <div className="bg-nexus-800/80 backdrop-blur-2xl rounded-3xl p-8 border border-purple-700/30 glow-border grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">{featureTabs[activeTab].title}</h3>
              <p className="text-xs text-gray-300 leading-relaxed font-light">{featureTabs[activeTab].desc}</p>
              
              <div className="space-y-2 pt-2">
                {featureTabs[activeTab].metrics.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-nexus-950 rounded-2xl p-5 border border-purple-900/40 font-mono text-[11px] text-purple-300 space-y-2 overflow-x-auto shadow-inner">
              <div className="flex items-center justify-between text-gray-500 border-b border-purple-900/30 pb-2">
                <span className="flex items-center gap-1.5 text-[10px]">
                  <Terminal className="w-3.5 h-3.5 text-purple-400" /> Pipeline Output
                </span>
                <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-semibold">Verified</span>
              </div>
              <pre className="whitespace-pre-wrap text-gray-300 leading-relaxed">{featureTabs[activeTab].codeSnippet}</pre>
            </div>
          </div>
        )}
      </section>

      <section className="px-6 py-20 bg-nexus-950/80 border-t border-b border-purple-900/20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-white">Compare</h2>
            <p className="text-gray-400 text-xs md:text-sm max-w-xl mx-auto font-light">
              How NexusIQ's Graph RAG approach outperforms traditional vector search pipelines.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-purple-900/30 glass-strong">
            <table className="w-full text-xs text-left">
              <thead className="bg-purple-950/60 text-purple-300 uppercase tracking-widest text-[10px] border-b border-purple-900/30">
                <tr>
                  <th className="px-6 py-4 font-semibold">Technical Aspect</th>
                  <th className="px-6 py-4 font-semibold text-gray-400">Standard Vector DB</th>
                  <th className="px-6 py-4 font-semibold text-emerald-400">NexusIQ Graph RAG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/20 text-gray-300 font-light">
                <tr>
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-400" /> Data Sources
                  </td>
                  <td className="px-6 py-4 text-gray-500">Text files</td>
                  <td className="px-6 py-4 text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> PDFs, Audio, Text
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" /> Context
                  </td>
                  <td className="px-6 py-4 text-gray-500">Chunking breaks relations</td>
                  <td className="px-6 py-4 text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Directed Graph Web
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" /> Hallucination Rate
                  </td>
                  <td className="px-6 py-4 text-rose-400 font-semibold">High</td>
                  <td className="px-6 py-4 text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 0% Hallucinations
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" /> Citations
                  </td>
                  <td className="px-6 py-4 text-gray-500">Paragraph chunks</td>
                  <td className="px-6 py-4 text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Exact node citations
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 max-w-5xl mx-auto text-center space-y-8">
        <h2 className="text-xl font-bold text-gray-300">Supported Compliance Frameworks</h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {["ISO 27001", "GDPR", "HIPAA", "SOC 2 Type II", "PCI-DSS", "NIST CSF", "EU AI Act"].map((fw) => (
            <div
              key={fw}
              className="px-4 py-2.5 rounded-xl bg-nexus-800/60 border border-purple-900/30 text-xs font-semibold text-purple-300 hover:border-purple-600/40 hover-lift flex items-center gap-2"
            >
              <Award className="w-3.5 h-3.5 text-purple-400" />
              <span>{fw}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-400" /> Frequently Asked Questions
          </h2>
          <p className="text-xs text-gray-400 font-light">Everything you need to know about NexusIQ compliance intelligence.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-nexus-800/50 rounded-2xl border border-purple-900/30 overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-5 text-left font-semibold text-xs text-gray-200 flex items-center justify-between gap-4 hover:text-purple-300"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>

              {openFaq === i && (
                <div className="px-5 pb-5 text-xs text-gray-400 font-light leading-relaxed border-t border-purple-900/20 pt-3 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 text-center max-w-4xl mx-auto space-y-6">
        <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-950/60 via-nexus-800 to-indigo-950/60 border border-purple-700/40 glow-border space-y-6">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Ready to Test NexusIQ Compliance Graph?</h2>
          <p className="text-xs text-gray-300 max-w-lg mx-auto font-light leading-relaxed">
            InnovaHack Chapter 1 • Problem Statement 1: Multi-Modal Knowledge Graph Synthesis for Enterprise Compliance.
          </p>
          
          <Link
            to="/workspace"
            className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xl shadow-purple-700/40 hover-lift inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open workspace</span>
          </Link>
        </div>

        <div className="text-[11px] text-gray-600 font-light pt-4 flex items-center justify-center gap-4">
          <span>NexusIQ Platform</span>
          <span>•</span>
          <span>Team Nexus</span>
          <span>•</span>
          <span>Deadline: 2 Aug 2026, 6:00 PM IST</span>
        </div>
      </section>
    </div>
  )
}
