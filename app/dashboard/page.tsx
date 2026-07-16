"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/lib/context/AppContext"
import Navbar from "@/components/Navbar"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Flame, Star, ThumbsUp, Download, Zap, Loader2 } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { savedLeads, sellerProfile, isLoggedIn, onboardingComplete, user, syncComplete, importWebDevLeads } = useApp()
  const router = useRouter()
  const [importing, setImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login")
    } else if (syncComplete && !onboardingComplete) {
      router.replace("/onboarding")
    }
  }, [isLoggedIn, syncComplete, onboardingComplete, router])

  // Stats
  const total = savedLeads.length
  const hot = savedLeads.filter(l => l.priority === "HOT").length
  const warm = savedLeads.filter(l => l.priority === "WARM").length
  const cold = savedLeads.filter(l => l.priority === "COLD").length
  const contacted = savedLeads.filter(l => l.status === "CONTACTED" || l.status === "INTERESTED").length
  const converted = savedLeads.filter(l => l.status === "CONVERTED").length
  const convRate = total > 0 ? Math.round((converted / total) * 100) : 0

  // Priority distribution for pie chart
  const pieData = [
    { name: "HOT 🔥", value: hot, color: "#ff4757" },
    { name: "WARM ⭐", value: warm, color: "#ffa502" },
    { name: "COLD 🧊", value: cold, color: "#4ecdc4" },
  ].filter(d => d.value > 0)

  // Status distribution for bar chart
  const statusData = [
    { name: "New", count: savedLeads.filter(l => l.status === "NEW").length, color: "var(--text-muted)" },
    { name: "Contacted", count: savedLeads.filter(l => l.status === "CONTACTED").length, color: "var(--cold)" },
    { name: "Interested", count: savedLeads.filter(l => l.status === "INTERESTED").length, color: "var(--warm)" },
    { name: "Converted", count: savedLeads.filter(l => l.status === "CONVERTED").length, color: "var(--success)" },
    { name: "Lost", count: savedLeads.filter(l => l.status === "NOT_INTERESTED").length, color: "var(--hot)" },
  ]

  // Category breakdown
  const categoryMap: Record<string, number> = {}
  savedLeads.forEach(l => {
    categoryMap[l.category] = (categoryMap[l.category] || 0) + 1
  })
  const categoryData = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }))

  // Export CSV of all saved leads
  const handleExportAll = () => {
    if (!savedLeads.length) return
    const headers = ["Name", "Category", "Phone", "Address", "Score", "Priority", "Status", "Saved At"]
    const rows = savedLeads.map(l => [
      l.name, l.category, l.phone || "", l.address, l.score, l.priority, l.status, new Date(l.savedAt).toLocaleDateString("en-IN")
    ])
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `my_leads_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const recentLeads = [...savedLeads].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()).slice(0, 5)

  return (
    <div className="page-wrapper">
      <div className="bg-glow" />
      <Navbar />

      <div className="container" style={{ maxWidth: 1300, margin: "0 auto", paddingTop: 24, paddingBottom: 24 }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 dashboard-header">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>
              Dashboard
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
              Welcome back, {user?.name?.split(" ")[0]} 👋 — Here's your lead pipeline
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary btn-sm" onClick={handleExportAll} disabled={!savedLeads.length}>
              <Download size={13} /> Export All CSV
            </button>
            <Link href="/search" className="btn btn-primary btn-sm">
              <Zap size={13} /> Find More Leads
            </Link>
          </div>
        </div>

        {/* Telecalling Campaign Seeding Banner */}
        {syncComplete && isLoggedIn && (
          <div 
            style={{ 
              background: "linear-gradient(135deg, rgba(124, 77, 255, 0.12) 0%, rgba(98, 0, 234, 0.06) 100%)",
              border: "1px solid rgba(124, 77, 255, 0.25)",
              borderRadius: 16,
              padding: "16px 24px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
              boxShadow: "0 4px 24px rgba(124, 77, 255, 0.05)"
            }}
          >
            <div style={{ flex: 1, minWidth: 280 }}>
              <div className="flex items-center gap-2" style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 18, marginRight: 6 }}>📞</span>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--accent-light)", margin: 0 }}>
                  Telecalling Campaign: Seed 500 Real B2B Leads
                </h3>
                <span className="badge-hot" style={{ fontSize: 9, padding: "2px 6px", marginLeft: 10, display: "inline-block" }}>CAMPAIGN ACTIVE</span>
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              {importSuccess ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--success)", fontSize: 13, fontWeight: 700 }}>
                  <span>✓</span> {importSuccess}
                </div>
              ) : (
                <button 
                  className="btn btn-primary"
                  disabled={importing}
                  onClick={async () => {
                    setImporting(true)
                    try {
                      const res = await fetch('/api/import-leads')
                      const data = await res.json()
                      if (data.leads && data.leads.length > 0) {
                        importWebDevLeads(data.leads)
                        setImportSuccess(`Successfully imported ${data.leads.length} real B2B leads!`)
                      } else {
                        alert("No leads found or error occurred while importing.")
                      }
                    } catch (err) {
                      console.error("Error importing leads:", err)
                      alert("Failed to import leads. Please try again.")
                    } finally {
                      setImporting(false)
                    }
                  }}
                  style={{ 
                    padding: "10px 20px", 
                    borderRadius: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--accent)",
                    borderColor: "var(--accent)",
                    cursor: importing ? "wait" : "pointer"
                  }}
                >
                  {importing ? (
                    <>
                      <Loader2 size={14} className="spin" style={{ animation: "spin 0.8s linear infinite" }} />
                      Crawling Listings...
                    </>
                  ) : (
                    <>
                      <span>⚡</span> Load 500 Real Leads
                    </>
                  )}
                </button>
              )}
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                Crawls Sulekha in parallel · No local command execution required
              </div>
            </div>
          </div>
        )}

        {total === 0 ? (
          // Empty State
          <div className="empty-state" style={{ padding: "80px 32px" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No leads saved yet</h3>
            <p style={{ color: "var(--text-secondary)", maxWidth: 360, marginBottom: 24 }}>
              Search for businesses and save the ones you want to follow up with. Your pipeline will show up here.
            </p>
            <Link href="/search" className="btn btn-primary">
              🔍 Start Searching Leads
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
              <StatCard
                icon="📊"
                value={total}
                label="Total Leads"
                color="var(--accent-light)"
                bg="rgba(124,77,255,0.1)"
              />
              <StatCard
                icon="🔥"
                value={hot}
                label="HOT Leads"
                color="var(--hot)"
                bg="var(--hot-bg)"
              />
              <StatCard
                icon="📞"
                value={contacted}
                label="Contacted"
                color="var(--cold)"
                bg="var(--cold-bg)"
              />
              <StatCard
                icon="✅"
                value={converted}
                label={`Converted (${convRate}%)`}
                color="var(--success)"
                bg="rgba(46,204,113,0.1)"
              />
            </div>

            {/* Charts Row */}
            <div className="dashboard-charts-row">

              {/* Status Bar Chart */}
              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Pipeline Status</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={statusData} barSize={32}>
                    <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Priority Pie Chart */}
              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Priority Mix</h3>
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={35} strokeWidth={0}>
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                      {pieData.map(d => (
                        <div key={d.name} className="flex items-center gap-2">
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{d.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginLeft: "auto" }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)", fontSize: 12 }}>
                    No data yet
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row */}
            <div className="dashboard-bottom-row">

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 style={{ fontSize: 14, fontWeight: 700 }}>Recent Leads</h3>
                  <Link href="/my-leads" style={{ fontSize: 12, color: "var(--accent-light)" }}>View all →</Link>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {recentLeads.map(lead => (
                    <Link key={lead.placeId} href={`/leads/${lead.placeId}`} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      transition: "all 0.2s ease",
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(124,77,255,0.3)"}
                      onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)"}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: lead.priority === "HOT" ? "var(--hot)" : lead.priority === "WARM" ? "var(--warm)" : "var(--cold)" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{lead.category} · {lead.city}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: lead.priority === "HOT" ? "var(--hot)" : lead.priority === "WARM" ? "var(--warm)" : "var(--cold)" }}>
                          {lead.score}
                        </span>
                        <StatusDot status={lead.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Top Categories</h3>
                {categoryData.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {categoryData.map(({ name, count }) => {
                      const pct = Math.round((count / total) * 100)
                      return (
                        <div key={name}>
                          <div className="flex justify-between" style={{ marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{name}</span>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>{count}</span>
                          </div>
                          <div className="score-bar" style={{ height: 4 }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: 2, transition: "width 0.8s" }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center", padding: "30px 0" }}>
                    No category data yet
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, color, bg }: { icon: string; value: number; label: string; color: string; bg: string }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: bg }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    NEW: "var(--text-muted)",
    CONTACTED: "var(--cold)",
    INTERESTED: "var(--warm)",
    CONVERTED: "var(--success)",
    NOT_INTERESTED: "var(--hot)",
  }
  return (
    <div style={{ width: 6, height: 6, borderRadius: "50%", background: colors[status] || "var(--text-muted)" }} title={status} />
  )
}
