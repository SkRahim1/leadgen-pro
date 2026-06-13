/**
 * @module data/sellerTypes.data
 * @description Phase 1 seller type registry — 10 professionals.
 *              Each entry defines the seller's identity, hot lead signals,
 *              scoring weights, and onboarding presets.
 *
 * @exports SELLER_TYPES  - Array of all 10 seller type definitions
 * @exports SELLER_MAP    - Object keyed by sellerType string for O(1) lookup
 */

export interface SellerTypeDefinition {
  /** Unique key — stored in DB */
  id: string
  /** Display label shown in UI */
  label: string
  /** Industry group this belongs to */
  industryGroup: string
  /** Short description shown on onboarding card */
  description: string
  /** Emoji icon for onboarding card */
  icon: string
  /** Colour accent for the card (Tailwind bg class) */
  color: string
  /** What the seller typically sells (pre-fills onboarding) */
  whatISell: string
  /** Which business categories this seller targets */
  targetTypes: string[]
  /** Hot lead signal toggles (pre-selected on onboarding) */
  defaultSignals: {
    noWebsite: boolean
    newlyOpened: boolean
    lowReviews: boolean
    noSocialMedia: boolean
    manyEmployees: boolean
    phoneAvail: boolean
    notVerified: boolean
    lowRating: boolean
  }
  /** Search query examples for this seller type */
  searchExamples: string[]
}

