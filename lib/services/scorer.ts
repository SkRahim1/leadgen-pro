/**
 * @module lib/services/scorer
 * @description Dynamic lead scoring engine.
 *
 * The SAME business gets a DIFFERENT score + pitch depending on the seller's profile.
 * This is the core differentiator of LeadGen Pro.
 *
 * A newly opened gym:
 *   → Developer scores it LOW (gym might not need a website urgently)
 *   → Gym Equipment Supplier scores it HOT (they need treadmills NOW)
 *   → CA scores it HOT (newly opened business needs GST registration)
 *   → Insurance Agent scores it HOT (new business needs fire + employee insurance)
 */

import { Business, LeadScore } from "@/types/lead.types"

// ─── Scoring Weights Per Seller Type ──────────────────────────────────────────
// Each number is how many points that signal adds to the score for that seller.
// Weights should add up to ~100 across the signals that matter for that seller.

const SCORING_WEIGHTS: Record<string, Record<string, number>> = {

  // ─── DIGITAL & TECH ──────────────────────────────────────────────────────────
  developer: {
    noWebsite: 40,       // Core need: businesses with no website = prime target
    notMobileFriendly: 20,
    noSocialMedia: 15,   // Also signals weak digital presence
    lowReviews: 10,
    notVerified: 10,
    phoneAvailable: 5,
    newlyOpened: 0,      // New businesses often don't have budget yet
    manyEmployees: 0,
    lowRating: 0,
  },
  agency: {
    noWebsite: 35,
    noSocialMedia: 30,   // Core: businesses with no social = marketing agency prospect
    notMobileFriendly: 15,
    lowReviews: 10,
    notVerified: 10,
    phoneAvailable: 0,
    newlyOpened: 10,
    manyEmployees: 0,
    lowRating: 0,
  },
  erpSoftware: {
    manyEmployees: 40,   // Need staff using the system
    newlyOpened: 20,
    phoneAvailable: 20,
    lowReviews: 10,
    notVerified: 10,
    noWebsite: 0,
    noSocialMedia: 0,
    lowRating: 0,
  },

  // ─── FINANCIAL SERVICES ───────────────────────────────────────────────────────
  insurance: {
    newlyOpened: 25,     // New businesses need insurance from day 1
    manyEmployees: 30,   // More employees = bigger group health/fire policy
    phoneAvailable: 20,
    lowReviews: 10,
    notVerified: 10,
    noWebsite: 5,
    noSocialMedia: 0,
    lowRating: 0,
  },
  loanDSA: {
    newlyOpened: 30,     // New businesses need working capital
    manyEmployees: 25,
    phoneAvailable: 25,
    lowReviews: 10,
    notVerified: 10,
    noWebsite: 0,
    noSocialMedia: 0,
    lowRating: 0,
  },
  ca: {
    newlyOpened: 35,     // NEW businesses must register GST, TDS, PF etc. from day 1
    lowReviews: 20,      // Small/new businesses likely have no CA yet
    notVerified: 20,     // Unverified = probably not professionally managed
    phoneAvailable: 15,
    noWebsite: 10,       // Minor signal (CAs don't care about websites)
    noSocialMedia: 0,    // Irrelevant for CA
    manyEmployees: 0,    // Large companies already have CAs
    lowRating: 0,
  },
  gst: {
    newlyOpened: 40,     // GST registration is needed immediately when a business opens
    notVerified: 25,
    lowReviews: 15,
    phoneAvailable: 15,
    noWebsite: 5,
    noSocialMedia: 0,
    manyEmployees: 0,
    lowRating: 0,
  },

  // ─── REAL ESTATE & CONSTRUCTION ─────────────────────────────────────────────
  realestate: {
    newlyOpened: 30,
    manyEmployees: 20,   // Growing company may need bigger office
    phoneAvailable: 20,
    lowReviews: 10,
    notVerified: 10,
    noWebsite: 10,
    noSocialMedia: 0,
    lowRating: 0,
  },
  interior: {
    newlyOpened: 40,     // Just opened = needs interior done NOW
    noWebsite: 20,
    lowReviews: 15,
    phoneAvailable: 15,
    notVerified: 10,
    noSocialMedia: 0,
    manyEmployees: 0,
    lowRating: 0,
  },
  solar: {
    newlyOpened: 30,
    manyEmployees: 20,
    phoneAvailable: 20,
    lowReviews: 15,
    notVerified: 15,
    noWebsite: 0,
    noSocialMedia: 0,
    lowRating: 0,
  },

  // ─── HEALTHCARE ───────────────────────────────────────────────────────────────
  medicalEquipment: {
    newlyOpened: 40,     // New clinic = hasn't bought equipment yet
    lowReviews: 20,
    phoneAvailable: 20,
    notVerified: 10,
    noWebsite: 10,
    noSocialMedia: 0,
    manyEmployees: 0,
    lowRating: 0,
  },
  pharma: {
    newlyOpened: 30,
    lowReviews: 25,      // New/small clinic = hasn't chosen pharma rep yet
    phoneAvailable: 25,
    notVerified: 10,
    noWebsite: 10,
    noSocialMedia: 0,
    manyEmployees: 0,
    lowRating: 0,
  },

  // ─── EDUCATION ────────────────────────────────────────────────────────────────
  schoolERP: {
    noWebsite: 25,
    newlyOpened: 25,
    lowReviews: 20,
    notVerified: 15,
    phoneAvailable: 15,
    noSocialMedia: 0,
    manyEmployees: 0,
    lowRating: 0,
  },
  trainer: {
    manyEmployees: 40,
    newlyOpened: 25,
    lowReviews: 15,
    phoneAvailable: 15,
    notVerified: 5,
    noWebsite: 0,
    noSocialMedia: 0,
    lowRating: 0,
  },

  // ─── FOOD & HOSPITALITY ───────────────────────────────────────────────────────
  foodSupplier: {
    newlyOpened: 40,     // New restaurant = hasn't locked in a supplier yet
    lowReviews: 20,
    phoneAvailable: 20,
    notVerified: 10,
    noWebsite: 10,
    noSocialMedia: 0,
    manyEmployees: 0,
    lowRating: 0,
  },
  restaurantPOS: {
    noWebsite: 20,
    newlyOpened: 30,
    lowReviews: 20,
    phoneAvailable: 20,
    notVerified: 10,
    noSocialMedia: 0,
    manyEmployees: 0,
    lowRating: 0,
  },

  // ─── FITNESS & WELLNESS ───────────────────────────────────────────────────────
  gymEquipment: {
    newlyOpened: 40,     // NEW gym = hasn't bought equipment yet (window closes fast)
    lowReviews: 20,
    phoneAvailable: 20,
    notVerified: 10,
    noSocialMedia: 10,
    noWebsite: 0,
    manyEmployees: 0,
    lowRating: 0,
  },
  salonEquipment: {
    newlyOpened: 40,
    lowReviews: 20,
    phoneAvailable: 20,
    notVerified: 10,
    noSocialMedia: 10,
    noWebsite: 0,
    manyEmployees: 0,
    lowRating: 0,
  },

  // ─── MANUFACTURING & INDUSTRIAL ───────────────────────────────────────────────
  packaging: {
    newlyOpened: 30,
    manyEmployees: 20,
    phoneAvailable: 20,
    lowReviews: 15,
    notVerified: 10,
    noWebsite: 5,
    noSocialMedia: 0,
    lowRating: 0,
  },
  safetyEquipment: {
    newlyOpened: 30,
    manyEmployees: 30,
    phoneAvailable: 20,
    lowReviews: 10,
    notVerified: 10,
    noWebsite: 0,
    noSocialMedia: 0,
    lowRating: 0,
  },
  staffing: {
    manyEmployees: 40,
    newlyOpened: 30,
    phoneAvailable: 15,
    lowReviews: 10,
    notVerified: 5,
    noWebsite: 0,
    noSocialMedia: 0,
    lowRating: 0,
  },

  // ─── MARKETING & EVENTS ───────────────────────────────────────────────────────
  branding: {
    noWebsite: 30,
    noSocialMedia: 30,
    newlyOpened: 20,
    lowReviews: 10,
    notVerified: 10,
    phoneAvailable: 0,
    manyEmployees: 0,
    lowRating: 0,
  },
  printing: {
    newlyOpened: 35,     // New business immediately needs cards, banners, signage
    noWebsite: 20,
    lowReviews: 15,
    phoneAvailable: 20,
    notVerified: 10,
    noSocialMedia: 0,
    manyEmployees: 0,
    lowRating: 0,
  },
  photography: {
    newlyOpened: 30,
    noWebsite: 20,
    noSocialMedia: 20,
    phoneAvailable: 20,
    lowReviews: 10,
    notVerified: 0,
    manyEmployees: 0,
    lowRating: 0,
  },

  // ─── TRANSPORT & LOGISTICS ────────────────────────────────────────────────────
  fleetSoftware: {
    manyEmployees: 40,
    newlyOpened: 20,
    phoneAvailable: 20,
    lowReviews: 10,
    notVerified: 10,
    noWebsite: 0,
    noSocialMedia: 0,
    lowRating: 0,
  },
  vehicleInsurance: {
    manyEmployees: 35,
    newlyOpened: 25,
    phoneAvailable: 25,
    lowReviews: 10,
    notVerified: 5,
    noWebsite: 0,
    noSocialMedia: 0,
    lowRating: 0,
  },

  // ─── FALLBACK ─────────────────────────────────────────────────────────────────
  other: {
    noWebsite: 20, newlyOpened: 20, lowReviews: 15,
    phoneAvailable: 20, notVerified: 10, noSocialMedia: 10,
    manyEmployees: 5, lowRating: 0,
  },
}

