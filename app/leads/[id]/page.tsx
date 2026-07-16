"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApp } from "@/lib/context/AppContext"
import { getScoredBusiness } from "@/lib/mock/data"
import Navbar from "@/components/Navbar"
import { ScoredLead } from "@/types/lead.types"
import {
  MapPin, Phone, Globe, Star, Bookmark, BookmarkCheck,
  MessageSquare, ArrowLeft, TrendingUp, CheckCircle2, XCircle,
  ChevronDown, ExternalLink, Copy, Share2, Loader2
} from "lucide-react"

const STATUS_OPTIONS = [
  { value: "NEW", label: "New", icon: "🆕" },
  { value: "CONTACTED", label: "Contacted", icon: "📞" },
  { value: "INTERESTED", label: "Interested", icon: "⭐" },
  { value: "CONVERTED", label: "Converted ✅", icon: "✅" },
  { value: "NOT_INTERESTED", label: "Not Interested", icon: "❌" },
]

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { savedLeads, sellerProfile, saveLead, removeLead, updateLeadStatus, updateLeadNotes, isLeadSaved, isLoggedIn, searchProvider } = useApp()
  const placeId = params.id as string

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login")
  }, [isLoggedIn, router])

  const [lead, setLead] = useState<ScoredLead | null>(null)
  const [notes, setNotes] = useState("")
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const savedLead = savedLeads.find(l => l.placeId === placeId)
  const saved = isLeadSaved(placeId)
  const currentStatus = savedLead?.status || "NEW"

  useEffect(() => {
    // Try saved leads first (already scored)
    const fromSaved = savedLeads.find(l => l.placeId === placeId)
    if (fromSaved) {
      setLead(fromSaved)
      setNotes(fromSaved.notes || "")
      setLoading(false)
      return
    }

    let active = true
    const fetchLead = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/leads/${placeId}?sellerType=${sellerProfile?.sellerType || "other"}&searchProvider=${searchProvider || "osm"}`)
        if (!res.ok) throw new Error("Failed to fetch lead")
        const data = await res.json()
        if (active && data.lead) {
          setLead(data.lead)
          setNotes("")
        }
      } catch (err) {
        console.error(err)
        // Fall back to getScoredBusiness if API fails or is not available
        const scored = getScoredBusiness(placeId, sellerProfile?.sellerType || "other")
        if (active && scored) {
          setLead(scored)
          setNotes("")
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchLead()

    return () => {
      active = false
    }
  }, [placeId, savedLeads, sellerProfile])

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: 400 }}>
          <Loader2 className="animate-spin" style={{ color: "var(--accent-light)" }} size={40} />
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="empty-state" style={{ padding: 80 }}>
          <div className="empty-state-icon">🔍</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Lead not found</h3>
          <button className="btn btn-secondary" onClick={() => router.push("/search")}>
            <ArrowLeft size={14} /> Back to Search
          </button>
        </div>
      </div>
    )
  }

  const priorityColor = lead.priority === "HOT" ? "var(--hot)" : lead.priority === "WARM" ? "var(--warm)" : "var(--cold)"

  const handleSave = () => {
    if (saved) {
      removeLead(lead.placeId)
    } else {
      saveLead(lead)
    }
  }

  const handleStatusChange = (status: string) => {
    if (saved) {
      updateLeadStatus(placeId, status as any)
    } else {
      saveLead(lead)
      setTimeout(() => updateLeadStatus(placeId, status as any), 50)
    }
  }

  const handleNotesChange = (val: string) => {
    setNotes(val)
    if (saved) {
      updateLeadNotes(placeId, val)
    }
  }

  const handleCopyPhone = () => {
    if (lead.phone) {
      navigator.clipboard.writeText(lead.phone)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const cleanPhoneForWA = (phone: string) => {
    let digits = phone.replace(/\D/g, "")
    if (digits.startsWith("91") && digits.length === 12) return digits
    if (digits.startsWith("0")) digits = digits.substring(1)
    return `91${digits}`
  }

  const whatsappUrl = lead.phone
    ? `https://wa.me/${cleanPhoneForWA(lead.phone)}?text=${encodeURIComponent(lead.pitch)}`
    : null

  return (
    <div className="page-wrapper">
      <div className="bg-glow" />
      <Navbar />

      <div className="container" style={{ maxWidth: 1000, margin: "0 auto", padding: "24px" }}>
        {/* Back */}
        <button className="btn btn-secondary btn-sm" onClick={() => router.back()} style={{ marginBottom: 20 }}>
          <ArrowLeft size={13} /> Back
        </button>

        <div className="lead-details-layout" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "flex-start" }}>

          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Header Card */}
            <div className="card" style={{
              borderLeft: `4px solid ${priorityColor}`,
              position: "relative",
            }}>
              <div className="flex items-center justify-between mb-4">
                <PriorityBadge priority={lead.priority} score={lead.score} />
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleSave}
                  style={{
                    color: saved ? "var(--accent-light)" : "var(--text-muted)",
                    borderColor: saved ? "var(--accent)" : "var(--border)",
                    background: saved ? "rgba(124,77,255,0.1)" : undefined,
                  }}
                >
                  {saved ? <><BookmarkCheck size={13} /> Saved</> : <><Bookmark size={13} /> Save Lead</>}
                </button>
              </div>

              <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>
                {lead.name}
              </h1>
              <div className="flex items-center gap-2 mb-4">
                <span className="tag">{lead.category}</span>
                {lead.isNewlyOpened && <span className="tag tag-info">🆕 Newly Opened</span>}
                {!lead.hasWebsite && <span className="tag tag-error">No Website</span>}
                {lead.googleVerified && <span className="tag tag-success">✓ Google Verified</span>}
              </div>

              {/* Score Bar */}
              <div style={{ marginBottom: 16 }}>
                <div className="flex justify-between" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Lead Score</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: priorityColor }}>{lead.score}/100</span>
                </div>
                <div className="score-bar" style={{ height: 6 }}>
                  <div
                    className={`score-bar-fill ${lead.priority.toLowerCase()}`}
                    style={{ width: `${lead.score}%` }}
                  />
                </div>
              </div>

              {/* Score Reasons */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Why this score?
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {lead.reasons.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: priorityColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="card">
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📞 Contact Information</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Phone */}
                <ContactRow
                  icon={<Phone size={14} style={{ color: lead.phone ? "var(--success)" : "var(--text-muted)" }} />}
                  label="Phone Number"
                  value={lead.phone || "Not found"}
                  confidence={lead.phoneConfidence}
                  action={lead.phone ? (
                    <div className="flex items-center gap-2">
                      <button className="btn btn-secondary btn-sm" onClick={handleCopyPhone} style={{ borderRadius: 8 }}>
                        {copied ? <><CheckCircle2 size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                      </button>
                      {whatsappUrl && (
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ background: "#25d366", boxShadow: "none" }}>
                          <Share2 size={12} /> WhatsApp
                        </a>
                      )}
                    </div>
                  ) : null}
                />

                {/* Website */}
                <ContactRow
                  icon={<Globe size={14} style={{ color: lead.hasWebsite ? "var(--cold)" : "var(--hot)" }} />}
                  label="Website"
                  value={lead.hasWebsite && lead.websiteUrl ? lead.websiteUrl : "No website"}
                  action={lead.hasWebsite && lead.websiteUrl ? (
                    <a href={lead.websiteUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ borderRadius: 8 }}>
                      <ExternalLink size={12} /> Visit
                    </a>
                  ) : (
                    <span className="tag tag-error" style={{ fontSize: 10 }}>🔥 Hot Signal</span>
                  )}
                />

                {/* Address */}
                <ContactRow
                  icon={<MapPin size={14} style={{ color: "var(--text-muted)" }} />}
                  label="Address"
                  value={lead.address}
                  action={
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(lead.name + " " + lead.city)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ borderRadius: 8 }}
                    >
                      <MapPin size={12} /> Maps
                    </a>
                  }
                />

                {/* Rating */}
                {lead.rating && (
                  <ContactRow
                    icon={<Star size={14} style={{ color: "var(--warm)" }} />}
                    label="Google Rating"
                    value={`${lead.rating} / 5.0 (${lead.reviewCount?.toLocaleString()} reviews)`}
                  />
                )}
              </div>
            </div>

            {/* AI Pitch Box */}
            <div className="card">
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                <TrendingUp size={14} style={{ display: "inline", marginRight: 6, color: "var(--accent-light)" }} />
                AI Pitch Suggestion
              </h2>
              <div className="pitch-box" style={{ fontSize: 14, lineHeight: 1.7 }}>
                {lead.pitch}
              </div>
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ marginTop: 12, background: "#25d366", boxShadow: "none" }}>
                  <Share2 size={13} /> Send this pitch via WhatsApp
                </a>
              )}
            </div>

            {/* Notes */}
            <div className="card">
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                <MessageSquare size={14} style={{ display: "inline", marginRight: 6, color: "var(--text-muted)" }} />
                Notes
              </h2>
              <textarea
                className="input"
                value={notes}
                onChange={e => handleNotesChange(e.target.value)}
                placeholder="Add notes about this lead — call outcome, contact name, follow-up date..."
                rows={4}
                style={{ resize: "vertical" }}
              />
              {!saved && notes && (
                <p style={{ fontSize: 11, color: "var(--warm)", marginTop: 6 }}>
                  Save this lead first to persist your notes.
                </p>
              )}
            </div>
          </div>

          {/* Right Column — CRM Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Status Tracker */}
            <div className="card">
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📋 CRM Status</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {STATUS_OPTIONS.map((opt, i) => {
                  const isActive = currentStatus === opt.value
                  const isPast = STATUS_OPTIONS.findIndex(o => o.value === currentStatus) > i
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(opt.value)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                        background: isActive ? "rgba(124,77,255,0.12)" : isPast ? "rgba(46,204,113,0.05)" : "rgba(255,255,255,0.03)",
                        color: isActive ? "var(--accent-light)" : isPast ? "var(--success)" : "var(--text-secondary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 13,
                        fontWeight: isActive ? 700 : 500,
                        textAlign: "left",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{opt.icon}</span>
                      {opt.label}
                      {isActive && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", marginLeft: "auto" }} />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card">
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📊 Business Signals</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <SignalRow label="Has Website" value={lead.hasWebsite} />
                <SignalRow label="Google Verified" value={lead.googleVerified} />
                <SignalRow label="Newly Opened" value={lead.isNewlyOpened} hot />
                <SignalRow label="Phone Available" value={!!lead.phone} />
                <SignalRow label="Low Review Count" value={(lead.reviewCount || 0) < 20} hot />
              </div>
            </div>

            {/* Save button (large) */}
            <button
              className={`btn ${saved ? "btn-danger" : "btn-primary"} w-full`}
              onClick={handleSave}
              style={{ justifyContent: "center", padding: 14 }}
            >
              {saved ? <><BookmarkCheck size={15} /> Unsave Lead</> : <><Bookmark size={15} /> Save to My Leads</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PriorityBadge({ priority, score }: { priority: string; score: number }) {
  if (priority === "HOT") return <span className="badge-hot">🔥 HOT · {score} pts</span>
  if (priority === "WARM") return <span className="badge-warm">⭐ WARM · {score} pts</span>
  return <span className="badge-cold">🧊 COLD · {score} pts</span>
}

function ContactRow({ icon, label, value, confidence, action }: {
  icon: React.ReactNode; label: string; value: string; confidence?: string | null; action?: React.ReactNode
}) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
          {label}
          {confidence && (
            <span className={`tag ${confidence === "HIGH" ? "tag-success" : confidence === "MEDIUM" ? "tag-warning" : ""}`} style={{ fontSize: 9, marginLeft: 6 }}>
              {confidence}
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-primary)", wordBreak: "break-all" }}>{value}</div>
        {action && <div style={{ marginTop: 8 }}>{action}</div>}
      </div>
    </div>
  )
}

function SignalRow({ label, value, hot }: { label: string; value: boolean; hot?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
      {value
        ? <span style={{ fontSize: 12, color: hot ? "var(--hot)" : "var(--success)", fontWeight: 600 }}>
            {hot ? "⚠️ Yes" : "✓ Yes"}
          </span>
        : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No</span>
      }
    </div>
  )
}
