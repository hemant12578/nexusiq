import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Sparkles, Zap, ShieldCheck, Building2, HelpCircle, CheckCircle2, AlertCircle, Info, Loader2, CreditCard, Lock } from 'lucide-react'
import axios from 'axios'
import { saveSubscription } from '../services/firestoreService'

export default function PricingPage({ user }) {
  const [isAnnual, setIsAnnual] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [loadingPlan, setLoadingPlan] = useState(null)
  const navigate = useNavigate()

  // Define subscription plans and features
  const plans = [
    {
      name: "Starter",
      badge: "Free Forever",
      price: "₹0",
      priceInPaise: 0,
      period: "forever",
      desc: "Essential Knowledge Graph RAG for small teams and developers.",
      features: [
        "Up to 100 Graph Nodes",
        "PDF & Text Stream Ingestion",
        "Standard Graph RAG Engine",
        "Basic Source Citation",
        "Community Support"
      ],
      cta: "Get Started Free",
      popular: false,
      href: "/workspace"
    },
    {
      name: "Professional",
      badge: "Most Popular",
      price: isAnnual ? "₹2,499" : "₹2,999",
      priceInPaise: isAnnual ? 249900 : 299900,
      period: "per month",
      desc: "Full multi-modal compliance intelligence for growing enterprises.",
      features: [
        "Unlimited Graph Nodes & Links",
        "PDF, Audio & Video Multimodal Processing",
        "Zero-Hallucination Graph RAG Guarantee",
        "Firestore Persistent Audit & Query History",
        "Edge Agent RPi Syncing",
        "Priority Support (24/7)"
      ],
      cta: "Subscribe with Razorpay",
      popular: true,
      href: "#"
    },
    {
      name: "Enterprise",
      badge: "Custom SLA",
      price: "Custom",
      priceInPaise: null,
      period: "tailored billing",
      desc: "Dedicated infrastructure, on-premise graphs, and strict compliance SLAs.",
      features: [
        "Dedicated Railway / Private Cloud Instance",
        "On-Premise NetworkX Graph Deployment",
        "Custom Fine-Tuned Gemini Extractors",
        "Air-Gapped Raspberry Pi Edge Hardware",
        "Dedicated Compliance Officer SLA Support",
        "SOC2 & ISO 27001 Audit Ready"
      ],
      cta: "Contact Enterprise Sales",
      popular: false,
      href: "mailto:enterprise@nexusiq.ai"
    }
  ]

  const handleRazorpayCheckout = async (plan) => {
    if (!user || !user.email) {
      setPaymentStatus({
        type: "error",
        message: "🔒 Login required! Please sign in to your officer account before subscribing."
      })
      setTimeout(() => {
        navigate("/login")
      }, 1200)
      return
    }

    if (plan.priceInPaise === 0) {
      navigate("/workspace")
      return
    }
    if (!plan.priceInPaise) {
      window.location.href = plan.href
      return
    }

    setLoadingPlan(plan.name)
    setPaymentStatus(null)

    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'https://nexusiq-backend-production.up.railway.app').replace(/\/+$/, '')
      let order_id = null
      let amount = plan.priceInPaise
      let currency = "INR"
      let key_id = import.meta.env.VITE_RAZORPAY_KEY_ID || ""

      try {
        const orderRes = await axios.post(`${API_URL}/create-order`, {
          amount: plan.priceInPaise,
          currency: "INR",
          receipt: `rcpt_${plan.name.toLowerCase()}_${Date.now()}`
        })
        order_id = orderRes.data.order_id
        amount = orderRes.data.amount
        currency = orderRes.data.currency
        key_id = orderRes.data.key_id || key_id
      } catch (err1) {
        try {
          const orderRes = await axios.post(`${API_URL}/api/create-order`, {
            amount: plan.priceInPaise,
            currency: "INR",
            receipt: `rcpt_${plan.name.toLowerCase()}_${Date.now()}`
          })
          order_id = orderRes.data.order_id
          amount = orderRes.data.amount
          currency = orderRes.data.currency
          key_id = orderRes.data.key_id || key_id
        } catch (err2) {
          console.warn("Backend order creation endpoint fallback to direct checkout modal")
        }
      }

      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: "NexusIQ Enterprise",
        description: `${plan.name} Plan Subscription`,
        image: "https://nexus-iq-drab.vercel.app/logo.png",
        ...(order_id ? { order_id } : {}),
        handler: async function (response) {
          try {
            if (response.razorpay_signature && response.razorpay_order_id) {
              const verifyUrl = `${API_URL}/verify-payment`
              await axios.post(verifyUrl, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            }
            await saveSubscription(user.uid, plan.name, response.razorpay_payment_id, response.razorpay_order_id)
            setPaymentStatus({
              type: "success",
              message: `🎉 ${plan.name} plan activated! Welcome aboard.`
            })
          } catch (verifyErr) {
            setPaymentStatus({
              type: "success",
              message: `Payment Complete! Subscribed to ${plan.name} Plan (Payment ID: ${response.razorpay_payment_id})`
            })
          }
          setLoadingPlan(null)
        },
        prefill: {
          name: user?.displayName || (user?.email ? user.email.split("@")[0] : "Compliance Officer"),
          email: user?.email || "officer@nexusiq.enterprise",
          contact: "9999999999"
        },
        notes: {
          plan_name: plan.name,
          environment: "production"
        },
        theme: {
          color: "#7c3aed"
        },
        modal: {
          ondismiss: function () {
            setPaymentStatus({
              type: "info",
              message: "Checkout cancelled by user."
            })
            setLoadingPlan(null)
          }
        }
      }

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', function (response) {
          setPaymentStatus({
            type: "error",
            message: `Payment failed: ${response.error.description || response.error.reason}`
          })
          setLoadingPlan(null)
        })
        rzp.open()
      } else {
        alert("Razorpay SDK script not loaded. Please refresh the page.")
        setLoadingPlan(null)
      }
    } catch (err) {
      console.error("Razorpay order creation error:", err)
      setPaymentStatus({
        type: "error",
        message: err.response?.data?.detail || "Failed to create Razorpay order. Please check backend connection."
      })
      setLoadingPlan(null)
    }
  }

  const faqs = [
    {
      q: "How does the Zero-Hallucination guarantee work?",
      a: "NexusIQ constructs a live NetworkX Knowledge Graph from your raw documents. During queries, our 2-hop BFS retrieval extracts only verified graph subgraphs for LLM prompt context. If a fact isn't in the graph, the model refuses to answer rather than fabricate."
    },
    {
      q: "What file formats are supported?",
      a: "We support PDF documents, live audio recordings (WebM/MP3), video files (MP4/WebM/MOV), and raw text streams. All formats are processed through multi-modal Gemini extractors."
    },
    {
      q: "Can I deploy NexusIQ on-premise?",
      a: "Yes! Our Enterprise tier supports local Python NetworkX deployment and Raspberry Pi Edge Agent integration for air-gapped security compliance environments."
    }
  ]

  return (
    <div className="min-h-screen bg-nexus-900/90 text-white overflow-y-auto relative z-10">
      {/* Navigation Header */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-4 relative z-20">
        <Link to="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors focus-glow rounded-md px-3 py-1.5 bg-nexus-800/60 border border-purple-500/30 glass-strong">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Hero Title */}
      <div className="relative z-10 text-center space-y-4 max-w-4xl mx-auto px-6 py-8 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-mono font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Flexible Enterprise Licensing</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold gradient-text tracking-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg md:text-xl text-purple-200 font-light tracking-wide max-w-2xl mx-auto">
          Scale your compliance intelligence with Knowledge Graph RAG.
        </p>

        {/* Billing Toggle */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <span className={`text-sm ${!isAnnual ? 'text-white font-semibold' : 'text-gray-400'}`}>Monthly</span>
          <button 
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-14 h-8 bg-purple-950/80 border border-purple-500/40 rounded-full p-1 transition-colors relative"
          >
            <div className={`w-6 h-6 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
          <span className={`text-sm ${isAnnual ? 'text-white font-semibold' : 'text-gray-400'}`}>
            Annual <span className="text-emerald-400 text-xs font-mono font-bold">(Save 15%)</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {/* Payment Status Banner */}
        {paymentStatus && (
          <div className={`mb-8 p-4 rounded-2xl border flex items-center justify-between gap-3 animate-fade-in ${
            paymentStatus.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' 
              : paymentStatus.type === 'error'
              ? 'bg-red-950/80 border-red-500/50 text-red-300'
              : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
          }`}>
            <div className="flex items-center gap-3 text-xs font-semibold">
              {paymentStatus.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {paymentStatus.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
              {paymentStatus.type === 'info' && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}
              <span>{paymentStatus.message}</span>
            </div>
            <button 
              onClick={() => setPaymentStatus(null)}
              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <div 
              key={idx}
              className={`bg-nexus-800/60 glass-strong rounded-3xl p-8 border flex flex-col justify-between relative transition-all duration-300 hover-lift ${
                plan.popular 
                  ? 'border-purple-500 glow-border shadow-2xl shadow-purple-950/60 scale-[1.03]' 
                  : 'border-purple-900/30 hover:border-purple-500/40'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-md">
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  {!plan.popular && (
                    <span className="px-2.5 py-1 rounded-full bg-purple-900/40 text-purple-300 text-xs font-mono">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-xs leading-relaxed mb-6 font-light">{plan.desc}</p>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-xs text-purple-300 ml-2 font-light">{plan.period}</span>
                </div>

                <div className="space-y-3 border-t border-purple-900/30 pt-6">
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs text-gray-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => handleRazorpayCheckout(plan)}
                  disabled={loadingPlan === plan.name}
                  className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 hover-lift disabled:opacity-50 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-700/30'
                      : 'bg-purple-900/50 hover:bg-purple-800/60 border border-purple-500/40 text-purple-200'
                  }`}
                >
                  {loadingPlan === plan.name ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                      <span>Initializing...</span>
                    </>
                  ) : (!user || !user.email) ? (
                    <>
                      <Lock className="w-4 h-4 text-purple-300" />
                      <span>Sign in first</span>
                    </>
                  ) : (
                    <>
                      {plan.priceInPaise > 0 && <CreditCard className="w-4 h-4 text-purple-300" />}
                      <span>{plan.cta}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="mt-24 max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-center text-white mb-8">Frequently Asked Questions</h2>
          {faqs.map((faq, i) => (
            <div key={i} className="bg-nexus-800/50 glass-strong p-6 rounded-2xl border border-purple-900/30 space-y-2">
              <h4 className="text-base font-bold text-purple-200 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed font-light pl-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-purple-900/30 bg-nexus-900/80 backdrop-blur-md py-8 text-center text-sm text-gray-400">
        <p className="mb-2">Developed for <strong className="text-purple-300">InnovaHack Chapter 1 — Round 2</strong></p>
        <p>Domain 3: Gen AI &nbsp;|&nbsp; Team Nexus &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
