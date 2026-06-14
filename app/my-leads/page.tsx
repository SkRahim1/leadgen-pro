"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/lib/context/AppContext"
import { SavedLead } from "@/lib/context/AppContext"
import Navbar from "@/components/Navbar"
import {
  Search, Download, MessageSquare, Trash2, ChevronDown,
  Phone, Globe, MapPin, Star, ArrowUpDown, LayoutList,
  LayoutGrid, Share2, CheckSquare2, Square, Check
} from "lucide-react"
import Link from "next/link"

const STATUS_OPTIONS = [
  { value: "NEW",             label: "New",             color: "var(--text-muted)",     bg: "rgba(96,96,160,0.1)"      },
  { value: "CONTACTED",       label: "Contacted",       color: "var(--cold)",            bg: "rgba(78,205,196,0.1)"     },
  { value: "INTERESTED",      label: "Interested",      color: "var(--warm)",            bg: "rgba(255,165,2,0.1)"      },
  { value: "CONVERTED",       label: "Converted",       color: "var(--success)",         bg: "rgba(46,204,113,0.1)"     },
  { value: "NOT_INTERESTED",  label: "Not Interested",  color: "var(--hot)",             bg: "rgba(255,71,87,0.1)"      },
]

const PRIORITY_COLORS: Record<string, string> = {
  HOT: "var(--hot)",
  WARM: "var(--warm)",
  COLD: "var(--cold)",
}

type ViewMode = "table" | "grid"
type SortKey = "savedAt" | "score" | "name" | "status" | "priority"