export const SELLER_TYPES: SellerTypeDefinition[] = [
  // ─── 1. WEB DEVELOPER ─────────────────────────────────────────────
  {
    id: "developer",
    label: "Web Developer / Designer",
    industryGroup: "digital",
    description: "Find businesses with no website or outdated online presence",
    icon: "💻",
    color: "bg-violet-500/10 border-violet-500/30",
    whatISell: "Website design, development, and maintenance packages",
    targetTypes: [
      "gym", "restaurant", "clinic", "school", "salon",
      "shop", "hotel", "coaching_center", "store", "agency",
    ],
    defaultSignals: {
      noWebsite: true,
      newlyOpened: true,
      lowReviews: false,
      noSocialMedia: true,
      manyEmployees: false,
      phoneAvail: true,
      notVerified: false,
      lowRating: false,
    },
    searchExamples: [
      "schools in Kompally",
      "salons in Banjara Hills",
      "restaurants in Gachibowli",
    ],
  },

  // ─── 2. INSURANCE AGENT ──────────────────────────────────────────
  {
    id: "insurance",
    label: "Insurance Agent",
    industryGroup: "financial",
    description: "Find newly opened businesses that need business insurance",
    icon: "🛡️",
    color: "bg-blue-500/10 border-blue-500/30",
    whatISell: "Business insurance, fire insurance, health group plans, vehicle insurance",
    targetTypes: [
      "restaurant", "gym", "clinic", "school", "factory",
      "hotel", "retail_store", "salon", "pharmacy", "warehouse",
    ],
    defaultSignals: {
      noWebsite: false,
      newlyOpened: true,
      lowReviews: true,
      noSocialMedia: false,
      manyEmployees: true,
      phoneAvail: true,
      notVerified: false,
      lowRating: false,
    },
    searchExamples: [
      "new restaurants in Pune",
      "factories in Nashik",
      "hotels in Hyderabad",
    ],
  },

  // ─── 3. CA / ACCOUNTANT ───────────────────────────────────────────
  {
    id: "ca",
    label: "CA / Accountant",
    industryGroup: "financial",
    description: "Find new businesses that need GST registration, TDS, and compliance",
    icon: "📊",
    color: "bg-emerald-500/10 border-emerald-500/30",
    whatISell: "GST filing, ITR, TDS, company registration, audit, compliance",
    targetTypes: [
      "restaurant", "retail_store", "startup", "clinic",
      "gym", "salon", "school", "hotel", "agency", "factory",
    ],
    defaultSignals: {
      noWebsite: false,
      newlyOpened: true,
      lowReviews: true,
      noSocialMedia: false,
      manyEmployees: false,
      phoneAvail: true,
      notVerified: true,
      lowRating: false,
    },
    searchExamples: [
      "new startups in Hyderabad",
      "new restaurants in Pune",
      "new clinics in Bangalore",
    ],
  },

  // ─── 4. LOAN DSA / NBFC AGENT ────────────────────────────────────
  {
    id: "loanDSA",
    label: "Loan DSA / NBFC Agent",
    industryGroup: "financial",
    description: "Find growing businesses that need working capital or expansion loans",
    icon: "💰",
    color: "bg-yellow-500/10 border-yellow-500/30",
    whatISell: "Business loans, working capital loans, equipment finance, MSME loans",
    targetTypes: [
      "restaurant", "factory", "retail_store", "hotel",
      "gym", "clinic", "school", "pharmacy", "salon", "agency",
    ],
    defaultSignals: {
      noWebsite: false,
      newlyOpened: true,
      lowReviews: false,
      noSocialMedia: false,
      manyEmployees: true,
      phoneAvail: true,
      notVerified: false,
      lowRating: false,
    },
    searchExamples: [
      "factories in Nashik",
      "growing restaurants in Mumbai",
      "hotels in Goa",
    ],
  },

  // ─── 5. SOLAR INSTALLER ───────────────────────────────────────────
  {
    id: "solar",
    label: "Solar Energy Installer",
    industryGroup: "construction",
    description: "Find large commercial buildings that can install rooftop solar",
    icon: "☀️",
    color: "bg-orange-500/10 border-orange-500/30",
    whatISell: "Rooftop solar panels, installation, government subsidy processing",
    targetTypes: [
      "factory", "hotel", "school", "hospital", "warehouse",
      "gym", "mall", "clinic", "college", "resort",
    ],
    defaultSignals: {
      noWebsite: false,
      newlyOpened: false,
      lowReviews: false,
      noSocialMedia: false,
      manyEmployees: true,
      phoneAvail: true,
      notVerified: false,
      lowRating: false,
    },
    searchExamples: [
      "hotels in Rajasthan",
      "factories in Pune industrial area",
      "schools in Hyderabad",
    ],
  },

  // ─── 6. GYM EQUIPMENT SUPPLIER ───────────────────────────────────
  {
    id: "gymEquipment",
    label: "Gym Equipment Supplier",
    industryGroup: "fitness",
    description: "Find newly opened gyms and fitness centers before they buy equipment",
    icon: "🏋️",
    color: "bg-red-500/10 border-red-500/30",
    whatISell: "Treadmills, weight machines, cardio equipment, gym setup packages",
    targetTypes: [
      "gym", "fitness_center", "yoga_studio", "sports_complex",
      "crossfit", "martial_arts", "wellness_center", "health_club",
    ],
    defaultSignals: {
      noWebsite: true,
      newlyOpened: true,
      lowReviews: true,
      noSocialMedia: false,
      manyEmployees: false,
      phoneAvail: true,
      notVerified: false,
      lowRating: false,
    },
    searchExamples: [
      "gyms in Banjara Hills",
      "new fitness centers in Pune",
      "yoga studios in Bangalore",
    ],
  },

  // ─── 7. MEDICAL EQUIPMENT SUPPLIER ───────────────────────────────
  {
    id: "medicalEquipment",
    label: "Medical Equipment Supplier",
    industryGroup: "healthcare",
    description: "Find newly opened clinics and hospitals that need to buy equipment",
    icon: "🏥",
    color: "bg-teal-500/10 border-teal-500/30",
    whatISell: "Medical equipment, diagnostic machines, hospital furniture, instruments",
    targetTypes: [
      "clinic", "hospital", "diagnostic_center", "dental_clinic",
      "eye_clinic", "physiotherapy", "maternity", "nursing_home",
    ],
    defaultSignals: {
      noWebsite: true,
      newlyOpened: true,
      lowReviews: true,
      noSocialMedia: false,
      manyEmployees: false,
      phoneAvail: true,
      notVerified: false,
      lowRating: false,
    },
    searchExamples: [
      "new clinics in Secunderabad",
      "dental clinics in Bangalore",
      "diagnostic centers in Mumbai",
    ],
  },

  // ─── 8. DIGITAL MARKETING AGENCY ─────────────────────────────────
  {
    id: "agency",
    label: "Digital Marketing Agency",
    industryGroup: "digital",
    description: "Find businesses with no social media presence or weak online brand",
    icon: "📱",
    color: "bg-pink-500/10 border-pink-500/30",
    whatISell: "Social media management, SEO, Google Ads, content marketing",
    targetTypes: [
      "salon", "restaurant", "gym", "clinic", "hotel",
      "retail_store", "school", "jewellery", "boutique", "spa",
    ],
    defaultSignals: {
      noWebsite: true,
      newlyOpened: false,
      lowReviews: true,
      noSocialMedia: true,
      manyEmployees: false,
      phoneAvail: true,
      notVerified: false,
      lowRating: true,
    },
    searchExamples: [
      "salons in Bangalore",
      "restaurants in Hyderabad with low reviews",
      "boutiques in Mumbai",
    ],
  },

  // ─── 9. SCHOOL ERP / EDTECH ──────────────────────────────────────
  {
    id: "schoolERP",
    label: "School ERP / EdTech",
    industryGroup: "education",
    description: "Find schools and coaching centers that have no digital management system",
    icon: "🎓",
    color: "bg-indigo-500/10 border-indigo-500/30",
    whatISell: "School management software, fee collection, attendance tracking, LMS",
    targetTypes: [
      "school", "coaching_center", "college", "preschool",
      "tuition_center", "training_institute", "e_learning", "academy",
    ],
    defaultSignals: {
      noWebsite: true,
      newlyOpened: false,
      lowReviews: false,
      noSocialMedia: true,
      manyEmployees: false,
      phoneAvail: true,
      notVerified: false,
      lowRating: false,
    },
    searchExamples: [
      "schools in Nagpur",
      "coaching centers in Hyderabad",
      "preschools in Pune",
    ],
  },

  // ─── 10. RESTAURANT POS / SOFTWARE ───────────────────────────────
  {
    id: "restaurantPOS",
    label: "Restaurant POS / Software",
    industryGroup: "food",
    description: "Find new restaurants with no billing system or online ordering",
    icon: "🍽️",
    color: "bg-amber-500/10 border-amber-500/30",
    whatISell: "POS billing software, online ordering integration, kitchen display systems",
    targetTypes: [
      "restaurant", "cafe", "food_court", "bakery",
      "fast_food", "dhaba", "cloud_kitchen", "catering",
    ],
    defaultSignals: {
      noWebsite: true,
      newlyOpened: true,
      lowReviews: true,
      noSocialMedia: false,
      manyEmployees: false,
      phoneAvail: true,
      notVerified: false,
      lowRating: false,
    },
    searchExamples: [
      "new restaurants in Gachibowli",
      "cafes in Koramangala",
      "cloud kitchens in Mumbai",
    ],
  },
]

/** O(1) lookup map — use this instead of array.find() in hot paths */
export const SELLER_MAP: Record<string, SellerTypeDefinition> = Object.fromEntries(
  SELLER_TYPES.map((s) => [s.id, s])
)