// ─── Pitch Templates Per Seller Type ──────────────────────────────────────────
// Each template function receives the business and returns a human-readable one-liner
// explaining WHY this lead is valuable to THIS specific seller.

type PitchFn = (b: Business) => string

const PITCH_TEMPLATES: Record<string, PitchFn> = {
  // Digital & Tech
  developer: (b) =>
    b.hasWebsite
      ? `"${b.name}" has a website but may need a redesign or mobile-friendly upgrade`
      : `"${b.name}" has no website — pitch a professional website package today`,

  agency: (b) =>
    !b.hasWebsite
      ? `"${b.name}" has zero online presence — perfect fit for a full digital marketing retainer`
      : `"${b.name}" has weak social media presence — offer a social media management package`,

  erpSoftware: (b) =>
    `"${b.name}" is ${b.isNewlyOpened ? "a growing new business" : "an established operation"} — pitch your ERP to streamline billing, inventory and HR`,

  // Financial Services
  insurance: (b) =>
    `"${b.name}" is a ${b.isNewlyOpened ? "newly opened" : "growing"} business — ideal time to pitch fire, health and business liability insurance`,

  loanDSA: (b) =>
    `"${b.name}" is ${b.isNewlyOpened ? "newly opened and likely needs working capital" : "growing fast and may need business expansion credit"} — pitch a business loan`,

  ca: (b) =>
    b.isNewlyOpened
      ? `"${b.name}" just opened — they urgently need GST registration, TDS filing and monthly compliance. Be their first CA`
      : `"${b.name}" is a ${b.reviewCount && b.reviewCount < 15 ? "small business" : "growing business"} likely without a CA — pitch GST filing and annual audit services`,

  gst: (b) =>
    b.isNewlyOpened
      ? `"${b.name}" just opened — GST registration is mandatory. Reach out before they register elsewhere`
      : `"${b.name}" may not have a GST consultant — offer a free eligibility check and registration package`,

  // Real Estate & Construction
  realestate: (b) =>
    `"${b.name}" is ${b.isNewlyOpened ? "a new and growing business" : "an established business"} — they may need to upgrade or expand their commercial space`,

  interior: (b) =>
    b.isNewlyOpened
      ? `"${b.name}" just opened — reach out NOW for interior design before they finalise with another vendor`
      : `"${b.name}" may need a renovation or brand refresh — pitch an interior upgrade package`,

  solar: (b) =>
    `"${b.name}" is a ${b.category} — pitch rooftop solar to cut their electricity bills by 25–40%`,

  // Healthcare
  medicalEquipment: (b) =>
    b.isNewlyOpened
      ? `"${b.name}" just opened — they need to finalise their equipment setup now. Be the first vendor to call`
      : `"${b.name}" may need equipment upgrades or additional diagnostic tools`,

  pharma: (b) =>
    b.isNewlyOpened
      ? `"${b.name}" is a new clinic — introduce your medicines early and get on their approved supplier list`
      : `"${b.name}" is a small clinic — visit with product samples to start a recurring supply relationship`,

  // Education
  schoolERP: (b) =>
    b.hasWebsite
      ? `"${b.name}" has a website but no management software — pitch your ERP for fee collection and attendance`
      : `"${b.name}" has no digital system — pitch your school ERP for fee management, attendance and parent communication`,

  trainer: (b) =>
    `"${b.name}" is a growing operation — pitch skill development and compliance training for their team`,

  // Food & Hospitality
  foodSupplier: (b) =>
    b.isNewlyOpened
      ? `"${b.name}" just opened — approach them NOW for a monthly raw material supply contract before they lock in a vendor`
      : `"${b.name}" is an active food business — offer better pricing and next-day delivery to win them over`,

  restaurantPOS: (b) =>
    `"${b.name}" ${b.hasWebsite ? "has a website but" : "has no website and"} likely no billing system — pitch your restaurant POS and save them 2 hours of manual work daily`,

  // Fitness & Wellness
  gymEquipment: (b) =>
    b.isNewlyOpened
      ? `"${b.name}" just opened — reach out NOW before they finalise their equipment vendor. Offer a complete gym setup package`
      : `"${b.name}" may need equipment upgrades or additional machines as they grow`,

  salonEquipment: (b) =>
    b.isNewlyOpened
      ? `"${b.name}" is a new salon — they need chairs, dryers and mirrors immediately. Pitch your bundle deal with installation`
      : `"${b.name}" may need styling chair upgrades or additional equipment as they expand`,

  // Manufacturing & Industrial
  packaging: (b) =>
    `"${b.name}" is a ${b.category} — approach them for a monthly packaging material supply contract with custom branding`,

  safetyEquipment: (b) =>
    `"${b.name}" is a ${b.category} — pitch your PPE kits and annual safety compliance audit package`,

  staffing: (b) =>
    `"${b.name}" is a growing operation — they likely have recurring manpower needs. Pitch verified workers with zero placement fee till joining`,

  // Marketing & Events
  branding: (b) =>
    b.isNewlyOpened
      ? `"${b.name}" just launched with no brand identity — offer a logo + brand kit package to set them up right from day 1`
      : `"${b.name}" has a weak visual presence — pitch a brand refresh package`,

  printing: (b) =>
    b.isNewlyOpened
      ? `"${b.name}" just opened — they immediately need visiting cards, signage, banners and brochures. Call today`
      : `"${b.name}" is an active business — pitch bulk printing for marketing collateral`,

  photography: (b) =>
    `"${b.name}" has no professional media — pitch a product/brand photography package to boost their online presence`,

  // Transport & Logistics
  fleetSoftware: (b) =>
    `"${b.name}" runs a fleet-based operation — pitch GPS tracking software to cut fuel costs by 20% and reduce maintenance`,

  vehicleInsurance: (b) =>
    `"${b.name}" has commercial vehicles — pitch comprehensive fleet insurance before their policy renewal`,

  // Fallback
  other: (b) =>
    `"${b.name}" shows strong signals for your offer — reach out and pitch your product`,
}

