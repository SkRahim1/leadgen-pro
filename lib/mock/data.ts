/**
 * @module lib/mock/data
 * @description Mock data container — cleared as requested.
 */

import { Business } from "@/types/lead.types"
import { calculateLeadScore } from "@/lib/services/scorer"
import { ScoredLead } from "@/types/lead.types"

// ─── Raw Business Data (Cleared) ──────────────────────────────────────────────
export const RAW_BUSINESSES: Business[] = []

/**
 * Searches businesses and scores them dynamically based on the seller's type.
 */
export function searchAndScoreBusinesses(
  sellerType: string,
  query?: string,
  industry?: string,
  category?: string,
  targetTypes?: string[],
): ScoredLead[] {
  let businesses = [...RAW_BUSINESSES]

  // Filter by industry
  if (industry && industry !== "all") {
    businesses = businesses.filter(b => b.industry === industry)
  }

  // Filter by category
  if (category && category !== "all") {
    const cat = category.toLowerCase()
    businesses = businesses.filter(b =>
      b.category.toLowerCase().includes(cat) ||
      b.name.toLowerCase().includes(cat)
    )
  }

  // Filter by text query (name, city, address, category)
  if (query && query.trim()) {
    const q = query.toLowerCase()
    businesses = businesses.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    )
  }

  // If targetTypes provided and results still include everything,
  // boost: put target-type businesses first (don't exclude, just sort them up)
  if (targetTypes?.length && businesses.length > 0) {
    const lowerTargets = targetTypes.map(t => t.toLowerCase())
    const isTarget = (b: Business) =>
      lowerTargets.some(t =>
        b.category.toLowerCase().includes(t) ||
        t.includes(b.category.toLowerCase())
      )
    const targeted = businesses.filter(isTarget)
    const others = businesses.filter(b => !isTarget(b))
    businesses = [...targeted, ...others]
  }

  // Score each business dynamically for this seller type
  const scored: ScoredLead[] = businesses.map(b => {
    const { score, priority, reasons, pitch } = calculateLeadScore(b, sellerType)
    return { ...b, score, priority, reasons, pitch }
  })

  // Sort by score descending (HOT leads first)
  return scored.sort((a, b) => b.score - a.score)
}

/** Get a single business scored for a given seller type */
export function getScoredBusiness(placeId: string, sellerType: string): ScoredLead | undefined {
  const business = RAW_BUSINESSES.find(b => b.placeId === placeId)
  if (!business) return undefined
  const { score, priority, reasons, pitch } = calculateLeadScore(business, sellerType)
  return { ...business, score, priority, reasons, pitch }
}
