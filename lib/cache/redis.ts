/**
 * @module lib/cache/redis
 * @description Upstash Redis client — STUBBED for demo mode.
 * Uncomment when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are available.
 *
 * Install: npm install @upstash/redis
 */

// import { Redis } from "@upstash/redis"
// export const redis = new Redis({
//   url: process.env.UPSTASH_REDIS_REST_URL!,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// })

/** No-op cache for demo mode — replace with real Redis when keys are ready */
export const redis = {
  get: async (_key: string) => null,
  set: async (_key: string, _value: unknown, _opts?: unknown) => {},
  del: async (_key: string) => {},
}
