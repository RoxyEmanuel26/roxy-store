import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Redis } from '@upstash/redis'
import { v2 as cloudinary } from 'cloudinary'
import '@/lib/cloudinary' // Ensures Cloudinary config is executed

export const dynamic = 'force-dynamic'

interface TableSizeQuery {
  table_name: string
  total_size: string
  row_count: string
}

export async function GET() {
  try {
    // 1. NEON POSTGRESQL USAGE
    let dbSize = 0
    let tables: { name: string; sizeBytes: number; rowCount: number }[] = []

    try {
      // Get total database size in bytes
      const dbSizeResult = await prisma.$queryRaw<[{ size: bigint }]>`
        SELECT pg_database_size(current_database())::bigint as size
      `
      if (dbSizeResult && dbSizeResult[0]) {
        dbSize = Number(dbSizeResult[0].size)
      }

      // Get breakdown of all tables in the public schema
      const tablesResult = await prisma.$queryRaw<TableSizeQuery[]>`
        SELECT 
            relname AS table_name,
            pg_total_relation_size(c.oid)::bigint AS total_size,
            reltuples::bigint AS row_count
        FROM 
            pg_class c
        JOIN 
            pg_namespace n ON n.oid = c.relnamespace
        WHERE 
            nspname = 'public' 
            AND relkind = 'r'
        ORDER BY 
            pg_total_relation_size(c.oid) DESC
      `

      if (tablesResult) {
        tables = tablesResult.map((t) => ({
          name: t.table_name,
          sizeBytes: Number(t.total_size),
          rowCount: Number(t.row_count),
        }))
      }
    } catch (dbError) {
      console.error('Error fetching database usage:', dbError)
    }

    // 2. CLOUDINARY USAGE
    let cloudinaryUsage: any = null
    try {
      // Fetch Cloudinary Admin API usage statistics
      cloudinaryUsage = await cloudinary.api.usage()
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
          keysCount,
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
    // Checking if user has configured VERCEL_API_TOKEN for live stats
    const isVercelTokenSet = !!process.env.VERCEL_API_TOKEN
    const isVercelProjectIdSet = !!process.env.VERCEL_PROJECT_ID

    return NextResponse.json({
      success: true,
      database: {
        totalSizeBytes: dbSize,
        limitSizeBytes: 500 * 1024 * 1024, // Neon Free Tier limit: 500MB
        tables,
      },
      cloudinary: cloudinaryUsage,
      redis: redisUsage,
      vercel: {
        liveStatsConfigured: isVercelTokenSet && isVercelProjectIdSet,
        hasTokenOnly: isVercelTokenSet && !isVercelProjectIdSet,
      },
    })
  } catch (error: any) {
    console.error('System quota API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
