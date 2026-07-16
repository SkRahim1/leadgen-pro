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
import axios from "axios"
import { findBusinessInCache } from "./cache.service"

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

// ─── OSM Crawler Fallback Service ──────────────────────────────────────────────

function getDeterministicMockData(placeId: string, name: string) {
  let hash = 0
  for (let i = 0; i < placeId.length; i++) {
    hash = (hash << 5) - hash + placeId.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  const absHash = Math.abs(hash)

  // 1. Phone number (66% probability)
  const hasPhone = (absHash % 3) !== 0
  let phone: string | null = null
  let phoneConfidence: "HIGH" | "MEDIUM" | "LOW" | null = null
  if (hasPhone) {
    if (absHash % 2 === 0) {
      // Landline: 040-XXXXXXXX (8 digits)
      const randomDigits = 10000000 + (absHash % 90000000)
      phone = `040-${randomDigits}`
      phoneConfidence = "MEDIUM"
    } else {
      // Mobile: 919XXXXXXXXX (10-digit mobile starting with 9, i.e., 919 + 9 digits)
      const randomDigits = 100000000 + (absHash % 900000000)
      phone = `919${randomDigits}`
      phoneConfidence = "HIGH"
    }
  }

  // 2. Website (50% probability)
  const hasWebsite = (absHash % 2) === 0
  const websiteUrl = hasWebsite ? `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.in` : null

  // 3. Rating & reviews
  const rating = parseFloat((3.5 + (absHash % 15) / 10).toFixed(1))
  const reviewCount = (absHash % 150) + 1

  return { phone, phoneConfidence, hasWebsite, websiteUrl, rating, reviewCount }
}

function extractOSMContactInfo(place: any) {
  const tags = place.extratags || {};
  
  // Extract phone (check common phone tags in OSM)
  let phone = tags.phone || tags['contact:phone'] || tags.telephone || tags.mobile || tags['contact:mobile'] || null;
  if (phone) {
    phone = phone.trim();
  }
  
  // Extract website (check common website tags in OSM)
  let websiteUrl = tags.website || tags['contact:website'] || tags.url || null;
  if (websiteUrl) {
    websiteUrl = websiteUrl.trim();
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = `https://${websiteUrl}`;
    }
  }
  
  const phoneConfidence = phone ? "HIGH" : null;
  const hasWebsite = !!websiteUrl;
  
  return {
    phone,
    phoneConfidence,
    hasWebsite,
    websiteUrl,
    rating: null,
    reviewCount: 0,
    isNewlyOpened: false,
    googleVerified: false,
  };
}

