"use client"

import { ScoredLead } from "@/types/lead.types"
import { useApp } from "@/lib/context/AppContext"
import { MapPin, Phone, Globe, Star, Bookmark, BookmarkCheck, ExternalLink, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"

interface LeadCardProps {
  lead: ScoredLead
  index?: number
  onClick?: () => void
}

export default function LeadCard({ lead, index = 0, onClick }: LeadCardProps) {
  const { saveLead, removeLead, isLeadSaved } = useApp()
  const router = useRouter()
  const saved = isLeadSaved(lead.placeId)

  const priorityClass = lead.priority === "HOT" ? "hot" : lead.priority === "WARM" ? "warm" : "cold"
  const scoreBarClass = lead.priority === "HOT" ? "hot" : lead.priority === "WARM" ? "warm" : "cold"

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (saved) {
      removeLead(lead.placeId)
    } else {
      saveLead(lead)
    }
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.push(`/leads/${lead.placeId}`)
    }
  }

  return (
    <div
      className={`lead-card ${priorityClass} animate-fade-in-up`}
      style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
          <PriorityBadge priority={lead.priority} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>#{lead.score}</span>
        </div>
        <div className="flex items-center gap-2">
          {lead.distanceKm && (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {lead.distanceKm.toFixed(1)} km
            </span>
          )}
          <button
            className="btn btn-icon btn-secondary"
            onClick={handleSave}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              color: saved ? "var(--accent-light)" : "var(--text-muted)",
              borderColor: saved ? "var(--accent)" : "var(--border)",
              background: saved ? "rgba(124,77,255,0.1)" : undefined,
            }}
          >
            {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          </button>
        </div>
      </div>

      {/* Business Name & Category */}
      <div className="mb-3">
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 4 }}>
          {lead.name}
        </h3>
        <span className="tag" style={{ fontSize: 10 }}>{lead.category}</span>
      </div>

      {/* Score Bar */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Lead Score</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: lead.priority === "HOT" ? "var(--hot)" : lead.priority === "WARM" ? "var(--warm)" : "var(--cold)" }}>
            {lead.score}/100
          </span>
        </div>
        <div className="score-bar">
          <div
            className={`score-bar-fill ${scoreBarClass}`}
            style={{ width: `${lead.score}%` }}
          />
        </div>
      </div>

      {/* Contact Info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {lead.phone && (
          <div className="flex items-center gap-2">
            <Phone size={12} style={{ color: "var(--success)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>
              {lead.phone}
            </span>
            {lead.phoneConfidence && (
              <span className={`tag ${lead.phoneConfidence === "HIGH" ? "tag-success" : lead.phoneConfidence === "MEDIUM" ? "tag-warning" : ""}`} style={{ fontSize: 9, padding: "1px 6px" }}>
                {lead.phoneConfidence}
              </span>
            )}
          </div>
        )}
        {!lead.phone && (
          <div className="flex items-center gap-2">
            <Phone size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No phone found</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Globe size={12} style={{ color: lead.hasWebsite ? "var(--cold)" : "var(--hot)", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: lead.hasWebsite ? "var(--text-secondary)" : "var(--hot)" }}>
            {lead.hasWebsite ? lead.websiteUrl : "No website"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }} className="truncate">
            {lead.address}
          </span>
        </div>
      </div>

      {/* Rating */}
      {lead.rating && (
        <div className="flex items-center gap-3 mb-12">
          <div className="flex items-center gap-1">
            <Star size={11} fill="var(--warm)" style={{ color: "var(--warm)" }} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{lead.rating}</span>
          </div>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {lead.reviewCount?.toLocaleString()} reviews
          </span>
          {lead.isNewlyOpened && (
            <span className="tag tag-info" style={{ fontSize: 10, padding: "1px 8px" }}>🆕 New</span>
          )}
        </div>
      )}

      {/* Pitch */}
      <div className="pitch-box" style={{ marginTop: 4 }}>
        <TrendingUp size={11} style={{ display: "inline", marginRight: 6, color: "var(--accent-light)" }} />
        {lead.pitch}
      </div>

      {/* View link */}
      <div className="flex justify-end mt-3">
        <span style={{ fontSize: 11, color: "var(--accent-light)", display: "flex", alignItems: "center", gap: 4 }}>
          View details <ExternalLink size={10} />
        </span>
      </div>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "HOT") return <span className="badge-hot">🔥 HOT</span>
  if (priority === "WARM") return <span className="badge-warm">⭐ WARM</span>
  return <span className="badge-cold">🧊 COLD</span>
}
