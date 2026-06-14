"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/lib/context/AppContext"

export default function LandingPage() {
  const { isLoggedIn, onboardingComplete } = useApp()
  const router = useRouter()

  // Auto-redirect logged-in users
  useEffect(() => {
    if (isLoggedIn && onboardingComplete) router.push("/search")
    else if (isLoggedIn) router.push("/onboarding")
  }, [isLoggedIn, onboardingComplete, router])

  const features = [
    { icon: "🎯", title: "Context-Aware Scoring", desc: "Scores leads based on YOUR specific seller profile — not a generic formula" },
    { icon: "📞", title: "4-Layer Phone Extraction", desc: "Google Places → Website scraping → JustDial → Custom Search" },
    { icon: "⚡", title: "Results in Under 5 Seconds", desc: "Search any city, any category — 20+ leads with full contact details instantly" },
    { icon: "🤖", title: "AI Pitch Suggestions", desc: "Every lead gets a personalized pitch crafted for your specific offer" },
    { icon: "📊", title: "CRM Pipeline Built-In", desc: "Track New → Contacted → Interested → Converted without leaving the app" },
    { icon: "📤", title: "One-Click Export", desc: "Export to CSV or push directly to Google Sheets with color-coded priority rows" },
  ]

  const industries = [
    { icon: "💻", label: "Digital & Tech" },
    { icon: "💰", label: "Financial" },
    { icon: "🏠", label: "Real Estate" },
    { icon: "🏥", label: "Healthcare" },
    { icon: "🎓", label: "Education" },
    { icon: "🍽️", label: "Food & Hospitality" },
    { icon: "🏋️", label: "Fitness & Wellness" },
    { icon: "⚙️", label: "Industrial" },
    { icon: "📢", label: "Marketing" },
    { icon: "🚗", label: "Transport" },
  ]

  const stats = [
    { value: "63M+", label: "Indian SMBs targeted" },
    { value: "50+", label: "Seller types supported" },
    { value: "10", label: "Industry verticals" },
    { value: "4-Layer", label: "Contact extraction" },
  ]

  return (
    <div className="page-wrapper">
      <div className="bg-glow" />
      <div className="bg-glow-2" />

      {/* Navbar */}
      <nav className="navbar">
        <div 
          className="navbar-logo"
          style={{ cursor: "pointer" }}
          onClick={() => router.push("/")}
        >
          <img
            src="/leadgenpro_logo.png"
            alt="Renvix LeadFlow Logo"
            style={{
              width: "32px",
              height: "32px",
              objectFit: "contain",
              borderRadius: "8px",
            }}
          />
          <span>
            <span style={{ color: "var(--text-primary)" }}>Renvix</span>
            <span style={{ color: "var(--accent-light)" }}> LeadFlow</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/login" className="btn btn-secondary btn-sm">Sign In</a>
          <a href="/login" className="btn btn-primary btn-sm">Get Started Free →</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "100px 24px 80px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {/* Tag */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,77,255,0.1)", border: "1px solid rgba(124,77,255,0.25)", borderRadius: 99, padding: "6px 16px", marginBottom: 28 }}>
            <span style={{ fontSize: 11, color: "var(--accent-light)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              🇮🇳 Built for India's 63M SMBs
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 24 }}>
            Generate Leads. Manage Customers.
            <br />
            <span className="text-gradient">Close More Deals.</span>
          </h1>

          <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 40px" }}>
            Renvix LeadFlow is the universal B2B prospecting and customer pipeline tool for every seller — 
            developers, insurance agents, loan DSAs, equipment suppliers, CAs, and 50 more types. Search, score, pitch, export.
          </p>

          <div className="flex justify-center gap-3" style={{ flexWrap: "wrap" }}>
            <a href="/login" className="btn btn-primary btn-lg">
              🚀 Start Finding Leads — It's Free
            </a>
            <a href="#features" className="btn btn-secondary btn-lg">
              See How It Works ↓
            </a>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 60, flexWrap: "wrap" }}>
            {stats.map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", color: "var(--text-primary)" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mock Lead Card Preview */}
        <div style={{ marginTop: 64, display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <MockLeadPreview
            priority="HOT"
            name="Iron Forge Gym"
            category="Gym"
            phone="9701234567"
            score={91}
            tag="🆕 Newly Opened"
            pitch="Reach out NOW before they finalize equipment vendor"
          />
          <MockLeadPreview
            priority="HOT"
            name="SkinCure Dermatology"
            category="Skin Clinic"
            phone="9849512345"
            score={88}
            tag="No Website"
            pitch="New clinic — ideal for website + social media package"
          />
          <MockLeadPreview
            priority="WARM"
            name="Ace IIT Coaching"
            category="Coaching Center"
            phone="9000123456"
            score={65}
            tag="No Website"
            pitch="Strong ratings but no website — high intent"
          />
        </div>
      </section>

      {/* Industries */}
      <section style={{ padding: "60px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
            Works for all 10 industries
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            {industries.map(ind => (
              <div key={ind.label} className="card" style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{ind.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{ind.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: "80px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>
              Everything a <span className="text-gradient">B2B Seller Needs</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>Not just a directory — an intelligent prospecting machine</p>
          </div>

          <div className="grid-3" style={{ gap: 20 }}>
            {features.map((f, i) => (
              <div key={i} className="card card-hover" style={{ padding: 24 }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: "80px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>
            Simple, <span className="text-gradient">Transparent Pricing</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 48 }}>Start free. Upgrade when you're ready to scale.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, maxWidth: 900, margin: "0 auto" }}>
            <PricingCard plan="Free" price="₹0" monthlyLeads="200 leads/mo" features={["10 saved leads", "Basic search", "No Excel export"]} color="var(--text-muted)" />
            <PricingCard plan="Starter" price="₹799/mo" monthlyLeads="1,500 leads/mo" features={["100 saved leads", "CRM & WhatsApp Direct", "No Excel export"]} color="var(--cold)" />
            <PricingCard plan="Pro" price="₹1,999/mo" monthlyLeads="7,500 leads/mo" features={["Unlimited saved leads", "CRM & WhatsApp Direct", "Export up to 1,000 leads/mo"]} color="var(--accent-light)" featured />
            <PricingCard plan="Business" price="₹4,999/mo" monthlyLeads="15,000 leads/mo" features={["Unlimited saved leads", "Unlimited CSV export", "API access"]} color="var(--warm)" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px 100px", position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>
            Start Finding Leads <span className="text-gradient">Today</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: 16 }}>
            Join thousands of Indian B2B sellers who use Renvix LeadFlow to fill their pipeline every day.
          </p>
          <a href="/login" className="btn btn-primary btn-lg">
            🚀 Get Started — Free Forever Plan Available
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          © 2026 Renvix LeadFlow. A product of <a href="https://renvixteach.in" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-light)", textDecoration: "underline" }}>Renvix Technologies</a> · Made for India's B2B sellers 🇮🇳
        </p>
      </footer>
    </div>
  )
}

function MockLeadPreview({ priority, name, category, phone, score, tag, pitch }: {
  priority: string; name: string; category: string; phone: string; score: number; tag: string; pitch: string
}) {
  const col = priority === "HOT" ? "var(--hot)" : "var(--warm)"
  return (
    <div style={{
      background: "var(--bg-card)",
      border: `1px solid rgba(255,255,255,0.08)`,
      borderLeft: `3px solid ${col}`,
      borderRadius: 16,
      padding: "16px 18px",
      width: 280,
      textAlign: "left",
      animation: "fade-in-up 0.5s ease forwards",
    }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ fontSize: 10, fontWeight: 700, background: col + "22", color: col, border: `1px solid ${col}44`, borderRadius: 99, padding: "2px 8px" }}>
          {priority === "HOT" ? "🔥 HOT" : "⭐ WARM"}
        </span>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>#{score}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8 }}>{category} · {tag}</div>
      <div style={{ fontSize: 12, color: "var(--success)", fontFamily: "monospace", marginBottom: 8 }}>📞 {phone}</div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", fontStyle: "italic", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
        💡 {pitch}
      </div>
    </div>
  )
}

function PricingCard({ plan, price, monthlyLeads, features, color, featured }: {
  plan: string; price: string; monthlyLeads: string; features: string[]; color: string; featured?: boolean
}) {
  return (
    <div style={{
      background: featured ? "rgba(124,77,255,0.08)" : "var(--bg-card)",
      border: `1px solid ${featured ? "rgba(124,77,255,0.3)" : "var(--border)"}`,
      borderRadius: 16,
      padding: "24px",
      position: "relative",
      textAlign: "left",
    }}>
      {featured && (
        <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 12px", borderRadius: 99 }}>
          MOST POPULAR
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{plan}</div>
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 8 }}>{price}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-light)", marginBottom: 16 }}>{monthlyLeads}</div>
      {features.map((f, i) => (
        <div key={i} style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>✓ {f}</div>
      ))}
      <div style={{ marginTop: 20 }}>
        <a href="/login" className={`btn ${featured ? "btn-primary" : "btn-secondary"} w-full`} style={{ justifyContent: "center" }}>
          Get Started
        </a>
      </div>
    </div>
  )
}
