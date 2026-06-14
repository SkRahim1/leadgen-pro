/**
 * @module lib/services/places.service
 * @description Real Google Places API (New) integration.
 *
 * Uses the Places API (New) Text Search endpoint:
 *   POST https://places.googleapis.com/v1/places:searchText
 *
 * Free tier: $200 credit/month ≈ 5,714 Text Search calls/month (Advanced SKU)
 * Field masking is used to minimize billed fields — stays in Advanced tier ($0.035/call).
 *
 * Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
 */

import { Business } from "@/types/lead.types"

// ─── Constants ────────────────────────────────────────────────────────────────

const PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"

/**
 * Field mask controls EXACTLY which fields are returned and billed.
 * Only request what you need — every extra field costs more API units.
 *
 * Billed per field group:
 *   Basic (free tier ok): id, displayName, formattedAddress, location, types
 *   Advanced (slightly more): nationalPhoneNumber, rating, userRatingCount, websiteUri, businessStatus
 */
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.businessStatus",
  "places.location",
  "places.primaryType",
  "places.types",
  "places.googleMapsUri",
].join(",")

// ─── Google Place Type → Our Category Mapping ─────────────────────────────────

const TYPE_TO_CATEGORY: Record<string, { category: string; industry: string }> = {
  // Fitness
  gym:                   { category: "Gym", industry: "fitness" },
  yoga_studio:           { category: "Yoga Studio", industry: "fitness" },
  fitness_center:        { category: "Fitness Center", industry: "fitness" },
  beauty_salon:          { category: "Beauty Salon", industry: "fitness" },
  hair_salon:            { category: "Hair Salon", industry: "fitness" },
  spa:                   { category: "Spa", industry: "fitness" },
  nail_salon:            { category: "Nail Studio", industry: "fitness" },

  // Food & Hospitality
  restaurant:            { category: "Restaurant", industry: "food" },
  cafe:                  { category: "Cafe", industry: "food" },
  bakery:                { category: "Bakery", industry: "food" },
  bar:                   { category: "Bar & Restaurant", industry: "food" },
  lodging:               { category: "Hotel", industry: "food" },
  hotel:                 { category: "Hotel", industry: "food" },
  meal_delivery:         { category: "Cloud Kitchen", industry: "food" },
  meal_takeaway:         { category: "Food Outlet", industry: "food" },
  fast_food_restaurant:  { category: "Fast Food Outlet", industry: "food" },
  ice_cream_shop:        { category: "Ice Cream Shop", industry: "food" },
  food:                  { category: "Restaurant", industry: "food" },

  // Healthcare
  hospital:              { category: "Hospital", industry: "healthcare" },
  doctor:                { category: "Clinic", industry: "healthcare" },
  dentist:               { category: "Dental Clinic", industry: "healthcare" },
  pharmacy:              { category: "Pharmacy", industry: "healthcare" },
  physiotherapist:       { category: "Physiotherapy Center", industry: "healthcare" },
  health:                { category: "Health Center", industry: "healthcare" },
  veterinary_care:       { category: "Veterinary Clinic", industry: "healthcare" },
  medical_lab:           { category: "Diagnostic Lab", industry: "healthcare" },

  // Education
  school:                { category: "School", industry: "education" },
  university:            { category: "College", industry: "education" },
  primary_school:        { category: "School", industry: "education" },
  secondary_school:      { category: "School", industry: "education" },
  preschool:             { category: "Playschool", industry: "education" },
  tutoring_center:       { category: "Coaching Center", industry: "education" },

  // Financial
  bank:                  { category: "Bank", industry: "financial" },
  insurance_agency:      { category: "Insurance Agency", industry: "financial" },
  accounting:            { category: "CA / Accountant", industry: "financial" },
  lawyer:                { category: "Law Firm", industry: "financial" },
  finance:               { category: "Financial Services", industry: "financial" },
  atm:                   { category: "ATM", industry: "financial" },

  // Real Estate
  real_estate_agency:    { category: "Real Estate Agency", industry: "realestate" },

  // Transport
  car_repair:            { category: "Auto Workshop", industry: "transport" },
  car_dealer:            { category: "Vehicle Dealer", industry: "transport" },
  moving_company:        { category: "Moving Company", industry: "transport" },
  travel_agency:         { category: "Travel Agency", industry: "transport" },
  gas_station:           { category: "Petrol Station", industry: "transport" },

  // Industrial / Retail
  store:                 { category: "Retail Shop", industry: "industrial" },
  shopping_mall:         { category: "Shopping Mall", industry: "industrial" },
  supermarket:           { category: "Supermarket", industry: "food" },
  electronics_store:     { category: "Electronics Shop", industry: "industrial" },
  clothing_store:        { category: "Clothing Store", industry: "industrial" },
  hardware_store:        { category: "Hardware Store", industry: "industrial" },

  // Default fallback
  establishment:         { category: "Business", industry: "industrial" },
  point_of_interest:     { category: "Business", industry: "industrial" },
}

function getCategoryFromTypes(
  primaryType: string | undefined,
  types: string[] | undefined
): { category: string; industry: string } {
  // Try primaryType first (most accurate)
  if (primaryType && TYPE_TO_CATEGORY[primaryType]) {
    return TYPE_TO_CATEGORY[primaryType]
  }
  // Fall back through the types array
  for (const type of types || []) {
    if (TYPE_TO_CATEGORY[type]) return TYPE_TO_CATEGORY[type]
  }
  return { category: "Business", industry: "industrial" }
}

// ─── Address Parser ────────────────────────────────────────────────────────────

