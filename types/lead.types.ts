/**
 * @module types/lead.types
 * @description TypeScript types for leads, search results, and lead scoring.
 */

/** Raw business data returned from Google Places API */
export interface PlacesResult {
  id: string                    // Google Place ID
  displayName: { text: string }
  formattedAddress: string
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  rating?: number
  userRatingCount?: number
  websiteUri?: string
  regularOpeningHours?: object
  currentOpeningHours?: object
  businessStatus?: string
  location?: { latitude: number; longitude: number }
  types?: string[]
  primaryType?: string
  primaryTypeDisplayName?: { text: string }
  googleMapsUri?: string
  photos?: { name: string }[]
}

/** Normalised business object (after parsing Places API response) */
export interface Business {
  placeId: string
  name: string
  category: string
  industry: string
  phone: string | null
  phoneConfidence: "HIGH" | "MEDIUM" | "LOW" | null
  address: string
  city: string
  state: string
  lat: number | null
  lng: number | null
  hasWebsite: boolean
  websiteUrl: string | null
  rating: number | null
  reviewCount: number | null
  isNewlyOpened: boolean
  googleVerified: boolean
  distanceKm: number | null   // distance from search center
}

/** Lead score result from the scoring engine */
export interface LeadScore {
  score: number                 // 0–100
  priority: "HOT" | "WARM" | "COLD"
  reasons: string[]             // human-readable score reasons
  pitch: string                 // personalised pitch suggestion
}

/** A business + its score (shown to the user) */
export interface ScoredLead extends Business {
  score: number
  priority: "HOT" | "WARM" | "COLD"
  reasons: string[]
  pitch: string
}

/** Status of a saved lead in the user's CRM pipeline */
export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "INTERESTED"
  | "CONVERTED"
  | "NOT_INTERESTED"
