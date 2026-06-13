/**
 * @module lib/data/categories
 * @description Full category registry for all 10 industry groups.
 */

export const CATEGORIES: Record<string, { label: string; icon: string; items: string[] }> = {
  digital: {
    label: "Digital & Tech",
    icon: "💻",
    items: ["Schools", "Clinics", "Coaching Centers", "Restaurants", "Gyms",
      "Salons", "Hotels", "Pharmacies", "Lawyers", "Chartered Accountants",
      "Interior Designers", "Retail Shops", "Auto Workshops"]
  },
  financial: {
    label: "Financial Services",
    icon: "💰",
    items: ["NBFCs", "Insurance Offices", "Chartered Accountants",
      "Investment Advisors", "Loan Agencies", "Law Firms",
      "Tax Consultants", "Financial Planners", "Microfinance"]
  },
  realestate: {
    label: "Real Estate & Construction",
    icon: "🏠",
    items: ["Builders", "Brokers", "Interior Designers", "Architects",
      "Property Management", "Co-working Spaces", "Construction Companies",
      "Civil Contractors", "Modular Kitchen Shops"]
  },
  healthcare: {
    label: "Healthcare & Medical",
    icon: "🏥",
    items: ["Hospitals", "Dental Clinics", "Physiotherapy Centers", "Diagnostic Labs",
      "Eye Clinics", "Ayurvedic Centers", "Veterinary Clinics",
      "Nursing Homes", "Skin Clinics", "Pediatric Clinics"]
  },
  education: {
    label: "Education & Training",
    icon: "🎓",
    items: ["Schools", "Junior Colleges", "Coaching Centers", "Playschools",
      "Music Academies", "Art Studios", "Skill Training Centers",
      "Spoken English Institutes", "UPSC Coaching", "Sports Academies"]
  },
  food: {
    label: "Food & Hospitality",
    icon: "🍽️",
    items: ["Restaurants", "Hotels", "Cafes", "Catering Services",
      "Cloud Kitchens", "Bakeries", "Bars", "Supermarkets",
      "Grocery Stores", "Sweet Shops", "Fast Food Outlets"]
  },
  fitness: {
    label: "Fitness & Wellness",
    icon: "🏋️",
    items: ["Gyms", "Yoga Studios", "Spas", "Sports Academies",
      "Swimming Pools", "Dance Studios", "CrossFit Centers",
      "Beauty Salons", "Nail Studios", "Wellness Centers"]
  },
  industrial: {
    label: "Manufacturing & Industrial",
    icon: "⚙️",
    items: ["Manufacturing Units", "Factories", "Warehouses", "Distributors",
      "Wholesalers", "Packaging Companies", "Industrial Suppliers",
      "Auto Parts Dealers", "Chemical Suppliers", "Steel Fabricators"]
  },
  marketing: {
    label: "Marketing & Events",
    icon: "📢",
    items: ["Ad Agencies", "Print Shops", "Event Management Companies",
      "Photography Studios", "Video Production Houses", "PR Agencies",
      "Outdoor Advertising", "Corporate Gift Shops", "Branding Studios"]
  },
  transport: {
    label: "Transport & Logistics",
    icon: "🚗",
    items: ["Transport Companies", "Courier Services", "Logistics Companies",
      "Warehouses", "Fleet Operators", "Auto Garages",
      "Packers and Movers", "Taxi Services", "Truck Operators"]
  }
}

export type IndustryKey = keyof typeof CATEGORIES