async function searchOSMPlaces(query: string, maxResults = 60): Promise<PlacesSearchResult> {
  try {
    console.log(`[OSM Search Scraper] Fetching live listings for: "${query}"`);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&extratags=1&limit=${maxResults}`;
    
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "RenvixLeadGenPro/1.0 (srahim786@gmail.com)"
      }
    });

    const data = response.data;
    if (!Array.isArray(data)) {
      throw new Error("Invalid OSM API response format");
    }

    const businesses = data.map((place: any, index: number) => {
      const name = place.name || (place.display_name ? place.display_name.split(",")[0] : `Business ${index + 1}`);
      const osmType = place.type || "";
      const { category, industry } = getCategoryFromTypes(osmType, [place.class || ""]);

      const addr = place.display_name || "";
      const city = place.address?.city || place.address?.town || place.address?.city_district || place.address?.suburb || "Hyderabad";
      const state = place.address?.state || "Telangana";

      const placeId = `osm_${place.place_id || index}`;
      const contact = extractOSMContactInfo(place);

      return {
        placeId,
        name,
        category,
        industry,
        phone: contact.phone,
        phoneConfidence: contact.phoneConfidence,
        address: addr,
        city,
        state,
        lat: parseFloat(place.lat) || 0,
        lng: parseFloat(place.lon) || 0,
        hasWebsite: contact.hasWebsite,
        websiteUrl: contact.websiteUrl,
        rating: contact.rating,
        reviewCount: contact.reviewCount,
        isNewlyOpened: contact.isNewlyOpened,
        googleVerified: contact.googleVerified,
        distanceKm: 0,
      } as Business;
    });

    return {
      businesses,
      totalFetched: businesses.length,
      source: "google_places",
    };
  } catch (error) {
    console.error("[OSM Search Scraper] Failed:", error);
    return {
      businesses: [],
      totalFetched: 0,
      source: "google_places",
    };
  }
}

async function getOSMPlaceDetails(placeId: string): Promise<Business> {
  const numericId = placeId.replace("osm_", "");
  try {
    console.log(`[OSM Details Scraper] Fetching details for place ID: ${numericId}`);
    const url = `https://nominatim.openstreetmap.org/details?place_id=${numericId}&format=json&addressdetails=1`;
    
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "RenvixLeadGenPro/1.0 (srahim786@gmail.com)"
      }
    });

    const data = response.data;
    const name = data.names?.name || data.names?.official_name || data.localname || "Unknown Business";
    const osmType = data.type || "";
    const { category, industry } = getCategoryFromTypes(osmType, [data.class || ""]);

    // Find city and state in address hierarchy array
    let city = "Hyderabad";
    let state = "Telangana";
    if (Array.isArray(data.address)) {
      const cityObj = data.address.find((a: any) => 
        a.type === "city" || a.type === "town" || a.type === "suburb" || a.type === "city_district" || a.admin_level === 6 || a.admin_level === 9
      );
      if (cityObj) city = cityObj.localname;

      const stateObj = data.address.find((a: any) => 
        a.type === "state" || a.admin_level === 4
      );
      if (stateObj) state = stateObj.localname;
    }

    const postcode = data.calculated_postcode || "";
    const addr = data.display_name || `${name}, ${city}, ${state} ${postcode}, India`.trim();

    const contact = extractOSMContactInfo(data);

    return {
      placeId,
      name,
      category,
      industry,
      phone: contact.phone,
      phoneConfidence: contact.phoneConfidence,
      address: addr,
      city,
      state,
      lat: parseFloat(data.centroid?.coordinates?.[1]) || 0,
      lng: parseFloat(data.centroid?.coordinates?.[0]) || 0,
      hasWebsite: contact.hasWebsite,
      websiteUrl: contact.websiteUrl,
      rating: contact.rating,
      reviewCount: contact.reviewCount,
      isNewlyOpened: contact.isNewlyOpened,
      googleVerified: contact.googleVerified,
      distanceKm: 0,
    } as Business;
  } catch (error) {
    console.error("[OSM Details Scraper] Failed:", error);
    return {
      placeId,
      name: `Local Business (${numericId})`,
      category: "Business",
      industry: "industrial",
      phone: null,
      phoneConfidence: null,
      address: "India",
      city: "Hyderabad",
      state: "Telangana",
      lat: 0,
      lng: 0,
      hasWebsite: false,
      websiteUrl: null,
      rating: null,
      reviewCount: 0,
      isNewlyOpened: false,
      googleVerified: false,
      distanceKm: 0,
    } as Business;
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
 * Falls back to OpenStreetMap scraper if Google API fails or if provider is OSM.
 */
export async function searchPlacesByText(
  query: string,
  maxResults = 60,
  provider?: "google" | "osm"
): Promise<PlacesSearchResult> {
  if (provider === "osm") {
    return searchOSMPlaces(query, maxResults)
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    console.warn("[Places API] GOOGLE_PLACES_API_KEY is not set. Falling back to OpenStreetMap scraper.");
    return searchOSMPlaces(query, maxResults)
  }

  try {
    const allBusinesses: Business[] = []
    let pageToken: string | undefined = undefined
    let pagesFetched = 0
    const maxPages = Math.ceil(maxResults / 20)

    do {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requestBody: any = {
        textQuery: query,
        maxResultCount: 20,
        languageCode: "en",
        regionCode: "IN",
      }

      if (pageToken) {
        requestBody.pageToken = pageToken
      }

      const response = await axios.post(PLACES_TEXT_SEARCH_URL, requestBody, {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        }
      })

      const data = response.data

      if (data.error) {
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
  } catch (error) {
    console.warn("[Places API] Google Places search failed. Falling back to OpenStreetMap scraper fallback.", error)
    return searchOSMPlaces(query, maxResults)
  }
}

/**
 * Fetch a single place's details by Place ID.
 * Falls back to OpenStreetMap details scraper if Google API fails, provider is OSM, or if ID belongs to OSM.
 */
export async function getPlaceDetails(placeId: string, provider?: "google" | "osm"): Promise<Business> {
  // Try to find the details in search cache first to ensure consistency and speed
  try {
    const cached = findBusinessInCache(placeId)
    if (cached) {
      console.log(`[Places Service] Resolved details from cache for ID: ${placeId}`)
      return cached
    }
  } catch (err) {
    console.warn("[Places Service] Search cache read failed for details:", err)
  }

  if (provider === "osm" || placeId.startsWith("osm_")) {
    return getOSMPlaceDetails(placeId)
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    return getOSMPlaceDetails(placeId)
  }

  // Details FieldMask
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

  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}`

    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": detailsFieldMask,
      }
    })

    const place = response.data

    if (place && place.error) {
      throw new Error(`Places Details API error: ${place.error.message}`)
    }

    return parsePlaceToBusiness(place)
  } catch (error) {
    console.warn(`[Places API] Google Place details failed for ID ${placeId}. Falling back to OpenStreetMap details.`, error)
    return getOSMPlaceDetails(placeId)
  }
}

