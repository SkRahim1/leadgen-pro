"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp, SellerProfile } from "@/lib/context/AppContext"
import { CATEGORIES } from "@/lib/data/categories"
import { SELLER_TYPES } from "@/lib/data/sellerTypes"
import { ArrowRight, ArrowLeft, Check, MapPin } from "lucide-react"

const STEPS = ["Industry", "Seller Type", "Your Details", "Hot Signals", "Done"]

// Popular Indian cities for quick selection
const POPULAR_CITIES = [
  "Hyderabad", "Bangalore", "Mumbai", "Delhi", "Chennai",
  "Pune", "Ahmedabad", "Kolkata", "Jaipur", "Lucknow",
  "Surat", "Nagpur", "Coimbatore", "Bhopal", "Indore",
]

export default function OnboardingPage() {
  const { user, saveSellerProfile, isLoggedIn } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login")
  }, [isLoggedIn, router])

  const [step, setStep] = useState(0)

  const [selectedIndustry, setSelectedIndustry] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [whatISell, setWhatISell] = useState("")
  const [pitchTemplate, setPitchTemplate] = useState("")
  const [targetCity, setTargetCity] = useState("")
  const [cityInput, setCityInput] = useState("")
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [signals, setSignals] = useState({
    noWebsite: false,
    newlyOpened: false,
    lowReviews: false,
    noSocialMedia: false,
    manyEmployees: false,
    phoneAvailable: true,
    notVerified: false,
    lowRating: false,
  })

  const industries = Object.entries(CATEGORIES).map(([key, val]) => ({ key, ...val }))
  const sellerTypesForIndustry = selectedIndustry ? (SELLER_TYPES[selectedIndustry] || []) : []
  const selectedTypeData = sellerTypesForIndustry.find(t => t.key === selectedType)

  const selectSellerType = (key: string) => {
    const typeData = sellerTypesForIndustry.find(t => t.key === key)
    if (typeData) {
      setSelectedType(key)
      setWhatISell(typeData.whatISell)
      setSignals(typeData.hotSignals)
      setPitchTemplate(typeData.pitchTemplate)
    }
  }

  const filteredCities = POPULAR_CITIES.filter(c =>
    c.toLowerCase().includes(cityInput.toLowerCase()) && cityInput.length > 0
  )

  const selectCity = (city: string) => {
    setTargetCity(city)
    setCityInput(city)
    setShowCitySuggestions(false)
  }

  const handleFinish = () => {
    if (!selectedIndustry || !selectedType) return

    const profile: SellerProfile = {
      sellerType: selectedType,
      sellerLabel: selectedTypeData?.label || selectedType,
      industryGroup: selectedIndustry,
      whatISell,
      targetTypes: selectedTypeData?.targetTypes || [],
      targetCity: targetCity || "Hyderabad",
      searchExamples: selectedTypeData?.searchExamples || [],
      hotSignals: signals,
      pitchTemplate,
    }

    saveSellerProfile(profile)
    router.push("/search")
  }

  const canNext = () => {
    if (step === 0) return !!selectedIndustry
    if (step === 1) return !!selectedType
    if (step === 2) return !!whatISell.trim() && !!(targetCity || cityInput.trim())
    return true
  }

  return (
    <div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative" }}>
      <div className="bg-glow" />

      <div style={{ width: "100%", maxWidth: 700, position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="logo-icon" style={{ width: 44, height: 44, borderRadius: 10, fontSize: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#7c4dff,#4ecdc4)", marginBottom: 16 }}>⚡</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6 }}>
            Set Up Your Seller Profile
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            This shapes your lead scoring, pitch suggestions, and auto-search — takes 60 seconds.
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 36 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 3, borderRadius: 2, background: i <= step ? "var(--accent)" : "var(--border)", transition: "background 0.3s ease" }} />
              <div style={{ fontSize: 10, color: i <= step ? "var(--accent-light)" : "var(--text-muted)", marginTop: 6, textAlign: "center", fontWeight: 600 }}>
                {s}
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="card animate-scale-in onboarding-card-wrapper" style={{ minHeight: 380, padding: 32 }} key={step}>

          {/* Step 0: Industry */}
          {step === 0 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Which industry are you in?</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>Select the category that best describes what you sell.</p>
              <div className="onboarding-industry-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                {industries.map(ind => (
                  <button
                    key={ind.key}
                    onClick={() => { setSelectedIndustry(ind.key); setSelectedType("") }}
                    style={{
                      background: selectedIndustry === ind.key ? "rgba(124,77,255,0.12)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${selectedIndustry === ind.key ? "rgba(124,77,255,0.5)" : "var(--border)"}`,
                      borderRadius: 12,
                      padding: "14px 16px",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      transition: "all 0.2s ease",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{ind.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.label}</span>
                    {selectedIndustry === ind.key && <Check size={14} style={{ color: "var(--accent-light)", marginLeft: "auto" }} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Seller Type */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>What type of seller are you?</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
                Your scoring weights, pitch templates and auto-search results will be personalized for you.
              </p>
              {sellerTypesForIndustry.length === 0 ? (
                <div className="empty-state">
                  <p style={{ color: "var(--text-muted)" }}>No seller types found for this industry. Please go back.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {sellerTypesForIndustry.map(type => (
                    <button
                      key={type.key}
                      onClick={() => selectSellerType(type.key)}
                      style={{
                        background: selectedType === type.key ? "rgba(124,77,255,0.12)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${selectedType === type.key ? "rgba(124,77,255,0.5)" : "var(--border)"}`,
                        borderRadius: 12,
                        padding: "16px 18px",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 12,
                        transition: "all 0.2s ease",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        {/* Icon from sellerTypes */}
                        <span style={{ fontSize: 28, lineHeight: 1 }}>{type.icon}</span>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{type.label}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{type.description}</div>
                          {/* Search examples preview */}
                          {type.searchExamples?.length > 0 && (
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {type.searchExamples.slice(0, 2).map(ex => (
                                <span key={ex} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "rgba(124,77,255,0.08)", color: "var(--accent-light)", border: "1px solid rgba(124,77,255,0.2)" }}>
                                  "{ex}"
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedType === type.key && <Check size={16} style={{ color: "var(--accent-light)", flexShrink: 0, marginTop: 2 }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: What You Sell + City */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Your details</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
                This personalizes your pitch suggestions and auto-fills your lead searches.
              </p>

              {/* City Picker — most important */}
              <div style={{ marginBottom: 20 }}>
                <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={12} style={{ color: "var(--accent-light)" }} />
                  Your Primary City <span style={{ color: "var(--hot)" }}>*</span>
                </label>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                  We'll auto-search leads in this city when you open the search page.
                </p>
                <div style={{ position: "relative" }}>
                  <input
                    className="input"
                    placeholder="Type your city e.g. Hyderabad, Mumbai..."
                    value={cityInput}
                    onChange={e => {
                      setCityInput(e.target.value)
                      setTargetCity(e.target.value)
                      setShowCitySuggestions(true)
                    }}
                    onFocus={() => setShowCitySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
                    autoComplete="off"
                  />
                  {showCitySuggestions && filteredCities.length > 0 && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      zIndex: 100,
                      marginTop: 4,
                      overflow: "hidden",
                    }}>
                      {filteredCities.map(city => (
                        <button
                          key={city}
                          onMouseDown={() => selectCity(city)}
                          style={{
                            width: "100%",
                            padding: "10px 16px",
                            background: "transparent",
                            border: "none",
                            color: "var(--text-primary)",
                            fontSize: 13,
                            cursor: "pointer",
                            textAlign: "left",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,77,255,0.08)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <MapPin size={12} style={{ color: "var(--text-muted)" }} />
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Quick city chips */}
                {!targetCity && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {POPULAR_CITIES.slice(0, 6).map(city => (
                      <button
                        key={city}
                        onClick={() => selectCity(city)}
                        style={{
                          padding: "4px 12px",
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 500,
                          border: "1px solid var(--border)",
                          background: "rgba(255,255,255,0.04)",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
                {targetCity && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }} />
                    <span style={{ fontSize: 12, color: "var(--success)" }}>Searching leads in {targetCity}</span>
                  </div>
                )}
              </div>

              {/* What You Sell */}
              <label className="label">What I sell <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "none" }}>(edit to customize your pitch)</span></label>
              <textarea
                className="input"
                value={whatISell}
                onChange={e => setWhatISell(e.target.value)}
                rows={3}
                placeholder="e.g. Professional websites, mobile apps, and SEO services for small businesses"
                style={{ resize: "vertical" }}
              />

              {/* Target types preview */}
              {selectedTypeData?.targetTypes?.length && (
                <div style={{ marginTop: 16 }}>
                  <label className="label">Businesses I target</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {selectedTypeData.targetTypes.map(t => (
                      <span key={t} className="tag tag-info">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Hot Signals */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>What signals tell you a lead is HOT?</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
                Pre-configured for <strong style={{ color: "var(--accent-light)" }}>{selectedTypeData?.label}</strong>. Toggle to customize — these directly affect your lead scores.
              </p>
              <div className="onboarding-signals-list" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { key: "noWebsite",      label: "No Website",            desc: "Business has no website — needs your services", points: "+40pts for developers" },
                  { key: "newlyOpened",    label: "Newly Opened",          desc: "Listed in the last 6 months — high purchase intent", points: "+35pts for CAs, insurance" },
                  { key: "lowReviews",     label: "Low Review Count",      desc: "Fewer than 20 Google reviews — new/small business", points: "+20pts most types" },
                  { key: "noSocialMedia",  label: "No Social Media",       desc: "No Instagram / Facebook found online", points: "+30pts for agencies" },
                  { key: "manyEmployees",  label: "Many Employees",        desc: "Growing business with 20+ staff", points: "+30pts for insurance, loans" },
                  { key: "phoneAvailable", label: "Phone Number Found",    desc: "Direct contact available — can reach immediately", points: "+20pts most types" },
                  { key: "notVerified",    label: "Not Google Verified",   desc: "No Google verification badge — may need compliance help", points: "+15pts for CAs" },
                  { key: "lowRating",      label: "Low Rating (< 3.5 ⭐)", desc: "Unhappy with current state — open to new solutions", points: "+20pts for agencies" },
                ].map(signal => (
                  <div
                    key={signal.key}
                    onClick={() => setSignals(prev => ({ ...prev, [signal.key]: !(prev as any)[signal.key] }))}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: (signals as any)[signal.key] ? "rgba(124,77,255,0.07)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${(signals as any)[signal.key] ? "rgba(124,77,255,0.25)" : "var(--border)"}`,
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{signal.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{signal.desc}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      {(signals as any)[signal.key] && (
                        <span style={{ fontSize: 10, color: "var(--accent-light)", background: "rgba(124,77,255,0.1)", padding: "2px 8px", borderRadius: 99 }}>
                          {signal.points}
                        </span>
                      )}
                      <label className="toggle" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={(signals as any)[signal.key]}
                          onChange={e => setSignals(prev => ({ ...prev, [signal.key]: e.target.checked }))}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Profile ready!</h2>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 28, maxWidth: 440, margin: "0 auto 28px" }}>
                Leads will be automatically scored and fetched for your profile as{" "}
                <strong style={{ color: "var(--accent-light)" }}>{selectedTypeData?.label}</strong>.
              </p>

              {/* Summary card */}
              <div className="card" style={{ textAlign: "left", marginBottom: 24, maxWidth: 440, margin: "0 auto 24px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Your profile summary</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <ProfileRow label="Seller Type" value={`${selectedTypeData?.icon || ""} ${selectedTypeData?.label || ""}`} />
                  <ProfileRow label="Industry" value={CATEGORIES[selectedIndustry]?.label || ""} />
                  <ProfileRow label="City" value={targetCity || "Hyderabad"} highlight />
                  <ProfileRow label="Hot Signals" value={Object.entries(signals).filter(([, v]) => v).length + " active"} />
                </div>

                {/* Auto-search preview */}
                {selectedTypeData?.searchExamples?.length && (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                      🔍 Auto-searches when you open the app
                    </div>
                    {selectedTypeData.searchExamples.slice(0, 3).map(ex => (
                      <div key={ex} style={{ fontSize: 12, color: "var(--accent-light)", marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "var(--text-muted)" }}>→</span>
                        {/* Replace city name in example with user's city */}
                        {ex.replace(/Banjara Hills|Hyderabad|Pune|Bangalore|Rajasthan/gi, targetCity || "your city")}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className="btn btn-primary btn-lg" onClick={handleFinish}>
                🔍 Find My Leads <ArrowRight size={16} />
              </button>
            </div>
          )}

        </div>

        {/* Navigation */}
        <div className="flex justify-between" style={{ marginTop: 20 }}>
          <button
            className="btn btn-secondary"
            onClick={() => setStep(prev => prev - 1)}
            disabled={step === 0}
            style={{ opacity: step === 0 ? 0 : 1 }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          {step < 4 && (
            <button
              className="btn btn-primary"
              onClick={() => setStep(prev => prev + 1)}
              disabled={!canNext()}
              style={{ opacity: canNext() ? 1 : 0.5 }}
            >
              {step === 3 ? "Finish Setup" : "Next"} <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ProfileRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between" style={{ alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 13, color: highlight ? "var(--accent-light)" : "var(--text-primary)", fontWeight: 600, textAlign: "right", maxWidth: "60%", display: "flex", alignItems: "center", gap: 4 }}>
        {highlight && <MapPin size={11} style={{ color: "var(--accent-light)" }} />}
        {value}
      </span>
    </div>
  )
}
