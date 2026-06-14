"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp, SellerProfile } from "@/lib/context/AppContext"
import Navbar from "@/components/Navbar"
import { CATEGORIES } from "@/lib/data/categories"
import { SELLER_TYPES } from "@/lib/data/sellerTypes"
import { Save, CheckCircle2, Trash2, User, Zap, ChevronRight, X } from "lucide-react"

export default function SettingsPage() {
  const { user, sellerProfile, saveSellerProfile, logout, savedLeads, isLoggedIn, onboardingComplete, theme, setTheme, syncComplete } = useApp()
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

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
            {planInfo.next && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowUpgradeModal(true)}>
                <Zap size={13} /> {planInfo.next}
              </button>
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
      {showUpgradeModal && (
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
              onClick={() => setShowUpgradeModal(false)}
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

            {/* Icon */}
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(124,77,255,0.2), rgba(78,205,196,0.2))",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              color: "var(--accent-light)",
            }}>
              <Zap size={28} />
            </div>

            {/* Title & Desc */}
            <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>
              Upgrade to Premium
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
              Premium billing integrations are coming soon! To upgrade your account limits, request customized solutions, or get early access, get in touch with our team.
            </p>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a
                href="https://renvixteach.in"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ justifyContent: "center", padding: "12px", borderRadius: 10, display: "flex", textDecoration: "none" }}
                onClick={() => setShowUpgradeModal(false)}
              >
                Get In Touch at renvixteach.in
              </a>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: "center", padding: "12px", borderRadius: 10 }}
                onClick={() => setShowUpgradeModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
