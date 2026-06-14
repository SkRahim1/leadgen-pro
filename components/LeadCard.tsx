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
      style={{ animationDelay: `${index * 0.05}s`, opacity: 0, padding: "14px 16px" }}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
          <PriorityBadge priority={lead.priority} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>#{lead.score}</span>
        </div>
        <div className="flex items-center gap-2">
          {typeof lead.distanceKm === "number" && lead.distanceKm > 0 && (
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
      <div className="mb-2">
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 4 }}>
          {lead.name}
        </h3>
        <span className="tag" style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4 }}>{lead.category}</span>
      </div>

      {/* Score Bar (Compact) */}
      <div className="mb-2">
        <div className="score-bar" style={{ height: 3, background: "rgba(255,255,255,0.05)" }}>
          <div
            className={`score-bar-fill ${scoreBarClass}`}
            style={{ width: `${lead.score}%`, height: "100%" }}
          />
        </div>
      </div>

      {/* Contact Info (Compact Pill-based Layout) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {lead.phone ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(46, 204, 113, 0.05)",
              border: "1px solid rgba(46, 204, 113, 0.15)",
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: 11
            }}>
              <Phone size={10} style={{ color: "var(--success)", flexShrink: 0 }} />
              <span style={{ fontFamily: "monospace", color: "var(--text-secondary)", fontWeight: 500 }}>
                {lead.phone}
              </span>
              {lead.phoneConfidence && (
                <span className={`tag ${lead.phoneConfidence === "HIGH" ? "tag-success" : "tag-warning"}`} style={{ fontSize: 8, padding: "0 3px", transform: "scale(0.85)", transformOrigin: "left center" }}>
                  {lead.phoneConfidence}
                </span>
              )}
            </div>
          ) : (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: 11,
              color: "var(--text-muted)"
            }}>
              <Phone size={10} style={{ flexShrink: 0 }} />
              <span>No phone</span>
            </div>
          )}
          
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: lead.hasWebsite ? "rgba(78, 205, 196, 0.05)" : "rgba(255, 71, 87, 0.05)",
            border: `1px solid ${lead.hasWebsite ? "rgba(78, 205, 196, 0.15)" : "rgba(255, 71, 87, 0.15)"}`,
            borderRadius: 6,
            padding: "2px 8px",
            fontSize: 11
          }}>
            <Globe size={10} style={{ color: lead.hasWebsite ? "var(--cold)" : "var(--hot)", flexShrink: 0 }} />
            {lead.hasWebsite ? (
              <a href={lead.websiteUrl || "#"} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-light)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 500 }}>
                Website <ExternalLink size={8} />
              </a>
            ) : (
              <span style={{ color: "var(--hot)", fontWeight: 500 }}>No website</span>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-1.5" style={{ fontSize: 11, color: "var(--text-muted)" }}>
          <MapPin size={11} style={{ marginTop: 2, flexShrink: 0 }} />
          <span style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis" }}>
            {lead.address}
          </span>
        </div>
      </div>

      {/* Rating & Newly Opened Tag */}
      {(lead.rating || lead.isNewlyOpened) && (
        <div className="flex items-center gap-2" style={{ marginBottom: 8, fontSize: 11 }}>
          {lead.rating && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,165,2,0.06)", color: "var(--warm)", border: "1px solid rgba(255,165,2,0.15)", borderRadius: 6, padding: "2px 6px" }}>
              <Star size={10} fill="var(--warm)" style={{ color: "var(--warm)" }} />
              <span style={{ fontWeight: 700, fontSize: 10 }}>{lead.rating}</span>
              <span style={{ color: "var(--text-muted)", fontSize: 10 }}>({lead.reviewCount || 0})</span>
            </div>
          )}
          {lead.isNewlyOpened && (
            <span className="tag tag-info" style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6 }}>
              🆕 Newly Opened
            </span>
          )}
        </div>
      )}

      {/* Pitch */}
      <div className="pitch-box" style={{ marginTop: 2, padding: "8px 12px", fontSize: 12, borderRadius: 8 }}>
        <TrendingUp size={11} style={{ display: "inline", marginRight: 6, color: "var(--accent-light)", verticalAlign: "middle" }} />
        <span style={{ verticalAlign: "middle", lineHeight: 1.4 }}>{lead.pitch}</span>
      </div>

      {/* View link */}
      <div className="flex justify-end mt-2">
        <span style={{ fontSize: 10, color: "var(--accent-light)", display: "flex", alignItems: "center", gap: 3 }}>
          View details <ExternalLink size={9} />
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