export default function MyLeadsPage() {
  const { savedLeads, removeLead, updateLeadStatus, updateLeadNotes, isLoggedIn, onboardingComplete, syncComplete } = useApp()
  const router = useRouter()

  const [mounted, setMounted]         = useState(false)
  const [view, setView]               = useState<ViewMode>("table")
  const [search, setSearch]           = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [sortKey, setSortKey]         = useState<SortKey>("savedAt")
  const [sortAsc, setSortAsc]         = useState(false)
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [openNotes, setOpenNotes]     = useState<string | null>(null)
  const [noteText, setNoteText]       = useState("")

  // Default to card/grid layout on mobile screens
  useEffect(() => {
    setMounted(true)
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setView("grid")
    }
  }, [])

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login")
    } else if (syncComplete && !onboardingComplete) {
      router.replace("/onboarding")
    }
  }, [isLoggedIn, syncComplete, onboardingComplete, router])

  // ─── Filter + Sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let data = [...savedLeads]

    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        (l.phone || "").includes(q)
      )
    }
    if (filterStatus !== "all")   data = data.filter(l => l.status === filterStatus)
    if (filterPriority !== "all") data = data.filter(l => l.priority === filterPriority)

    data.sort((a, b) => {
      let cmp = 0
      if (sortKey === "savedAt") cmp = new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      else if (sortKey === "score") cmp = b.score - a.score
      else if (sortKey === "name")  cmp = a.name.localeCompare(b.name)
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status)
      else if (sortKey === "priority") {
        const order = { HOT: 0, WARM: 1, COLD: 2 }
        cmp = (order[a.priority as keyof typeof order] || 0) - (order[b.priority as keyof typeof order] || 0)
      }
      return sortAsc ? -cmp : cmp
    })

    return data
  }, [savedLeads, search, filterStatus, filterPriority, sortKey, sortAsc])

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const totalLeads    = savedLeads.length
  const hotLeads      = savedLeads.filter(l => l.priority === "HOT").length
  const contacted     = savedLeads.filter(l => l.status !== "NEW").length
  const converted     = savedLeads.filter(l => l.status === "CONVERTED").length

  // ─── Selection ──────────────────────────────────────────────────────────────
  const allSelected   = filtered.length > 0 && filtered.every(l => selected.has(l.placeId))
  const someSelected  = selected.size > 0

  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(filtered.map(l => l.placeId)))
  }

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ─── Bulk Actions ───────────────────────────────────────────────────────────
  const selectedLeads = filtered.filter(l => selected.has(l.placeId))

  const handleBulkExport = () => {
    const leads = someSelected ? selectedLeads : filtered
    if (!leads.length) return
    const headers = ["Name", "Category", "Phone", "City", "Score", "Priority", "Status", "Pitch", "Saved At"]
    const rows = leads.map(l => [
      l.name, l.category, l.phone || "—", l.city,
      l.score, l.priority, l.status,
      `"${l.pitch}"`,
      new Date(l.savedAt).toLocaleDateString("en-IN"),
    ])
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url
    a.download = `my_leads_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleBulkWhatsApp = () => {
    const leads = someSelected ? selectedLeads : filtered
    const withPhone = leads.filter(l => l.phone)
    if (!withPhone.length) return alert("No leads with phone numbers selected.")

    // Open first 5 in new tabs (browser allows max 5 popups)
    withPhone.slice(0, 5).forEach(l => {
      const num = l.phone!.replace(/\D/g, "")
      const url = `https://wa.me/91${num}?text=${encodeURIComponent(l.pitch)}`
      window.open(url, "_blank")
    })

    if (withPhone.length > 5) {
      alert(`Opened WhatsApp for 5 leads. ${withPhone.length - 5} more have phone numbers — export CSV to reach them all.`)
    }
  }

  const handleBulkDelete = () => {
    if (!someSelected) return
    if (!confirm(`Remove ${selected.size} lead(s) from your pipeline?`)) return
    selected.forEach(id => removeLead(id))
    setSelected(new Set())
  }

  const handleBulkStatus = (status: string) => {
    if (!someSelected) return
    selected.forEach(id => updateLeadStatus(id, status as any))
  }

  // ─── Sort toggle ────────────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(prev => !prev)
    else { setSortKey(key); setSortAsc(false) }
  }

  // ─── Notes ──────────────────────────────────────────────────────────────────
  const openNote = (lead: SavedLead) => {
    setOpenNotes(lead.placeId)
    setNoteText(lead.notes || "")
  }
  const saveNote = () => {
    if (openNotes) {
      updateLeadNotes(openNotes, noteText)
      setOpenNotes(null)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      <div className="bg-glow" />
      <Navbar />

      <div className="container" style={{ maxWidth: 1400, margin: "0 auto", paddingTop: 24, paddingBottom: 24 }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between my-leads-header" style={{ marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>My Leads</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
              {totalLeads} leads saved · {contacted} contacted · {converted} converted
            </p>
          </div>
          <Link href="/search" className="btn btn-primary btn-sm">
            + Find More Leads
          </Link>
        </div>

        {/* ── Top Stats ── */}
        <div className="my-leads-stats-grid">
          {[
            { label: "Total",     value: totalLeads, color: "var(--accent-light)" },
            { label: "🔥 HOT",    value: hotLeads,   color: "var(--hot)" },
            { label: "Contacted", value: contacted,   color: "var(--cold)" },
            { label: "Converted", value: converted,   color: "var(--success)" },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: "14px 18px" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: "-0.04em" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Empty state ── */}
        {totalLeads === 0 ? (
          <div className="empty-state" style={{ padding: "80px 32px" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No leads saved yet</h3>
            <p style={{ color: "var(--text-secondary)", maxWidth: 360, marginBottom: 24 }}>
              Go to Search, find businesses that match your offer, and save the ones you want to follow up with.
            </p>
            <Link href="/search" className="btn btn-primary">🔍 Start Searching Leads</Link>
          </div>
        ) : (
          <>
            {/* ── Toolbar ── */}
            <div className="my-leads-toolbar">
              {/* Search */}
              <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  className="input"
                  placeholder="Search by name, category, city, phone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 34, height: 36, fontSize: 13 }}
                />
              </div>

              {/* Status filter */}
              <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: "auto", height: 36, fontSize: 13, paddingTop: 0, paddingBottom: 0 }}>
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>

              {/* Priority filter */}
              <select className="select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ width: "auto", height: 36, fontSize: 13, paddingTop: 0, paddingBottom: 0 }}>
                <option value="all">All Priorities</option>
                <option value="HOT">🔥 HOT</option>
                <option value="WARM">⭐ WARM</option>
                <option value="COLD">🧊 COLD</option>
              </select>

              <div className="my-leads-spacer" style={{ flex: 1 }} />

              {/* View toggle */}
              <div style={{ display: "flex", background: "var(--bg-pill)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                {(["table", "grid"] as ViewMode[]).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    style={{
                      padding: "7px 12px",
                      border: "none",
                      background: view === v ? "rgba(124,77,255,0.2)" : "transparent",
                      color: view === v ? "var(--accent-light)" : "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {v === "table" ? <LayoutList size={15} /> : <LayoutGrid size={15} />}
                  </button>
                ))}
              </div>

              {/* Export */}
              <button className="btn btn-secondary btn-sm" onClick={handleBulkExport}>
                <Download size={13} /> {someSelected ? `Export (${selected.size})` : "Export All"}
              </button>
            </div>

            {/* ── Bulk Action Bar (when selection active) ── */}
            {someSelected && (
              <div className="my-leads-bulk-bar animate-fade-in">
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-light)" }}>
                  {selected.size} selected
                </span>
                <div style={{ width: 1, height: 16, background: "var(--border)" }} />

                {/* Bulk status change */}
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Mark as:</span>
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => handleBulkStatus(s.value)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: `1px solid ${s.color}44`,
                      background: s.bg,
                      color: s.color,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {s.label}
                  </button>
                ))}

                <div style={{ flex: 1 }} />

                <button className="btn btn-primary btn-sm" onClick={handleBulkWhatsApp} style={{ background: "#25d366", boxShadow: "none" }}>
                  <Share2 size={12} /> WhatsApp ({selectedLeads.filter(l => l.phone).length})
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
                  <Trash2 size={12} /> Remove
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  style={{ fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
                >
                  ✕ Clear
                </button>
              </div>
            )}

            {/* ── Results count ── */}
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
              Showing {filtered.length} of {totalLeads} leads
              {(filterStatus !== "all" || filterPriority !== "all" || search) && " (filtered)"}
            </div>

            {!mounted ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                <div className="spinner" />
              </div>
            ) : (
              <>
                {/* ── Table View ── */}
                {view === "table" && (
                  <div style={{ 
                    width: "100%", 
                    maxWidth: "100%", 
                    overflowX: "auto", 
                    border: "1px solid var(--border)", 
                    borderRadius: 12,
                    background: "var(--table-bg)"
                  }}>
                    {/* Table header */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "36px 2fr 1fr 120px 100px 110px 140px 80px 44px",
                      width: "960px",
                      padding: "10px 16px",
                      background: "var(--bg-well)",
                      borderBottom: "1px solid var(--border)",
                      gap: 12,
                      alignItems: "center",
                    }}>
                      {/* Select all */}
                      <button onClick={toggleAll} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}>
                        {allSelected ? <CheckSquare2 size={16} style={{ color: "var(--accent-light)" }} /> : <Square size={16} />}
                      </button>

                      {[
                        { key: "name" as SortKey, label: "Business" },
                        { key: "name" as SortKey, label: "Category", noSort: true },
                        { key: "name" as SortKey, label: "Phone", noSort: true },
                        { key: "score" as SortKey, label: "Score" },
                        { key: "priority" as SortKey, label: "Priority" },
                        { key: "status" as SortKey, label: "Status" },
                        { key: "savedAt" as SortKey, label: "Saved" },
                        { label: "Actions", noSort: true },
                      ].map((col, i) => (
                        <div
                          key={i}
                          onClick={() => !col.noSort && col.key && handleSort(col.key)}
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            cursor: col.noSort ? "default" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            userSelect: "none",
                          }}
                        >
                          {col.label}
                          {!col.noSort && sortKey === col.key && (
                            <ArrowUpDown size={11} style={{ color: "var(--accent-light)" }} />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Table rows */}
                    {filtered.length === 0 ? (
                      <div className="empty-state" style={{ padding: "40px 20px" }}>
                        <div className="empty-state-icon">🔎</div>
                        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No leads match your filters</p>
                      </div>
                    ) : (
                      filtered.map((lead, idx) => (
                        <LeadRow
                          key={lead.placeId}
                          lead={lead}
                          selected={selected.has(lead.placeId)}
                          onToggle={() => toggleOne(lead.placeId)}
                          onStatusChange={s => updateLeadStatus(lead.placeId, s as any)}
                          onDelete={() => removeLead(lead.placeId)}
                          onNote={() => openNote(lead)}
                          isEven={idx % 2 === 0}
                        />
                      ))
                    )}
                  </div>
                )}

                {/* ── Grid View ── */}
                {view === "grid" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                    {filtered.length === 0 ? (
                      <div className="empty-state" style={{ gridColumn: "1 / -1", padding: "40px 20px" }}>
                        <p style={{ color: "var(--text-muted)" }}>No leads match your filters</p>
                      </div>
                    ) : (
                      filtered.map(lead => (
                        <LeadGridCard
                          key={lead.placeId}
                          lead={lead}
                          selected={selected.has(lead.placeId)}
                          onToggle={() => toggleOne(lead.placeId)}
                          onStatusChange={s => updateLeadStatus(lead.placeId, s as any)}
                          onDelete={() => removeLead(lead.placeId)}
                        />
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ── Notes Modal ── */}
      {openNotes && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
        }} onClick={() => setOpenNotes(null)}>
          <div
            className="card animate-scale-in"
            style={{ width: 440, padding: 28 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Add Note</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
              {savedLeads.find(l => l.placeId === openNotes)?.name}
            </p>
            <textarea
              className="input"
              rows={5}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Call outcome, contact name, follow-up date, objections..."
              style={{ resize: "vertical", marginBottom: 16 }}
              autoFocus
            />
            <div className="flex justify-between">
              <button className="btn btn-secondary" onClick={() => setOpenNotes(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveNote}>Save Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Table Row Component ───────────────────────────────────────────────────────
function LeadRow({ lead, selected, onToggle, onStatusChange, onDelete, onNote, isEven }: {
  lead: SavedLead
  selected: boolean
  onToggle: () => void
  onStatusChange: (s: string) => void
  onDelete: () => void
  onNote: () => void
  isEven: boolean
}) {
  const [statusOpen, setStatusOpen] = useState(false)
  const statusInfo = STATUS_OPTIONS.find(s => s.value === lead.status)

  const whatsappUrl = lead.phone
    ? `https://wa.me/91${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(lead.pitch)}`
    : null

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "36px 2fr 1fr 120px 100px 110px 140px 80px 44px",
      width: "960px",
      padding: "12px 16px",
      gap: 12,
      alignItems: "center",
      background: selected ? "rgba(124,77,255,0.06)" : isEven ? "rgba(255,255,255,0.01)" : "transparent",
      borderBottom: "1px solid var(--border)",
      transition: "background 0.15s ease",
    }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = selected ? "rgba(124,77,255,0.08)" : "rgba(255,255,255,0.04)"}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = selected ? "rgba(124,77,255,0.06)" : isEven ? "rgba(255,255,255,0.01)" : "transparent"}
    >
      {/* Checkbox */}
      <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}>
        {selected
          ? <CheckSquare2 size={16} style={{ color: "var(--accent-light)" }} />
          : <Square size={16} />
        }
      </button>

      {/* Business name */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: PRIORITY_COLORS[lead.priority], flexShrink: 0 }} />
          <Link href={`/leads/${lead.placeId}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {lead.name}
          </Link>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", paddingLeft: 12 }}>{lead.city}</div>
      </div>

      {/* Category */}
      <div style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {lead.category}
      </div>

      {/* Phone */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {lead.phone ? (
          <>
            <Phone size={11} style={{ color: "var(--success)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis" }}>{lead.phone}</span>
          </>
        ) : (
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>
        )}
      </div>

      {/* Score */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: PRIORITY_COLORS[lead.priority] }}>{lead.score}</span>
        <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${lead.score}%`, height: "100%", background: PRIORITY_COLORS[lead.priority], borderRadius: 2 }} />
        </div>
      </div>

      {/* Priority */}
      <div>
        {lead.priority === "HOT"  && <span className="badge-hot"  style={{ fontSize: 10 }}>🔥 HOT</span>}
        {lead.priority === "WARM" && <span className="badge-warm" style={{ fontSize: 10 }}>⭐ WARM</span>}
        {lead.priority === "COLD" && <span className="badge-cold" style={{ fontSize: 10 }}>🧊 COLD</span>}
      </div>

      {/* Status dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setStatusOpen(p => !p)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 10px",
            borderRadius: 6,
            border: `1px solid ${statusInfo?.color}44`,
            background: statusInfo?.bg,
            color: statusInfo?.color,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          {statusInfo?.label}
          <ChevronDown size={10} style={{ transform: statusOpen ? "rotate(180deg)" : "none", transition: "0.2s" }} />
        </button>
        {statusOpen && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            overflow: "hidden",
            minWidth: 160,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}>
            {STATUS_OPTIONS.map(s => (
              <button
                key={s.value}
                onClick={() => { onStatusChange(s.value); setStatusOpen(false) }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "9px 14px",
                  background: lead.status === s.value ? s.bg : "transparent",
                  color: s.color,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {lead.status === s.value && <Check size={10} />}
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Saved at */}
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
        {new Date(lead.savedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 4 }}>
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#25d366" }}
            title="WhatsApp"
          >
            <Share2 size={12} />
          </a>
        )}
        <button
          onClick={onNote}
          style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", cursor: "pointer" }}
          title="Add note"
        >
          <MessageSquare size={12} />
        </button>
        <button
          onClick={() => { if (confirm("Remove this lead?")) onDelete() }}
          style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,71,87,0.06)", border: "1px solid rgba(255,71,87,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--hot)", cursor: "pointer" }}
          title="Remove"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ─── Grid Card Component ───────────────────────────────────────────────────────
function LeadGridCard({ lead, selected, onToggle, onStatusChange, onDelete }: {
  lead: SavedLead
  selected: boolean
  onToggle: () => void
  onStatusChange: (s: string) => void
  onDelete: () => void
}) {
  const statusInfo = STATUS_OPTIONS.find(s => s.value === lead.status)
  const priorityColor = PRIORITY_COLORS[lead.priority]

  const whatsappUrl = lead.phone
    ? `https://wa.me/91${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(lead.pitch)}`
    : null

  return (
    <div style={{
      background: "var(--bg-card)",
      border: `1px solid ${selected ? "rgba(124,77,255,0.4)" : "var(--border)"}`,
      borderLeft: `3px solid ${priorityColor}`,
      borderRadius: 14,
      padding: "16px",
      transition: "all 0.2s ease",
    }}>
      {/* Header row */}
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}>
          {selected ? <CheckSquare2 size={15} style={{ color: "var(--accent-light)" }} /> : <Square size={15} />}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lead.priority === "HOT"  && <span className="badge-hot"  style={{ fontSize: 9 }}>🔥 HOT</span>}
          {lead.priority === "WARM" && <span className="badge-warm" style={{ fontSize: 9 }}>⭐ WARM</span>}
          {lead.priority === "COLD" && <span className="badge-cold" style={{ fontSize: 9 }}>🧊 COLD</span>}
          <span style={{ fontSize: 12, fontWeight: 800, color: priorityColor }}>{lead.score}</span>
        </div>
      </div>

      {/* Name */}
      <Link href={`/leads/${lead.placeId}`} style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 4 }}>
        {lead.name}
      </Link>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>{lead.category} · {lead.city}</div>

      {/* Phone */}
      {lead.phone && (
        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
          <Phone size={11} style={{ color: "var(--success)" }} />
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-secondary)" }}>{lead.phone}</span>
        </div>
      )}

      {/* Status select */}
      <select
        value={lead.status}
        onChange={e => onStatusChange(e.target.value)}
        style={{
          width: "100%",
          padding: "6px 10px",
          borderRadius: 8,
          border: `1px solid ${statusInfo?.color}44`,
          background: statusInfo?.bg,
          color: statusInfo?.color,
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          outline: "none",
          marginBottom: 10,
        }}
      >
        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)", color: "#25d366", borderRadius: 8, padding: "5px 10px", fontSize: 11 }}>
            <Share2 size={11} /> WhatsApp
          </a>
        )}
        <button onClick={() => { if (confirm("Remove?")) onDelete() }}
          style={{ marginLeft: "auto", width: 28, height: 28, borderRadius: 8, background: "rgba(255,71,87,0.06)", border: "1px solid rgba(255,71,87,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--hot)", cursor: "pointer" }}>
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}
