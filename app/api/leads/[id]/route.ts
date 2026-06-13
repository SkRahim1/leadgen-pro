import { NextRequest, NextResponse } from "next/server"
import { getScoredBusiness } from "@/lib/mock/data"
import { getPlaceDetails } from "@/lib/services/places.service"
import { calculateLeadScore } from "@/lib/services/scorer"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const sellerType = searchParams.get("sellerType") || "other"

    // 1. Try mock data first
    const mockLead = getScoredBusiness(id, sellerType)
    if (mockLead) {
      console.log(`[Lead Details API] Found mock lead for ID: ${id}`)
      return NextResponse.json({ lead: mockLead, source: "mock" })
    }

    // 2. If not in mock data and Places API key is set, fetch from Google Places API
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (apiKey) {
      console.log(`[Lead Details API] Fetching from Google Places for ID: ${id}`)
      try {
        const business = await getPlaceDetails(id)
        const { score, priority, reasons, pitch } = calculateLeadScore(business, sellerType)
        const scoredLead = { ...business, score, priority, reasons, pitch }
        return NextResponse.json({ lead: scoredLead, source: "google_places" })
      } catch (err) {
        console.error(`[Lead Details API] Google Places Details call failed for ID: ${id}`, err)
      }
    }

    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  } catch (error: any) {
    console.error("[Lead Details API] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
