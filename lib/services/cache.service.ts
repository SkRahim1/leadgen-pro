import fs from "fs"
import path from "path"
import { Business } from "@/types/lead.types"

const CACHE_DIR = path.join(process.cwd(), "data")
const CACHE_FILE = path.join(CACHE_DIR, "search-cache.json")

interface CacheEntry {
  businesses: Business[]
  timestamp: number
}

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
  }
}

/**
 * Retrieves search results from the cache file if present.
 */
export function getCachedSearch(key: string): Business[] | null {
  try {
    ensureCacheDir()
    if (!fs.existsSync(CACHE_FILE)) return null

    const fileContent = fs.readFileSync(CACHE_FILE, "utf-8")
    const cacheMap: Record<string, CacheEntry> = JSON.parse(fileContent || "{}")

    const cached = cacheMap[key]
    if (cached) {
      console.log(`[Cache Service] Hit for search key: "${key}"`)
      return cached.businesses
    }
  } catch (e) {
    console.error("[Cache Service] Error reading cache file:", e)
  }
  return null
}

/**
 * Saves search results to the cache file.
 */
export function setCachedSearch(key: string, businesses: Business[]): void {
  try {
    ensureCacheDir()
    let cacheMap: Record<string, CacheEntry> = {}

    if (fs.existsSync(CACHE_FILE)) {
      const fileContent = fs.readFileSync(CACHE_FILE, "utf-8")
      cacheMap = JSON.parse(fileContent || "{}")
    }

    cacheMap[key] = {
      businesses,
      timestamp: Date.now(),
    }

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheMap, null, 2), "utf-8")
    console.log(`[Cache Service] Cached results for key: "${key}" (count: ${businesses.length})`)
  } catch (e) {
    console.error("[Cache Service] Error writing cache file:", e)
  }
}

/**
 * Searches all cached search results for a business with a matching placeId.
 */
export function findBusinessInCache(placeId: string): Business | null {
  try {
    ensureCacheDir()
    if (!fs.existsSync(CACHE_FILE)) return null

    const fileContent = fs.readFileSync(CACHE_FILE, "utf-8")
    const cacheMap: Record<string, CacheEntry> = JSON.parse(fileContent || "{}")

    for (const key of Object.keys(cacheMap)) {
      const entry = cacheMap[key]
      const found = entry.businesses.find(b => b.placeId === placeId)
      if (found) return found
    }
  } catch (e) {
    console.error("[Cache Service] Error searching cache for business:", e)
  }
  return null
}

