"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp, SellerProfile } from "@/lib/context/AppContext"
import Navbar from "@/components/Navbar"
import { CATEGORIES } from "@/lib/data/categories"
import { SELLER_TYPES } from "@/lib/data/sellerTypes"
import { Save, CheckCircle2, Trash2, User, Zap, ChevronRight, X } from "lucide-react"

export default function SettingsPage() {
  const { user, sellerProfile, saveSellerProfile, logout, savedLeads, isLoggedIn, onboardingComplete, theme, setTheme, searchProvider, setSearchProvider, syncComplete } = useApp()
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradePlan, setUpgradePlan] = useState<"STARTER" | "PRO" | "BUSINESS" | null>(null)

  const [whatISell, setWhatISell] = useState(sellerProfile?.whatISell || "")
  const [pitchTemplate, setPitchTemplate] = useState(sellerProfile?.pitchTemplate || "")
  const [signals, setSignals] = useState(sellerProfile?.hotSignals || {
    noWebsite: false, newlyOpened: false, lowReviews: false,
    noSocialMedia: false, manyEmployees: false, phoneAvailable: true,
    notVerified: false, lowRating: false,
  })

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login")
    } else if (syncComplete && !onboardingComplete) {
      router.replace("/onboarding")
    }
  }, [isLoggedIn, syncComplete, onboardingComplete, router])

  useEffect(() => {
    if (sellerProfile) {
      setWhatISell(sellerProfile.whatISell)
      setPitchTemplate(sellerProfile.pitchTemplate)
      setSignals(sellerProfile.hotSignals)
    }
  }, [sellerProfile])

  const handleSave = () => {
    if (!sellerProfile) return
    saveSellerProfile({
      ...sellerProfile,
      whatISell,
      pitchTemplate,
      hotSignals: signals,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleChangeProfile = () => {
    router.push("/onboarding")
  }

  const PLAN_FEATURES: Record<string, { monthlyLeads: string; savedLeads: string; export: string; color: string; next?: string }> = {
    FREE: { monthlyLeads: "200", savedLeads: "10", export: "No Export", color: "var(--text-muted)", next: "Upgrade to Starter ₹799/mo →" },
    STARTER: { monthlyLeads: "1,500", savedLeads: "100", export: "No Export", color: "var(--cold)", next: "Upgrade to Pro ₹1,999/mo →" },
    PRO: { monthlyLeads: "7,500", savedLeads: "Unlimited", export: "Limited Export (1K/mo)", color: "var(--accent-light)", next: "Upgrade to Business ₹4,999/mo →" },
    BUSINESS: { monthlyLeads: "15,000", savedLeads: "Unlimited", export: "Unlimited Export", color: "var(--warm)" },
  }

  const planInfo = PLAN_FEATURES[user?.plan || "FREE"]

  return (
    <div className="page-wrapper">
      <div className="bg-glow" />
      <Navbar />

      <div className="container" style={{ maxWidth: 860, margin: "0 auto", padding: "24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 24 }}>Settings</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Account Card */}
          <div className="card">
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
              <User size={14} style={{ display: "inline", marginRight: 6 }} />
              Account
            </h2>
            <div className="flex items-center gap-4">
              <div style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "linear-gradient(135deg,var(--accent),var(--cold))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {user?.name?.[0] || "U"}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{user?.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{user?.email}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <span className="tag tag-info" style={{ fontSize: 11 }}>
                    <Zap size={10} /> {user?.plan} Plan
                  </span>
                  <span className="tag">
                    {savedLeads.length} leads saved
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Theme & Display Card */}
          <div className="card animate-scale-in">
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
              🎨 Theme & Appearance
            </h2>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                style={{
                  flex: 1,
                  padding: "16px",
                  borderRadius: 12,
                  background: theme === "dark" ? "rgba(124, 77, 255, 0.12)" : "rgba(255, 255, 255, 0.03)",
                  border: `1px solid ${theme === "dark" ? "rgba(124, 77, 255, 0.5)" : "var(--border)"}`,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 20 }}>🌙</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Dark Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("light")}
                style={{
                  flex: 1,
                  padding: "16px",
                  borderRadius: 12,
                  background: theme === "light" ? "rgba(124, 77, 255, 0.12)" : "rgba(255, 255, 255, 0.03)",
                  border: `1px solid ${theme === "light" ? "rgba(124, 77, 255, 0.5)" : "var(--border)"}`,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 20 }}>☀️</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Light Mode</span>
              </button>
            </div>
          </div>

          {/* Search Provider Selector Card */}
          <div className="card animate-scale-in">
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
              🔍 Search Provider
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
              Select the search engine to query when prospecting local business leads.
            </p>
            <div className="provider-grid">
              <button
                type="button"
                onClick={() => setSearchProvider("osm")}
                style={{
                  padding: "16px",
                  borderRadius: 12,
                  background: searchProvider === "osm" ? "rgba(124, 77, 255, 0.12)" : "rgba(255, 255, 255, 0.03)",
                  border: `1px solid ${searchProvider === "osm" ? "rgba(124, 77, 255, 0.5)" : "var(--border)"}`,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 6,
                  transition: "all 0.2s",
                  textAlign: "left",
                  width: "100%"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                  <span style={{ fontSize: 18 }}>🌐</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>LeadFlow Instant Search (Default)</span>
                  {searchProvider === "osm" && <span className="tag tag-info" style={{ marginLeft: "auto", fontSize: 9, padding: "2px 6px" }}>Active</span>}
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Our proprietary search engine optimized for rapid local business prospecting.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSearchProvider("google")}
                style={{
                  padding: "16px",
                  borderRadius: 12,
                  background: searchProvider === "google" ? "rgba(124, 77, 255, 0.12)" : "rgba(255, 255, 255, 0.03)",
                  border: `1px solid ${searchProvider === "google" ? "rgba(124, 77, 255, 0.5)" : "var(--border)"}`,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 6,
                  transition: "all 0.2s",
                  textAlign: "left",
                  width: "100%"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                  <span style={{ fontSize: 18 }}>📍</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Premium Verified Search</span>
                  {searchProvider === "google" && <span className="tag tag-info" style={{ marginLeft: "auto", fontSize: 9, padding: "2px 6px" }}>Active</span>}
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  An advanced global search layer utilizing premium geographical mapping coordinates.
                </span>
              </button>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="card">
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
              <Zap size={14} style={{ display: "inline", marginRight: 6, color: "var(--accent-light)" }} />
              Subscription
            </h2>
            <div className="settings-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Current Plan</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: planInfo.color }}>{user?.plan}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Monthly Limit</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{planInfo.monthlyLeads} leads/mo · {planInfo.export}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{planInfo.savedLeads} saved leads limit</div>
              </div>
            </div>
            {user?.plan !== "BUSINESS" && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Available Upgrades</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {user?.plan === "FREE" && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setUpgradePlan("STARTER"); setShowUpgradeModal(true); }}>
                      Upgrade to Starter (₹799)
                    </button>
                  )}
                  {(user?.plan === "FREE" || user?.plan === "STARTER") && (
                    <button className="btn btn-primary btn-sm" style={{ background: "linear-gradient(135deg, var(--accent), var(--cold))", border: "none" }} onClick={() => { setUpgradePlan("PRO"); setShowUpgradeModal(true); }}>
                      Upgrade to Pro (₹1,999)
                    </button>
                  )}
                  {(user?.plan === "FREE" || user?.plan === "STARTER" || user?.plan === "PRO") && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setUpgradePlan("BUSINESS"); setShowUpgradeModal(true); }}>
                      Upgrade to Business (₹4,999)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Seller Profile */}
          {sellerProfile && (
            <div className="card">
              <div className="flex items-center justify-between mb-16" style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700 }}>🎯 Seller Profile</h2>
                <button className="btn btn-secondary btn-sm" onClick={handleChangeProfile}>
                  Change Profile Type <ChevronRight size={12} />
                </button>
              </div>

              <div className="settings-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div>
                  <span className="label">Seller Type</span>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{sellerProfile.sellerLabel}</div>
                </div>
                <div>
                  <span className="label">Industry</span>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {CATEGORIES[sellerProfile.industryGroup]?.icon} {CATEGORIES[sellerProfile.industryGroup]?.label}
                  </div>
                </div>
              </div>

              <div className="mb-4" style={{ marginBottom: 16 }}>
                <label className="label">What I Sell</label>
                <textarea
                  className="input"
                  value={whatISell}
                  onChange={e => setWhatISell(e.target.value)}
                  rows={2}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div className="mb-4" style={{ marginBottom: 16 }}>
                <label className="label">Pitch Template</label>
                <textarea
                  className="input"
                  value={pitchTemplate}
                  onChange={e => setPitchTemplate(e.target.value)}
                  rows={3}
                  placeholder="Hi, I noticed your business... (used in pitch suggestions)"
                  style={{ resize: "vertical" }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="label">Hot Lead Signals</label>
                <div className="settings-signals-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { key: "noWebsite", label: "No Website" },
                    { key: "newlyOpened", label: "Newly Opened" },
                    { key: "lowReviews", label: "Low Reviews" },
                    { key: "noSocialMedia", label: "No Social Media" },
                    { key: "manyEmployees", label: "Many Employees" },
                    { key: "phoneAvailable", label: "Phone Available" },
                    { key: "notVerified", label: "Not Google Verified" },
                    { key: "lowRating", label: "Low Rating (<3.5)" },
                  ].map(s => (
                    <label key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px 12px", borderRadius: 8, background: (signals as any)[s.key] ? "rgba(124,77,255,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${(signals as any)[s.key] ? "rgba(124,77,255,0.2)" : "var(--border)"}` }}>
                      <input
                        type="checkbox"
                        checked={(signals as any)[s.key]}
                        onChange={e => setSignals(prev => ({ ...prev, [s.key]: e.target.checked }))}
                      />
                      <span style={{ fontSize: 12 }}>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleSave}>
                {saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
              </button>
            </div>
          )}

          {/* FAQ Card */}
          <div className="card">
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
              🙋 Frequently Asked Questions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                {
                  q: "How do monthly lead limits work?",
                  a: "Your plan's lead limit (e.g. 1,500 for Starter) represents the total number of Google business profiles you can search and fetch in a billing month. Limits reset on the 1st of every month."
                },
                {
                  q: "Can I download my leads to Excel/CSV?",
                  a: "Yes! Exporting to CSV is supported on the Pro and Business plans. Free and Starter users can manage leads within the built-in CRM pipeline and message them directly on WhatsApp."
                },
                {
                  q: "How is the Lead Score calculated?",
                  a: "Leads are scored from 0 to 100 based on 'Hot Signals' matched to your specific offer (e.g. if you sell websites, businesses with no website get +40 points automatically)."
                },
                {
                  q: "How can I upgrade or cancel my plan?",
                  a: "You can upgrade by scanning the UPI QR code in the subscription section above. To downgrade or cancel, simply message our support chat, and your profile will be updated instantly."
                }
              ].map((faq, i) => (
                <details key={i} className="faq-details" style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}>
                  <summary style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "var(--text-primary)",
                    display: "flex",
                    justifyContent: "space-between",
                    outline: "none",
                    listStyle: "none"
                  }}
                  >
                    {faq.q}
                  </summary>
                  <p style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    cursor: "default"
                  }}>
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* Need Help / Support Card */}
          <div className="card">
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
              📞 Need Help & Support
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
              Have questions about your account, payment, custom scrapers, or need technical help? Contact our support team.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <a
                href="https://wa.me/919284306159?text=Hi%20Rahim%2C%20I%20need%20help%20with%20Renvix%20LeadFlow"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{
                  justifyContent: "center",
                  padding: "12px",
                  borderRadius: 10,
                  display: "flex",
                  textDecoration: "none",
                  background: "rgba(37,211,102,0.08)",
                  border: "1px solid rgba(37,211,102,0.2)",
                  color: "#25d366"
                }}
              >
                💬 WhatsApp Support
              </a>
              <a
                href="mailto:support@renvixteach.in?subject=Renvix%20LeadFlow%20Support%20Request"
                className="btn btn-secondary"
                style={{
                  justifyContent: "center",
                  padding: "12px",
                  borderRadius: 10,
                  display: "flex",
                  textDecoration: "none"
                }}
              >
                ✉️ Email Support
              </a>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card" style={{ borderColor: "rgba(255,71,87,0.2)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--hot)" }}>
              ⚠️ Danger Zone
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Sign Out</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>You'll need to log in again to access your leads</div>
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => { logout(); router.push("/login") }}
              >
                Sign Out
              </button>
            </div>
          </div>
          
          {/* Footer branding */}
          <div style={{ textAlign: "center", marginTop: 32, paddingBottom: 16 }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Renvix LeadFlow · A product of <a href="https://renvixteach.in" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-light)", textDecoration: "underline" }}>Renvix Technologies</a>
            </p>
          </div>
          
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && upgradePlan && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div className="card" style={{
            maxWidth: 440,
            width: "100%",
            padding: 32,
            position: "relative",
            background: "var(--bg-elevated)",
            border: "1px solid rgba(124, 77, 255, 0.25)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 50px rgba(124,77,255,0.1)",
            textAlign: "center",
            borderRadius: 16,
          }}>
            {/* Close button */}
            <button
              onClick={() => { setShowUpgradeModal(false); setUpgradePlan(null); }}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <X size={18} />
            </button>

            {/* Title */}
            <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>
              Upgrade to {upgradePlan === "STARTER" ? "Starter" : (upgradePlan === "PRO" ? "Pro" : "Business")}
            </h3>
            <div style={{
              fontSize: 26,
              fontWeight: 900,
              color: upgradePlan === "STARTER" ? "var(--cold)" : (upgradePlan === "PRO" ? "var(--accent-light)" : "var(--warm)"),
              marginBottom: 16
            }}>
              {upgradePlan === "STARTER" ? "₹799 / month" : (upgradePlan === "PRO" ? "₹1,999 / month" : "₹4,999 / month")}
            </div>

            {/* Plan Details Checklist */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "16px",
              marginBottom: 20,
              textAlign: "left"
            }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                💎 Plan Inclusions & Limits
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {upgradePlan === "STARTER" && [
                  "🚀 1,500 Search Leads/Month (Prospect local businesses)",
                  "📁 100 Saved Leads (Store in your active CRM)",
                  "🔄 Full CRM Status Pipeline (New → Contacted → Converted)",
                  "💬 WhatsApp Direct Integration (Message leads directly)",
                  "📱 Offline CRM Access (View saved leads offline)",
                  "❌ No raw CSV/Excel export capability on this tier",
                  "📞 Standard WhatsApp support (within 24 hours)",
                ].map((feat, idx) => (
                  <li key={idx} style={{ fontSize: 12, display: "flex", alignItems: "flex-start", gap: 6, color: feat.startsWith("❌") ? "var(--text-muted)" : "var(--text-secondary)" }}>
                    <span style={{ flexShrink: 0 }}>{feat.startsWith("❌") ? "❌" : "✓"}</span>
                    <span>{feat.substring(2)}</span>
                  </li>
                ))}
                {upgradePlan === "PRO" && [
                  "🚀 7,500 Search Leads/Month (Prospect local businesses)",
                  "📁 Unlimited Saved Leads (Store in your active CRM)",
                  "📥 Export up to 1,000 leads/mo to Excel/CSV",
                  "👤 3 Custom Seller Profiles (Switch presets instantly)",
                  "📝 WhatsApp Message Templates (Pre-fill pitches)",
                  "🔄 Full CRM Status Pipeline (New → Contacted → Converted)",
                  "⭐ Priority WhatsApp Support (Response under 1 hour)",
                ].map((feat, idx) => (
                  <li key={idx} style={{ fontSize: 12, display: "flex", alignItems: "flex-start", gap: 6, color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--success)", flexShrink: 0 }}>✓</span>
                    <span>{feat.substring(2)}</span>
                  </li>
                ))}
                {upgradePlan === "BUSINESS" && [
                  "🚀 15,000 Search Leads/Month (Prospect local businesses)",
                  "📁 Unlimited Saved Leads (Store in your active CRM)",
                  "📥 Unlimited CSV/Excel Exports (No download cap)",
                  "🔑 API Access (Sync leads to external CRMs/Zapier)",
                  "👥 3 Team Member Slots (Collaborative pipeline)",
                  "🎛️ Custom Scoring Weights via UI (Tune signals)",
                  "👑 Dedicated Support Manager (Instantly active)",
                ].map((feat, idx) => (
                  <li key={idx} style={{ fontSize: 12, display: "flex", alignItems: "flex-start", gap: 6, color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--warm)", flexShrink: 0 }}>✓</span>
                    <span>{feat.substring(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* QR Code Container */}
            <div style={{
              background: "#ffffff",
              padding: 16,
              borderRadius: 12,
              display: "inline-block",
              marginBottom: 16,
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)"
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `upi://pay?pa=srahim786@ybl&pn=Rahim%20Muktar%20Shaikh&am=${upgradePlan === "STARTER" ? 799 : (upgradePlan === "PRO" ? 1999 : 4999)}&cu=INR&tn=LeadFlow%20${upgradePlan}%20Upgrade`
                )}`}
                alt="Payment QR Code"
                style={{ width: 200, height: 200, display: "block" }}
              />
            </div>

            {/* Instruction */}
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12 }}>
              Scan the QR code with GPay, PhonePe, Paytm, or BHIM to pay.
            </p>

            {/* Legal payee name disclaimer */}
            <div style={{
              fontSize: 11,
              color: "var(--text-secondary)",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 12px",
              marginBottom: 20,
              textAlign: "left"
            }}>
              💡 <strong>Note:</strong> Payee name will appear as <strong>Rahim Muktar Shaikh</strong> on your payment app.
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a
                href={`https://wa.me/919284306159?text=${encodeURIComponent(
                  `Hi Rahim, I have paid for the ${upgradePlan === "STARTER" ? "Starter (₹799)" : (upgradePlan === "PRO" ? "Pro (₹1,999)" : "Business (₹4,999)")} plan of Renvix LeadFlow. My registered email is: ${user?.email || ""}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ justifyContent: "center", padding: "12px", borderRadius: 10, display: "flex", textDecoration: "none" }}
                onClick={() => { setShowUpgradeModal(false); setUpgradePlan(null); }}
              >
                ✅ Sent Payment Screenshot
              </a>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: "center", padding: "12px", borderRadius: 10 }}
                onClick={() => { setShowUpgradeModal(false); setUpgradePlan(null); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
