/**
 * @module lib/data/sellerTypes
 * @description Phase 1 seller type definitions — 10 professionals, one per industry.
 * Each professional has pre-configured hot signals, scoring weights, and pitch templates.
 * Expand to multiple types per industry in Phase 2.
 */

export interface SellerTypeDefinition {
  key: string
  label: string
  industryGroup: string
  description: string
  icon: string
  whatISell: string
  targetTypes: string[]
  hotSignals: {
    noWebsite: boolean
    newlyOpened: boolean
    lowReviews: boolean
    noSocialMedia: boolean
    manyEmployees: boolean
    phoneAvailable: boolean
    notVerified: boolean
    lowRating: boolean
  }
  pitchTemplate: string
  searchExamples: string[]
}

/**
 * Phase 1: 10 professionals — one per industry.
 * Keyed by industryGroup for the onboarding wizard.
 */
export const SELLER_TYPES: Record<string, SellerTypeDefinition[]> = {

  // 1. Digital & Tech → Web Developer
  digital: [
    {
      key: "developer",
      label: "Web Developer / Designer",
      industryGroup: "digital",
      description: "Find businesses with no website or outdated online presence",
      icon: "💻",
      whatISell: "Website design, development, and maintenance packages starting at ₹15,000",
      targetTypes: ["Schools", "Clinics", "Restaurants", "Gyms", "Salons", "Coaching Centers", "Hotels", "Retail Shops"],
      hotSignals: {
        noWebsite: true,
        newlyOpened: true,
        lowReviews: false,
        noSocialMedia: true,
        manyEmployees: false,
        phoneAvailable: true,
        notVerified: false,
        lowRating: false,
      },
      pitchTemplate: "Hi, I noticed your business doesn't have a website. I build professional websites starting at ₹15,000 — interested in a free demo?",
      searchExamples: ["schools in Kompally", "salons in Banjara Hills", "restaurants in Gachibowli"],
    },
  ],

  // 2. Financial → Insurance Agent
  financial: [
    {
      key: "insurance",
      label: "Insurance Agent",
      industryGroup: "financial",
      description: "Find newly opened businesses that need business insurance",
      icon: "🛡️",
      whatISell: "Business insurance, fire insurance, health group plans, vehicle insurance",
      targetTypes: ["Restaurants", "Gyms", "Clinics", "Schools", "Factories", "Hotels", "Retail Shops", "Pharmacies"],
      hotSignals: {
        noWebsite: false,
        newlyOpened: true,
        lowReviews: true,
        noSocialMedia: false,
        manyEmployees: true,
        phoneAvailable: true,
        notVerified: false,
        lowRating: false,
      },
      pitchTemplate: "Hi, new businesses like yours often overlook insurance. Let me help you protect your investment with the right policy.",
      searchExamples: ["new restaurants in Pune", "factories in Nashik", "hotels in Hyderabad"],
    },
  ],

  // 3. Real Estate & Construction → Solar Installer
  realestate: [
    {
      key: "solar",
      label: "Solar Energy Installer",
      industryGroup: "realestate",
      description: "Find large commercial buildings that can install rooftop solar",
      icon: "☀️",
      whatISell: "Rooftop solar panels, installation, and government subsidy processing",
      targetTypes: ["Factories", "Hotels", "Schools", "Hospitals", "Warehouses", "Gyms", "Colleges"],
      hotSignals: {
        noWebsite: false,
        newlyOpened: false,
        lowReviews: false,
        noSocialMedia: false,
        manyEmployees: true,
        phoneAvailable: true,
        notVerified: false,
        lowRating: false,
      },
      pitchTemplate: "Hi, businesses like yours can save up to 30% on electricity bills with rooftop solar. Free site assessment available?",
      searchExamples: ["hotels in Rajasthan", "factories in Pune industrial area", "schools in Hyderabad"],
    },
  ],

  // 4. Healthcare → Medical Equipment Supplier
  healthcare: [
    {
      key: "medicalEquipment",
      label: "Medical Equipment Supplier",
      industryGroup: "healthcare",
      description: "Find newly opened clinics and hospitals that need to buy equipment",
      icon: "🏥",
      whatISell: "Medical equipment, diagnostic machines, hospital furniture, and surgical instruments",
      targetTypes: ["Clinics", "Hospitals", "Diagnostic Centers", "Dental Clinics", "Eye Clinics", "Physiotherapy Centers"],
      hotSignals: {
        noWebsite: true,
        newlyOpened: true,
        lowReviews: true,
        noSocialMedia: false,
        manyEmployees: false,
        phoneAvailable: true,
        notVerified: false,
        lowRating: false,
      },
      pitchTemplate: "Hi, new clinics and labs need to finalize their equipment setup. I offer quality medical equipment with flexible payment options.",
      searchExamples: ["new clinics in Secunderabad", "dental clinics in Bangalore", "diagnostic centers in Mumbai"],
    },
  ],

  // 5. Education → School ERP / EdTech
  education: [
    {
      key: "schoolERP",
      label: "School ERP / EdTech Software",
      industryGroup: "education",
      description: "Find schools and coaching centers with no digital management system",
      icon: "🎓",
      whatISell: "School management software, fee collection, attendance tracking, and parent communication apps",
      targetTypes: ["Schools", "Coaching Centers", "Playschools", "Colleges", "Training Institutes"],
      hotSignals: {
        noWebsite: true,
        newlyOpened: false,
        lowReviews: false,
        noSocialMedia: true,
        manyEmployees: false,
        phoneAvailable: true,
        notVerified: false,
        lowRating: false,
      },
      pitchTemplate: "Hi, our school ERP automates fee collection, attendance, and parent communication. New schools get 6 months free. Interested?",
      searchExamples: ["schools in Nagpur", "coaching centers in Hyderabad", "preschools in Pune"],
    },
  ],

  // 6. Food & Hospitality → Restaurant POS / Software
  food: [
    {
      key: "restaurantPOS",
      label: "Restaurant POS / Software",
      industryGroup: "food",
      description: "Find new restaurants with no billing system or online ordering",
      icon: "🍽️",
      whatISell: "Restaurant billing software, KOT system, online ordering integration, and inventory management",
      targetTypes: ["Restaurants", "Cafes", "Cloud Kitchens", "Bakeries", "Fast Food Outlets", "Dhabas"],
      hotSignals: {
        noWebsite: true,
        newlyOpened: true,
        lowReviews: true,
        noSocialMedia: false,
        manyEmployees: false,
        phoneAvailable: true,
        notVerified: false,
        lowRating: false,
      },
      pitchTemplate: "Hi, new restaurants often struggle with manual billing. Our POS saves 2 hours daily and reduces errors by 90%. Free 30-day trial available.",
      searchExamples: ["new restaurants in Gachibowli", "cafes in Koramangala", "cloud kitchens in Mumbai"],
    },
  ],

  // 7. Fitness & Wellness → Gym Equipment Supplier
  fitness: [
    {
      key: "gymEquipment",
      label: "Gym Equipment Supplier",
      industryGroup: "fitness",
      description: "Find newly opened gyms and fitness centers before they buy equipment",
      icon: "🏋️",
      whatISell: "Treadmills, weight machines, cardio equipment, and complete gym setup packages",
      targetTypes: ["Gyms", "CrossFit Centers", "Yoga Studios", "Sports Academies", "Wellness Centers"],
      hotSignals: {
        noWebsite: true,
        newlyOpened: true,
        lowReviews: true,
        noSocialMedia: false,
        manyEmployees: false,
        phoneAvailable: true,
        notVerified: false,
        lowRating: false,
      },
      pitchTemplate: "Hi, new gyms need to finalize equipment before their grand opening. I have a complete gym setup package with 0% EMI. Interested?",
      searchExamples: ["gyms in Banjara Hills", "new fitness centers in Pune", "yoga studios in Bangalore"],
    },
  ],

  // 8. Manufacturing & Industrial → Loan DSA / NBFC Agent
  industrial: [
    {
      key: "loanDSA",
      label: "Loan DSA / NBFC Agent",
      industryGroup: "industrial",
      description: "Find growing businesses that need working capital or expansion loans",
      icon: "💰",
      whatISell: "Business loans, working capital loans, equipment finance, and MSME loans",
      targetTypes: ["Manufacturing Units", "Factories", "Restaurants", "Hotels", "Retail Shops", "Clinics"],
      hotSignals: {
        noWebsite: false,
        newlyOpened: true,
        lowReviews: false,
        noSocialMedia: false,
        manyEmployees: true,
        phoneAvailable: true,
        notVerified: false,
        lowRating: false,
      },
      pitchTemplate: "Hi, I help new businesses get working capital loans approved in 48 hours. Interested in a quick check on your eligibility?",
      searchExamples: ["factories in Nashik", "growing restaurants in Mumbai", "hotels in Goa"],
    },
  ],

  // 9. Marketing & Events → Digital Marketing Agency
  marketing: [
    {
      key: "agency",
      label: "Digital Marketing Agency",
      industryGroup: "marketing",
      description: "Find businesses with no social media presence or weak online brand",
      icon: "📱",
      whatISell: "Social media management, SEO, Google Ads, and content marketing packages",
      targetTypes: ["Salons", "Restaurants", "Gyms", "Clinics", "Hotels", "Retail Shops", "Schools"],
      hotSignals: {
        noWebsite: true,
        newlyOpened: false,
        lowReviews: true,
        noSocialMedia: true,
        manyEmployees: false,
        phoneAvailable: true,
        notVerified: false,
        lowRating: true,
      },
      pitchTemplate: "Hi, your business has limited online visibility. We help businesses like yours get 3x more leads through digital marketing. Can we connect?",
      searchExamples: ["salons in Bangalore", "restaurants in Hyderabad", "boutiques in Mumbai"],
    },
  ],

  // 10. Transport & Logistics → CA / Accountant
  transport: [
    {
      key: "ca",
      label: "CA / Chartered Accountant",
      industryGroup: "transport",
      description: "Find new businesses that need GST registration, TDS, and compliance",
      icon: "📊",
      whatISell: "GST filing, ITR, TDS, company registration, audit, and compliance services",
      targetTypes: ["Restaurants", "Retail Shops", "Clinics", "Gyms", "Salons", "Schools", "Hotels"],
      hotSignals: {
        noWebsite: false,
        newlyOpened: true,
        lowReviews: true,
        noSocialMedia: false,
        manyEmployees: false,
        phoneAvailable: true,
        notVerified: true,
        lowRating: false,
      },
      pitchTemplate: "Hi, new businesses need a trusted CA from day one. I offer GST registration + first-year filing for a flat fee. Let me help.",
      searchExamples: ["new startups in Hyderabad", "new restaurants in Pune", "new clinics in Bangalore"],
    },
  ],
}

/** Flat array of all 10 seller types — useful for search/filter */
export const ALL_SELLER_TYPES: SellerTypeDefinition[] = Object.values(SELLER_TYPES).flat()

/** O(1) lookup by seller key */
export const SELLER_BY_KEY: Record<string, SellerTypeDefinition> = Object.fromEntries(
  ALL_SELLER_TYPES.map((s) => [s.key, s])
)
