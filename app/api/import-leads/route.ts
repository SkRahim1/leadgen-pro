import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Shuffle helper
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export async function POST(req: NextRequest) {
  try {
    console.log("[Import Leads API] Loading leads from local database...")
    
    // Read the compiled real leads database
    const dbPath = path.join(process.cwd(), "data", "real-leads-database.json")
    if (!fs.existsSync(dbPath)) {
      console.warn("[Import Leads API] Database file not found at:", dbPath)
      return NextResponse.json({ leads: [], count: 0, error: "Database not compiled yet." })
    }

    const fileContent = fs.readFileSync(dbPath, "utf8")
    const allLeads = JSON.parse(fileContent)

    // Parse body for already imported leads
    let existingIds: string[] = []
    try {
      const body = await req.json()
      existingIds = body.existingIds || []
    } catch (e) {
      // Empty or invalid body, ignore
    }

    console.log(`[Import Leads API] Total database leads: ${allLeads.length}. User already has: ${existingIds.length}`)

    // Filter out leads the user already has in their list
    let freshLeads = allLeads.filter((lead: any) => !existingIds.includes(lead.placeId))

    // If no fresh leads left (i.e. they imported everything), recycle database but shuffle
    if (freshLeads.length === 0) {
      console.log("[Import Leads API] All database leads already imported. Recycling database.")
      freshLeads = [...allLeads]
    }

    // Shuffle leads to get a fresh random selection
    const shuffled = shuffleArray(freshLeads)

    // Take a batch of 100 leads to import
    const batchSize = Math.min(100, shuffled.length)
    const selectedLeads = shuffled.slice(0, batchSize)

    console.log(`[Import Leads API] Selected ${selectedLeads.length} new leads to import.`)
    return NextResponse.json({ leads: selectedLeads, count: selectedLeads.length })

  } catch (error: any) {
    console.error("[Import Leads API] Fatal error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

// Fallback GET handler (returns 100 random leads)
export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), "data", "real-leads-database.json")
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ leads: [], count: 0, error: "Database not compiled yet." })
    }
    const allLeads = JSON.parse(fs.readFileSync(dbPath, "utf8"))
    const shuffled = shuffleArray(allLeads)
    const selected = shuffled.slice(0, 100)
    return NextResponse.json({ leads: selected, count: selected.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