// ─── Score Reasons Per Signal ─────────────────────────────────────────────────
// Human-readable explanation of WHY a signal adds points for a given seller type

function getSignalReason(signal: string, sellerType: string): string {
  const reasons: Record<string, Record<string, string>> = {
    noWebsite: {
      developer:  "No website — prime target for your web development services",
      agency:     "No online presence — needs full digital marketing setup",
      branding:   "No website or brand identity — strong need for your services",
      printing:   "No website — likely needs offline marketing material",
      ca:         "No digital setup — likely a new or informal business",
      gst:        "No digital presence — may not have GST registered yet",
      default:    "No website found",
    },
    newlyOpened: {
      ca:           "Newly opened — urgently needs GST registration and compliance setup",
      gst:          "Newly opened — GST registration is mandatory from day 1",
      insurance:    "Newly opened — needs business, fire and employee insurance",
      loanDSA:      "Newly opened — likely needs working capital to grow",
      gymEquipment: "Newly opened gym — window to be their equipment vendor is NOW",
      salonEquipment: "Newly opened salon — hasn't finalised equipment vendor yet",
      medicalEquipment: "Newly opened clinic — finalising equipment setup right now",
      pharma:       "Newly opened clinic — get on their approved medicines list early",
      foodSupplier: "Newly opened — hasn't locked in a raw material supplier yet",
      restaurantPOS: "Newly opened restaurant — needs billing and ordering system",
      interior:     "Newly opened — perfect timing for interior design",
      printing:     "Newly opened — immediately needs cards, signage and brochures",
      realestate:   "Newly opened — may need a better or larger commercial space soon",
      default:      "Newly opened business — high intent to buy",
    },
    lowReviews: {
      ca:           "Very few reviews — small or new business without a CA",
      developer:    "Few reviews — new/small business open to building digital presence",
      agency:       "Low review count — not yet investing in digital marketing",
      default:      "Few Google reviews — business is new or under-resourced",
    },
    notVerified: {
      ca:           "Not Google verified — likely not professionally managed or GST-registered",
      gst:          "Not verified — may not have completed formal registrations",
      developer:    "Not Google verified — digital presence is weak or neglected",
      default:      "Not Google verified — business may need professional support",
    },
    phoneAvailable: {
      insurance:    "Phone available — can be reached directly for a policy quote",
      loanDSA:      "Phone available — can pitch business loan offer directly",
      ca:           "Direct phone contact available — easy to reach for a consultation",
      default:      "Phone available — can contact directly",
    },
    noSocialMedia: {
      developer:    "No social media — weak overall digital presence",
      agency:       "No social media — core opportunity for a social management retainer",
      branding:     "No social presence — needs brand identity and social setup",
      default:      "No social media presence found",
    },
    manyEmployees: {
      insurance:    "Large team — bigger group health and fire insurance policy",
      loanDSA:      "Growing team — business may need expansion capital",
      staffing:     "Many employees — recurring manpower and staffing needs",
      fleetSoftware: "Large fleet operation — GPS tracking saves significant costs",
      default:      "Growing business with a large team",
    },
    lowRating: {
      agency:       "Low rating — dissatisfied with current marketing approach",
      default:      "Low Google rating — unhappy with current state",
    },
  }

  const signalMap = reasons[signal]
  if (!signalMap) return signal
  return signalMap[sellerType] || signalMap["default"] || signal
}

