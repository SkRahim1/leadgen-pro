/**
 * @module lib/db/prisma
 * @description Prisma client singleton — STUBBED for demo mode.
 * Uncomment when DATABASE_URL (Supabase) is configured and `npx prisma generate` has been run.
 *
 * Setup steps:
 * 1. npm install @prisma/client
 * 2. Add DATABASE_URL and DIRECT_URL to .env
 * 3. npx prisma generate
 * 4. npx prisma db push
 */

// import { PrismaClient } from "@prisma/client"
//
// const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
//
// export const prisma =
//   globalForPrisma.prisma ||
//   new PrismaClient({
//     log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
//   })
//
// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

/** No-op Prisma stub for demo mode */
export const prisma = {} as any