function parseCityState(address: string): { city: string; state: string } {
  // Indian address format: "Building, Area, City, State PinCode, India"
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean)

  if (parts.length >= 4) {
    // Last part = "India", second-to-last = "State PinCode", third-to-last = "City"
    const rawState = parts[parts.length - 2] // "Telangana 500014"
    const city = parts[parts.length - 3]     // "Hyderabad"
    const state = rawState.replace(/\d+/g, "").trim() // Remove pincode digits
    return { city, state }
  }
  if (parts.length === 3) {
    return { city: parts[0], state: parts[1].replace(/\d+/g, "").trim() }
  }
  return { city: parts[0] || "Unknown", state: "India" }
}

// ─── New/Established Detection ────────────────────────────────────────────────

/**
 * Approximate "newly opened" detection using review count.
 * Google Places API (New) doesn't have an "openedDate" field.
 * Businesses with < 10 reviews are almost certainly newly opened (< 6 months).
 */
function isNewlyOpened(userRatingCount: number | undefined): boolean {
  return (userRatingCount ?? 0) < 10
}

// ─── Raw Place → Business Shape ───────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePlaceToBusiness(place: any): Business {
  const { city, state } = parseCityState(place.formattedAddress || "")
  const { category, industry } = getCategoryFromTypes(place.primaryType, place.types)

  const reviewCount: number = place.userRatingCount ?? 0
  const hasWebsite = !!place.websiteUri

  return {
    placeId: place.id || `place_${Math.random().toString(36).slice(2)}`,
    name: place.displayName?.text || "Unknown Business",
    category,
    industry,

    // Contact
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
    phoneConfidence: place.nationalPhoneNumber ? "HIGH" : place.internationalPhoneNumber ? "MEDIUM" : null,

    // Address
    address: place.formattedAddress || "",
    city,
    state,
    lat: place.location?.latitude ?? 0,
    lng: place.location?.longitude ?? 0,

    // Digital presence
    hasWebsite,
    websiteUrl: place.websiteUri || null,

    // Signals
    rating: place.rating ?? null,
    reviewCount,
    isNewlyOpened: isNewlyOpened(reviewCount),
    googleVerified: place.businessStatus === "OPERATIONAL" && reviewCount > 5,

    distanceKm: 0, // computed from lat/lng if needed later
  }
}

// ─── Main Search Function ─────────────────────────────────────────────────────

export interface PlacesSearchResult {
  businesses: Business[]
  totalFetched: number
  source: "google_places"
}

/**
 * Search businesses using Google Places API (New) Text Search.
 *
 * @param query - Natural language query e.g. "gyms in Hyderabad" or "new restaurants in Pune"
 * @param maxResults - Number of results (max 20 per request, max 60 with pagination)
 */
export async function searchPlacesByText(
  query: string,
  maxResults = 60
): Promise<PlacesSearchResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is not set in environment variables")
  }

  const allBusinesses: Business[] = []
  let pageToken: string | undefined = undefined
  let pagesFetched = 0
  const maxPages = Math.ceil(maxResults / 20) // e.g. 3 pages for 60 results

  let response: Response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any

  do {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestBody: any = {
      textQuery: query,
      maxResultCount: 20, // API max is 20 per page
      languageCode: "en",
      regionCode: "IN",   // Bias results toward India
    }

    if (pageToken) {
      requestBody.pageToken = pageToken
    }

    response = await fetch(PLACES_TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(requestBody),
      // Next.js caching: cache the first page. Subsequent pages shouldn't bypass but are usually dynamic.
      next: pageToken ? undefined : { revalidate: 3600 },
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("[Places API] Error:", response.status, errText)
      throw new Error(`Places API returned ${response.status}: ${errText}`)
    }

    data = await response.json()

    // Google returns error in the body too sometimes
    if (data.error) {
      console.error("[Places API] API Error:", data.error)
      throw new Error(`Places API error: ${data.error.message}`)
    }

    const places = data.places || []
    const pageBusinesses = places.map(parsePlaceToBusiness)
    allBusinesses.push(...pageBusinesses)

    pageToken = data.nextPageToken
    pagesFetched++
  } while (pageToken && allBusinesses.length < maxResults && pagesFetched < maxPages)

  console.log(`[Places API] Query: "${query}" → Total ${allBusinesses.length} results from ${pagesFetched} pages`)

  return {
    businesses: allBusinesses,
    totalFetched: allBusinesses.length,
    source: "google_places",
  }
}

/**
 * Fetch a single place's details by Place ID.
 *
 * @param placeId - Google Place ID
 */
export async function getPlaceDetails(placeId: string): Promise<Business> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is not set in environment variables")
  }

  // For place details, FieldMask elements do not have "places." prefix
  const detailsFieldMask = [
    "id",
    "displayName",
    "formattedAddress",
    "nationalPhoneNumber",
    "internationalPhoneNumber",
    "rating",
    "userRatingCount",
    "websiteUri",
    "businessStatus",
    "location",
    "primaryType",
    "types",
    "googleMapsUri",
  ].join(",")

  const url = `https://places.googleapis.com/v1/places/${placeId}`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": detailsFieldMask,
    },
    // Next.js caching: cache for 24 hours
    next: { revalidate: 86400 },
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error("[Places Details API] Error:", response.status, errText)
    throw new Error(`Places Details API returned ${response.status}: ${errText}`)
  }

  const place = await response.json()

  if (place.error) {
    console.error("[Places Details API] API Error:", place.error)
    throw new Error(`Places Details API error: ${place.error.message}`)
  }

  return parsePlaceToBusiness(place)
}