// ─── Main Scoring Function ────────────────────────────────────────────────────

export function calculateLeadScore(business: Business, sellerType: string): LeadScore {
  const weights = SCORING_WEIGHTS[sellerType] || SCORING_WEIGHTS.other
  const pitchFn = PITCH_TEMPLATES[sellerType] || PITCH_TEMPLATES.other

  let score = 0
  const reasons: string[] = []

  // No website signal
  if (!business.hasWebsite) {
    const pts = weights.noWebsite || 0
    score += pts
    if (pts > 0) reasons.push(getSignalReason("noWebsite", sellerType))
  }

  // Newly opened signal
  if (business.isNewlyOpened) {
    const pts = weights.newlyOpened || 0
    score += pts
    if (pts > 0) reasons.push(getSignalReason("newlyOpened", sellerType))
  }

  // Low review count signal
  if ((business.reviewCount ?? 999) < 5) {
    const pts = weights.lowReviews || 0
    score += pts
    if (pts > 0) reasons.push(getSignalReason("lowReviews", sellerType))
  } else if ((business.reviewCount ?? 999) < 20) {
    const pts = Math.floor((weights.lowReviews || 0) / 2)
    score += pts
    if (pts > 0) reasons.push("Few Google reviews — business is relatively new")
  }

  // Not verified signal
  if (!business.googleVerified) {
    const pts = weights.notVerified || 0
    score += pts
    if (pts > 0) reasons.push(getSignalReason("notVerified", sellerType))
  }

  // Low rating signal
  if (business.rating && business.rating < 3.5) {
    const pts = weights.lowRating || 0
    score += pts
    if (pts > 0) reasons.push(getSignalReason("lowRating", sellerType))
  }

  // Phone available signal
  if (business.phone) {
    const pts = weights.phoneAvailable || 0
    score += pts
    if (pts > 0) reasons.push(getSignalReason("phoneAvailable", sellerType))
  }

  // No social media signal (placeholder — will come from scraper later)
  // We assume no social if no website for now
  if (!business.hasWebsite) {
    const pts = weights.noSocialMedia || 0
    score += pts
    if (pts > 0 && !reasons.some(r => r.includes("social"))) {
      reasons.push(getSignalReason("noSocialMedia", sellerType))
    }
  }

  // Cap at 100
  score = Math.min(score, 100)

  // Classify
  let priority: "HOT" | "WARM" | "COLD"
  if (score >= 70) priority = "HOT"
  else if (score >= 45) priority = "WARM"
  else priority = "COLD"

  // Generate contextual pitch
  const pitch = pitchFn(business)

  return { score, priority, reasons, pitch }
}
