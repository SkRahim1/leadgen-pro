import { NextRequest, NextResponse } from "next/server"
import { searchAndScoreBusinesses } from "@/lib/mock/data"
import { searchPlacesByText } from "@/lib/services/places.service"
import { calculateLeadScore } from "@/lib/services/scorer"
import { getCachedSearch, setCachedSearch } from "@/lib/services/cache.service"

/**
 * @route GET /api/search
 * @description Search endpoint — dynamically scores leads based on seller type.
 *
 * If GOOGLE_PLACES_API_KEY is configured in the environment:
 *   Calls the live Google Places API (New) Text Search endpoint and scores results.
 *   If specific areas/neighborhoods are passed, it searches them in parallel and merges results.
 * If not configured:
 *   Falls back to local mock business database.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""
  const industry = searchParams.get("industry") || "all"
  const category = searchParams.get("category") || "all"
  const radius = parseInt(searchParams.get("radius") || "5")
  const sellerType = searchParams.get("sellerType") || "other"
  const targetTypesRaw = searchParams.get("targetTypes") || ""
  const targetTypes = targetTypesRaw ? targetTypesRaw.split(",").filter(Boolean) : undefined
  const city = searchParams.get("city") || ""
  const areasRaw = searchParams.get("areas") || ""
  const areas = areasRaw ? areasRaw.split(",").filter(Boolean) : []

  const provider = (searchParams.get("searchProvider") || "osm") as "google" | "osm"
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (provider === "osm" || apiKey) {
    try {
      // 1. Construct base query for Google Places / OSM
      let searchQuery = q.trim()

      if (!searchQuery) {
        if (category && category !== "all") {
          searchQuery = category
        } else if (industry && industry !== "all") {
          searchQuery = industry
        } else if (targetTypes && targetTypes.length > 0) {
          searchQuery = targetTypes[0]
        } else {
          searchQuery = "businesses"
        }
      }

      // Strip "in [city]" from query if doing an area-specific search,
      // so we don't end up with e.g. "Schools in Hyderabad in Gachibowli, Hyderabad"
      if (city && areas.length > 0 && searchQuery.toLowerCase().endsWith(` in ${city.toLowerCase()}`)) {
        searchQuery = searchQuery.slice(0, searchQuery.length - ` in ${city}`.length).trim()
      }

      // Check cache first (partitioned by search provider)
      const cacheKey = `${searchQuery}|${city}|${areas.sort().join(",")}|${provider}`.toLowerCase()
      const cached = getCachedSearch(cacheKey)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let uniqueBusinesses: any[] = []

      if (cached) {
        uniqueBusinesses = cached
      } else {
        const seenPlaceIds = new Set<string>()

        // 2. Fetch from Google Places API or OpenStreetMap Crawler
        if (areas.length > 0) {
          console.log(`[Search API] Routing to Multi-Area Search (${provider}) for: "${searchQuery}" in areas: [${areas.join(", ")}] of ${city}`)

          // Fetch up to 30 results per area in parallel to compile a comprehensive list
          const searchPromises = areas.map(async (area) => {
            const areaQuery = `${searchQuery} in ${area}, ${city}`
            try {
              console.log(`[Search API] Fetching from ${provider} for area query: "${areaQuery}"`)
              const res = await searchPlacesByText(areaQuery, 30, provider)
              return res.businesses
            } catch (e) {
              console.error(`[Search API] Fetching failed for area "${areaQuery}":`, e)
              return []
            }
          })

          const resultsArray = await Promise.all(searchPromises)
          for (const list of resultsArray) {
            for (const b of list) {
              if (!seenPlaceIds.has(b.placeId)) {
                seenPlaceIds.add(b.placeId)
                uniqueBusinesses.push(b)
              }
            }
          }
        } else {
          // Fallback to normal city-level search
          let cityQuery = searchQuery
          if (city && !searchQuery.toLowerCase().includes(city.toLowerCase())) {
            cityQuery = `${searchQuery} in ${city}`
          }
          console.log(`[Search API] Fetching from ${provider} for city query: "${cityQuery}"`)
          const res = await searchPlacesByText(cityQuery, 60, provider)
          uniqueBusinesses = res.businesses
        }

        // Save to cache
        if (uniqueBusinesses.length > 0) {
          setCachedSearch(cacheKey, uniqueBusinesses)
        }
      }

      // 3. Score and prioritize leads dynamically
      const leads = uniqueBusinesses.map(b => {
        const { score, priority, reasons, pitch } = calculateLeadScore(b, sellerType)
        return { ...b, score, priority, reasons, pitch }
      })

      // 4. Sort by score descending (HOT leads first)
      const sortedLeads = leads.sort((a, b) => b.score - a.score)

      return NextResponse.json({
        leads: sortedLeads,
        count: sortedLeads.length,
        query: searchQuery,
        industry,
        category,
        radius,
        sellerType,
        mode: "live",
      })
    } catch (error: any) {
      console.error(`[Search API] Live Search API (${provider}) failed, falling back to mock data:`, error)
    }
  }

  // Fallback to Mock Data (Demo mode)
  console.log(`[Search API] Using Mock Data (Demo Mode) for query: "${q}"`)

  // Simulate realistic network delay
  await new Promise(r => setTimeout(r, 800))

  let leads = searchAndScoreBusinesses(
    sellerType,
    q,
    industry !== "all" ? industry : undefined,
    category !== "all" ? category : undefined,
    targetTypes,
  )

  // Filter mock leads by selected areas if provided
  if (areas.length > 0) {
    const lowerAreas = areas.map(a => a.toLowerCase())
    leads = leads.filter(l =>
      lowerAreas.some(area => l.address.toLowerCase().includes(area))
    )
  }

  return NextResponse.json({
    leads,
    count: leads.length,
    query: q,
    industry,
    category,
    radius,
    sellerType,
    mode: "demo",
  })
}
