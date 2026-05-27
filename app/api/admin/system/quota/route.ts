import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Redis } from '@upstash/redis'
import { v2 as cloudinary } from 'cloudinary'

export const dynamic = 'force-dynamic'

// Safely configure Cloudinary (in case lib/cloudinary wasn't loaded yet)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// Safely convert BigInt or any value to a plain number
function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0
  if (typeof val === 'bigint') return Number(val)
  if (typeof val === 'number') return val
  const parsed = Number(val)
  return isNaN(parsed) ? 0 : parsed
}

export async function GET() {
  try {
    // 1. NEON POSTGRESQL USAGE
    let dbSize = 0
    let tables: { name: string; sizeBytes: number; rowCount: number }[] = []

    try {
      // Get total database size in bytes
      const dbSizeResult: any[] = await prisma.$queryRawUnsafe(
        `SELECT pg_database_size(current_database()) as size`
      )
      if (dbSizeResult && dbSizeResult[0]) {
        dbSize = toNumber(dbSizeResult[0].size)
      }

      // Get breakdown of all tables in the public schema
      const tablesResult: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
            relname AS table_name,
            pg_total_relation_size(c.oid) AS total_size,
            reltuples AS row_count
        FROM 
            pg_class c
        JOIN 
            pg_namespace n ON n.oid = c.relnamespace
        WHERE 
            nspname = 'public' 
            AND relkind = 'r'
        ORDER BY 
            pg_total_relation_size(c.oid) DESC
      `)

      if (tablesResult) {
        tables = tablesResult.map((t: any) => ({
          name: String(t.table_name || 'unknown'),
          sizeBytes: toNumber(t.total_size),
          rowCount: Math.max(0, Math.round(toNumber(t.row_count))),
        }))
      }
    } catch (dbError) {
      console.error('Error fetching database usage:', dbError)
    }

    // 2. CLOUDINARY USAGE
    let cloudinaryData: {
      plan: string
      credits: { usage: number; limit: number; used_percent: number } | null
      transformations: { usage: number; limit: number; used_percent: number } | null
      storage: { usage: number; limit: number; used_percent: number } | null
      bandwidth: { usage: number; limit: number; used_percent: number } | null
      resources: number
    } | null = null

    try {
      const raw: any = await cloudinary.api.usage()

      // Safely extract credits
      const credits = raw?.credits
        ? {
            usage: toNumber(raw.credits.usage),
            limit: toNumber(raw.credits.limit),
            used_percent: toNumber(raw.credits.used_percent),
          }
        : null

      // Safely extract transformations
      const transformations = raw?.transformations
        ? {
            usage: toNumber(raw.transformations.usage),
            limit: toNumber(raw.transformations.limit || raw.transformations.credits_usage || 0),
            used_percent: toNumber(raw.transformations.used_percent || 0),
          }
        : null

      // Safely extract storage
      const storage = raw?.storage
        ? {
            usage: toNumber(raw.storage.usage),
            limit: toNumber(raw.storage.limit || 0),
            used_percent: toNumber(raw.storage.used_percent || 0),
          }
        : null

      // Safely extract bandwidth
      const bandwidth = raw?.bandwidth
        ? {
            usage: toNumber(raw.bandwidth.usage),
            limit: toNumber(raw.bandwidth.limit || 0),
            used_percent: toNumber(raw.bandwidth.used_percent || 0),
          }
        : null

      cloudinaryData = {
        plan: String(raw?.plan || 'Free'),
        credits,
        transformations,
        storage,
        bandwidth,
        resources: toNumber(raw?.resources),
      }
    } catch (cloudinaryError) {
      console.error('Error fetching Cloudinary usage:', cloudinaryError)
    }

    // 3. UPSTASH REDIS USAGE
    let redisUsage = {
      configured: false,
      keysCount: 0,
      status: 'NOT_CONFIGURED',
    }

    const isRedisConfigured =
      !!process.env.UPSTASH_REDIS_REST_URL &&
      !!process.env.UPSTASH_REDIS_REST_TOKEN

    if (isRedisConfigured) {
      try {
        const redis = Redis.fromEnv()
        const keysCount = await redis.dbsize()
        redisUsage = {
          configured: true,
          keysCount: toNumber(keysCount),
          status: 'ACTIVE',
        }
      } catch (redisError) {
        console.error('Error fetching Redis usage:', redisError)
        redisUsage = {
          configured: true,
          keysCount: 0,
          status: 'ERROR',
        }
      }
    }

    // 4. VERCEL CONFIGURATION STATUS
    const isVercelTokenSet = !!process.env.VERCEL_API_TOKEN
    const isVercelProjectIdSet = !!process.env.VERCEL_PROJECT_ID

    // Build the response as a plain object (no BigInt anywhere)
    const responseData = {
      success: true,
      database: {
        totalSizeBytes: dbSize,
        limitSizeBytes: 500 * 1024 * 1024, // Neon Free Tier limit: 500MB
        tables,
      },
      cloudinary: cloudinaryData,
      redis: redisUsage,
      vercel: {
        liveStatsConfigured: isVercelTokenSet && isVercelProjectIdSet,
        hasTokenOnly: isVercelTokenSet && !isVercelProjectIdSet,
      },
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('System quota API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
