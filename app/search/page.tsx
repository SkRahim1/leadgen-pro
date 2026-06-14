"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useApp } from "@/lib/context/AppContext"
import Navbar from "@/components/Navbar"
import LeadCard from "@/components/LeadCard"
import { CATEGORIES } from "@/lib/data/categories"
import { ScoredLead } from "@/types/lead.types"
import { CITY_AREAS } from "@/lib/data/cityAreas"
import { Search, MapPin, Filter, SlidersHorizontal, Download, Loader2, X, ChevronDown, Bookmark, BookmarkCheck, ExternalLink } from "lucide-react"

const RADIUS_OPTIONS = [1, 2, 5, 10, 25, 50]

export default function SearchPage() {
  const { user, sellerProfile, isLoggedIn, onboardingComplete, saveLead, removeLead, isLeadSaved, syncComplete } = useApp()
  const router = useRouter()

  const [query, setQuery] = useState("")
  const [industry, setIndustry] = useState("all")
  const [category, setCategory] = useState("all")
  const [radius, setRadius] = useState(5)
  const [results, setResults] = useState<ScoredLead[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterPhone, setFilterPhone] = useState(false)
  const [filterNoWebsite, setFilterNoWebsite] = useState(false)
  const [sortBy, setSortBy] = useState("score")
  const [showFilters, setShowFilters] = useState(false)
  const [hasAutoSearched, setHasAutoSearched] = useState(false)
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "table">("table")
  const [isRestored, setIsRestored] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Dynamically detect city from query input to show relevant areas
  const queryCity = Object.keys(CITY_AREAS).find(c => 
    query.toLowerCase().includes(c.toLowerCase())
  )
  const currentCity = queryCity || sellerProfile?.targetCity || "Hyderabad"
  const cityAreas = CITY_AREAS[currentCity] || []

  // Restore search state from sessionStorage on mount
  useEffect(() => {
    setMounted(true)
    try {
      const raw = sessionStorage.getItem("last_search_state")
      if (raw) {
        const parsed = JSON.parse(raw)
        setQuery(parsed.query || "")
        setIndustry(parsed.industry || "all")
        setCategory(parsed.category || "all")
        setRadius(parsed.radius || 5)
        setResults(parsed.results || [])
        setSelectedAreas(parsed.selectedAreas || [])
        setViewMode(parsed.viewMode || "table")
        setSearched(parsed.searched || false)
        setHasAutoSearched(true) // skip auto-search since we loaded cached search
      } else {
        // Default to grid/card view on mobile screens
        if (typeof window !== "undefined" && window.innerWidth <= 768) {
          setViewMode("grid")
        }
      }
    } catch (e) {
      console.error("Failed to restore search state:", e)
    } finally {
      setIsRestored(true)
    }
  }, [])

  // Save search state to sessionStorage when results or search criteria change
  useEffect(() => {
    if (searched && isRestored) {
      const stateToSave = {
        query,
        industry,
        category,
        radius,
        results,
        selectedAreas,
        viewMode,
        searched,
      }
      sessionStorage.setItem("last_search_state", JSON.stringify(stateToSave))
    }
  }, [query, industry, category, radius, results, selectedAreas, viewMode, searched, isRestored])

  // Reset selected areas when the city changes
  useEffect(() => {
    // Only reset if we are fully hydrated/restored to prevent clearing restored areas on mount
    if (isRestored) {
      setSelectedAreas([])
    }
  }, [currentCity, isRestored])

  const handleToggleArea = (area: string) => {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  const handleSelectAllAreas = () => {
    setSelectedAreas(cityAreas)
  }

  const handleClearAllAreas = () => {
    setSelectedAreas([])
  }

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login")
    } else if (syncComplete && !onboardingComplete) {
      router.replace("/onboarding")
    }
  }, [isLoggedIn, syncComplete, onboardingComplete, router])

  // ─── AUTO-SEARCH on first load ─────────────────────────────────────────────
  // When user lands from onboarding, automatically search for their target
  // business types in their city — so they see relevant leads immediately.
  useEffect(() => {
    if (!isRestored || !sellerProfile || hasAutoSearched || !isLoggedIn || !onboardingComplete) return

    const city = sellerProfile.targetCity || "Hyderabad"
    const primaryTarget = sellerProfile.targetTypes?.[0] || ""
    const autoQuery = primaryTarget ? `${primaryTarget} in ${city}` : city

    setSelectedAreas([]) // Do not auto-select areas, user will select manually
    setQuery(autoQuery)
    setHasAutoSearched(true)

    // Small delay so the page renders first
    setTimeout(() => {
      runSearch(autoQuery, "all", "all", sellerProfile.sellerType, [])
    }, 400)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRestored, sellerProfile, isLoggedIn, onboardingComplete])

  const runSearch = async (q: string, ind: string, cat: string, sellerType: string, customAreas?: string[]) => {
    setLoading(true)
    setSearched(true)
    const areasToSearch = customAreas !== undefined ? customAreas : selectedAreas
    try {
      const params = new URLSearchParams({
        q,
        industry: ind,
        category: cat,
        radius: radius.toString(),
        sellerType,
        targetTypes: (sellerProfile?.targetTypes || []).join(","),
        city: currentCity,
        areas: areasToSearch.join(","),
      })
      const res = await fetch(`/api/search?${params}`)
      const data = await res.json()
      setResults(data.leads || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!query.trim() && industry === "all") return
    runSearch(query, industry, category, sellerProfile?.sellerType || "other")
  }



  const categories = industry !== "all" ? (CATEGORIES[industry]?.items || []) : []

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch()
  }

  // Filter & sort results
  const filteredResults = results
    .filter(l => {
      if (filterPriority !== "all" && l.priority !== filterPriority) return false
      if (filterPhone && !l.phone) return false
      if (filterNoWebsite && l.hasWebsite) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === "score") return b.score - a.score
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0)
      if (sortBy === "reviews") return (b.reviewCount || 0) - (a.reviewCount || 0)
      if (sortBy === "name") return a.name.localeCompare(b.name)
      return 0
    })

  const hotCount = filteredResults.filter(l => l.priority === "HOT").length
  const warmCount = filteredResults.filter(l => l.priority === "WARM").length
  const coldCount = filteredResults.filter(l => l.priority === "COLD").length

  const handleExportCSV = () => {
    if (!filteredResults.length) return
    const headers = ["Name", "Category", "Industry", "Phone", "Phone Confidence", "Email", "Address", "City", "State", "Has Website", "Website URL", "Rating", "Reviews", "Newly Opened", "Lead Score", "Priority", "Pitch Suggestion"]
    const rows = filteredResults.map(l => [
      l.name, l.category, l.industry, l.phone || "", l.phoneConfidence || "", "",
      l.address, l.city, l.state, l.hasWebsite ? "Yes" : "No", l.websiteUrl || "",
      l.rating || "", l.reviewCount || "", l.isNewlyOpened ? "Yes" : "No",
      l.score, l.priority, `"${l.pitch}"`
    ])
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `leadgen_${query || industry}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-wrapper">
      <div className="bg-glow" />
      <Navbar />

      <div className="container" style={{ flex: 1, padding: "24px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
        {/* Profile Banner */}
        {sellerProfile && (
          <div className="flex items-center gap-3" style={{ marginBottom: 20, padding: "10px 16px", background: "rgba(124,77,255,0.06)", border: "1px solid rgba(124,77,255,0.15)", borderRadius: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Scoring as: <strong style={{ color: "var(--accent-light)" }}>{sellerProfile.sellerLabel}</strong>
              <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>— leads are scored for your specific offer</span>
            </span>
            <a href="/settings" style={{ marginLeft: "auto", fontSize: 11, color: "var(--accent-light)" }}>Change profile →</a>
          </div>
        )}

        <div className="search-layout" style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          {/* Sidebar */}
          <div className="sidebar" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Search Form */}
            <div className="card">
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
                🔍 Search Leads
              </h2>

              {/* Query Input */}
              <div style={{ position: "relative", marginBottom: 12 }}>
                <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  id="search-query"
                  className="input"
                  placeholder='e.g. "schools in Kompally Hyderabad"'
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{ paddingLeft: 36 }}
                />
              </div>

              {/* Industry */}
              <label className="label">Industry</label>
              <select
                className="select"
                value={industry}
                onChange={e => { setIndustry(e.target.value); setCategory("all") }}
                style={{ marginBottom: 12 }}
              >
                <option value="all">All Industries</option>
                {Object.entries(CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.icon} {val.label}</option>
                ))}
              </select>

              {/* Category */}
              {categories.length > 0 && (
                <>
                  <label className="label">Category</label>
                  <select
                    className="select"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    style={{ marginBottom: 12 }}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </>
              )}

              {/* Target Areas */}
              {cityAreas.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label" style={{ marginBottom: 0 }}>Target Areas</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={handleSelectAllAreas}
                        style={{ fontSize: 10, color: "var(--accent-light)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        All
                      </button>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>|</span>
                      <button
                        onClick={handleClearAllAreas}
                        style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    maxHeight: 180,
                    overflowY: "auto",
                    padding: "8px",
                    background: "var(--bg-well)",
                    border: "1px solid var(--border)",
                    borderRadius: 8
                  }}>
                    {cityAreas.map(area => {
                      const isSelected = selectedAreas.includes(area)
                      return (
                        <div
                          key={area}
                          onClick={() => handleToggleArea(area)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "4px 8px",
                            borderRadius: 6,
                            cursor: "pointer",
                            background: isSelected ? "rgba(124,77,255,0.08)" : "transparent",
                            color: isSelected ? "var(--accent-light)" : "var(--text-secondary)",
                            fontSize: 12,
                            fontWeight: isSelected ? 600 : 400,
                            transition: "all 0.15s ease",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // toggled by parent div
                            style={{ cursor: "pointer", pointerEvents: "none" }}
                          />
                          <span>{area}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
                    {selectedAreas.length} of {cityAreas.length} areas selected. Generates leads in parallel!
                  </div>
                </div>
              )}

              {/* Radius */}
              <label className="label">Search Radius</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {RADIUS_OPTIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      border: `1px solid ${radius === r ? "var(--accent)" : "var(--border)"}`,
                      background: radius === r ? "rgba(124,77,255,0.15)" : "var(--bg-pill)",
                      color: radius === r ? "var(--accent-light)" : "var(--text-muted)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {r}km
                  </button>
                ))}
              </div>

              <button
                id="search-btn"
                className="btn btn-primary w-full"
                onClick={handleSearch}
                disabled={loading}
                style={{ justifyContent: "center" }}
              >
                {loading ? <><Loader2 size={14} className="spin" style={{ animation: "spin 0.8s linear infinite" }} /> Searching...</> : <><Search size={14} /> Search Leads</>}
              </button>
            </div>

            {/* Filters */}
            {searched && results.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-3" style={{ cursor: "pointer" }} onClick={() => setShowFilters(!showFilters)}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}><SlidersHorizontal size={12} style={{ display: "inline", marginRight: 6 }} />Filters</span>
                  <ChevronDown size={14} style={{ transform: showFilters ? "rotate(180deg)" : "none", transition: "0.2s" }} />
                </div>

                {showFilters && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Priority Filter */}
                    <div>
                      <label className="label">Priority</label>
                      <div style={{ display: "flex", gap: 6 }}>
                        {["all", "HOT", "WARM", "COLD"].map(p => (
                          <button
                            key={p}
                            onClick={() => setFilterPriority(p)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              border: `1px solid ${filterPriority === p ? "var(--accent)" : "var(--border)"}`,
                              background: filterPriority === p ? "rgba(124,77,255,0.15)" : "var(--bg-pill)",
                              color: p === "HOT" ? "var(--hot)" : p === "WARM" ? "var(--warm)" : p === "COLD" ? "var(--cold)" : "var(--text-secondary)",
                              cursor: "pointer",
                            }}
                          >
                            {p === "all" ? "All" : p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort */}
                    <div>
                      <label className="label">Sort By</label>
                      <select className="select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="score">Lead Score</option>
                        <option value="rating">Google Rating</option>
                        <option value="reviews">Review Count</option>
                        <option value="name">Name A-Z</option>
                      </select>
                    </div>

                    {/* Checkboxes */}
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <input type="checkbox" checked={filterPhone} onChange={e => setFilterPhone(e.target.checked)} />
                      <span style={{ fontSize: 12 }}>Has Phone Number</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <input type="checkbox" checked={filterNoWebsite} onChange={e => setFilterNoWebsite(e.target.checked)} />
                      <span style={{ fontSize: 12 }}>No Website</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Not searched yet */}
            {!searched && (
              <div className="empty-state" style={{ padding: "80px 32px" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Find Your Hot Leads</h3>
                <p style={{ color: "var(--text-secondary)", maxWidth: 400 }}>
                  Leads are scored specifically for your profile as
                  {sellerProfile ? (
                    <strong style={{ color: "var(--accent-light)" }}> {sellerProfile.sellerLabel}</strong>
                  ) : " your seller type"}.
                </p>

                {/* Personalized search chips from their seller type */}
                <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap", justifyContent: "center" }}>
                  {/* Use searchExamples if available, replacing with their city */}
                  {(sellerProfile?.searchExamples?.length
                    ? sellerProfile.searchExamples.map(ex =>
                        ex.replace(/Banjara Hills|Hyderabad|Pune|Bangalore|Rajasthan|Gachibowli|Koramangala|Mumbai|Nagpur|Secunderabad|Bangalore/gi,
                          sellerProfile.targetCity || "Hyderabad")
                      )
                    : sellerProfile?.targetTypes?.slice(0, 4).map(t => `${t} in ${sellerProfile?.targetCity || "Hyderabad"}`)
                  )?.map(suggestion => (
                    <button
                      key={suggestion}
                      className="tag"
                      onClick={() => {
                        setQuery(suggestion)
                        runSearch(suggestion, "all", "all", sellerProfile?.sellerType || "other")
                      }}
                      style={{ cursor: "pointer", padding: "6px 14px", fontSize: 12 }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card" style={{ height: 280 }}>
                    <div className="skeleton" style={{ height: 20, width: "40%", marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 16, width: "70%", marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 4, width: "100%", marginBottom: 16 }} />
                    <div className="skeleton" style={{ height: 12, width: "60%", marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 12, width: "80%", marginBottom: 24 }} />
                    <div className="skeleton" style={{ height: 56, width: "100%" }} />
                  </div>
                ))}
              </div>
            )}

            {/* Results */}
            {mounted && !loading && searched && (
              <>
                {/* Results Header */}
                <div className="flex items-center justify-between mb-4 search-results-header">
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700 }}>
                      {filteredResults.length} leads found
                      {query && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> for "{query}"</span>}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span style={{ fontSize: 12, color: "var(--hot)" }}>🔥 {hotCount} HOT</span>
                      <span style={{ fontSize: 12, color: "var(--warm)" }}>⭐ {warmCount} WARM</span>
                      <span style={{ fontSize: 12, color: "var(--cold)" }}>🧊 {coldCount} COLD</span>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {/* View mode toggle */}
                    <div style={{ display: "flex", background: "var(--bg-pill)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", marginRight: 4 }}>
                      <button
                        onClick={() => setViewMode("table")}
                        style={{
                          padding: "6px 12px",
                          border: "none",
                          background: viewMode === "table" ? "var(--table-header-bg)" : "transparent",
                          color: viewMode === "table" ? "var(--table-header-text)" : "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        Excel View
                      </button>
                      <button
                        onClick={() => setViewMode("grid")}
                        style={{
                          padding: "6px 12px",
                          border: "none",
                          background: viewMode === "grid" ? "rgba(124,77,255,0.2)" : "transparent",
                          color: viewMode === "grid" ? "var(--accent-light)" : "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        Grid View
                      </button>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleExportCSV}
                      disabled={!filteredResults.length}
                    >
                      <Download size={13} /> Export CSV
                    </button>
                  </div>
                </div>

                {filteredResults.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">😕</div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No results found</h3>
                    <p style={{ color: "var(--text-muted)" }}>Try a different query or remove some filters</p>
                  </div>
                ) : viewMode === "table" ? (
                  <div style={{ 
                    width: "100%", 
                    overflowX: "auto", 
                    border: "1px solid var(--border)", 
                    borderRadius: 12,
                    background: "var(--table-bg)",
                  }}>
                    <table style={{ 
                      width: "100%", 
                      minWidth: 1050,
                      borderCollapse: "collapse", 
                      fontSize: 13,
                      textAlign: "left",
                    }}>
                      <thead>
                        <tr style={{ 
                          background: "var(--table-header-bg)",
                          borderBottom: "2px solid var(--border)",
                        }}>
                          <th style={{ padding: "12px 16px", borderRight: "1px solid var(--border)", fontWeight: 700, color: "var(--table-header-text)" }}>Save</th>
                          <th style={{ padding: "12px 16px", borderRight: "1px solid var(--border)", fontWeight: 700, color: "var(--table-header-text)" }}>Score</th>
                          <th style={{ padding: "12px 16px", borderRight: "1px solid var(--border)", fontWeight: 700, color: "var(--table-header-text)" }}>Priority</th>
                          <th style={{ padding: "12px 16px", borderRight: "1px solid var(--border)", fontWeight: 700, color: "var(--table-header-text)" }}>Business Name</th>
                          <th style={{ padding: "12px 16px", borderRight: "1px solid var(--border)", fontWeight: 700, color: "var(--table-header-text)" }}>Category</th>
                          <th style={{ padding: "12px 16px", borderRight: "1px solid var(--border)", fontWeight: 700, color: "var(--table-header-text)" }}>Phone</th>
                          <th style={{ padding: "12px 16px", borderRight: "1px solid var(--border)", fontWeight: 700, color: "var(--table-header-text)" }}>Website</th>
                          <th style={{ padding: "12px 16px", borderRight: "1px solid var(--border)", fontWeight: 700, color: "var(--table-header-text)" }}>Rating</th>
                          <th style={{ padding: "12px 16px", borderRight: "1px solid var(--border)", fontWeight: 700, color: "var(--table-header-text)" }}>Reviews</th>
                          <th style={{ padding: "12px 16px", borderRight: "1px solid var(--border)", fontWeight: 700, color: "var(--table-header-text)" }}>Address</th>
                          <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--table-header-text)", textAlign: "center" }}>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResults.map((lead, idx) => {
                          const isSaved = isLeadSaved(lead.placeId)
                          const priorityColor = lead.priority === "HOT" ? "var(--hot)" : lead.priority === "WARM" ? "var(--warm)" : "var(--cold)"
                          return (
                            <tr 
                              key={lead.placeId} 
                              style={{ 
                                borderBottom: "1px solid var(--border)",
                                background: idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                                transition: "background 0.15s ease",
                              }}
                            >
                              {/* Save Bookmark */}
                              <td style={{ padding: "10px 16px", borderRight: "1px solid var(--border)", textAlign: "center" }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (isSaved) removeLead(lead.placeId)
                                    else saveLead(lead)
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: isSaved ? "var(--accent-light)" : "var(--text-muted)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                                </button>
                              </td>
                              {/* Lead Score */}
                              <td style={{ padding: "10px 16px", borderRight: "1px solid var(--border)", fontWeight: 800, color: priorityColor, fontFamily: "monospace" }}>
                                {lead.score}
                              </td>
                              {/* Priority */}
                              <td style={{ padding: "10px 16px", borderRight: "1px solid var(--border)" }}>
                                {lead.priority === "HOT"  && <span className="badge-hot" style={{ fontSize: 10, padding: "2px 6px" }}>🔥 HOT</span>}
                                {lead.priority === "WARM" && <span className="badge-warm" style={{ fontSize: 10, padding: "2px 6px" }}>⭐ WARM</span>}
                                {lead.priority === "COLD" && <span className="badge-cold" style={{ fontSize: 10, padding: "2px 6px" }}>🧊 COLD</span>}
                              </td>
                              {/* Business Name */}
                              <td style={{ padding: "10px 16px", borderRight: "1px solid var(--border)", fontWeight: 600, color: "var(--text-primary)" }}>
                                <Link href={`/leads/${lead.placeId}`} style={{ color: "inherit", textDecoration: "none" }}>
                                  {lead.name}
                                </Link>
                              </td>
                              {/* Category */}
                              <td style={{ padding: "10px 16px", borderRight: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                                {lead.category}
                              </td>
                              {/* Phone */}
                              <td style={{ padding: "10px 16px", borderRight: "1px solid var(--border)", fontFamily: "monospace", color: lead.phone ? "var(--success)" : "var(--text-muted)" }}>
                                {lead.phone || "—"}
                              </td>
                              {/* Website */}
                              <td style={{ padding: "10px 16px", borderRight: "1px solid var(--border)", color: lead.hasWebsite ? "var(--cold)" : "var(--hot)" }}>
                                {lead.hasWebsite ? (
                                  <a href={lead.websiteUrl || "#"} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    Visit <ExternalLink size={10} />
                                  </a>
                                ) : "No Website"}
                              </td>
                              {/* Google Rating */}
                              <td style={{ padding: "10px 16px", borderRight: "1px solid var(--border)", fontWeight: 600, color: "var(--warm)" }}>
                                {lead.rating ? `⭐ ${lead.rating}` : "—"}
                              </td>
                              {/* Reviews */}
                              <td style={{ padding: "10px 16px", borderRight: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                {lead.reviewCount !== null ? lead.reviewCount.toLocaleString() : "—"}
                              </td>
                              {/* Address */}
                              <td style={{ padding: "10px 16px", borderRight: "1px solid var(--border)", color: "var(--text-muted)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={lead.address}>
                                {lead.address}
                              </td>
                              {/* View details link */}
                              <td style={{ padding: "10px 16px", textAlign: "center" }}>
                                <Link href={`/leads/${lead.placeId}`} style={{ color: "var(--accent-light)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                  <ExternalLink size={14} />
                                </Link>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                    {filteredResults.map((lead, i) => (
                      <LeadCard key={lead.placeId} lead={lead} index={i} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
