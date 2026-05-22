import { NextRequest, NextResponse } from 'next/server'
import { syncBufferedAnalytics } from '@/lib/redis-buffer'
import { captureError } from '@/lib/sentry-helpers'

export async function POST(request: NextRequest) {
    return handleSync(request)
}

export async function GET(request: NextRequest) {
    return handleSync(request)
}

async function handleSync(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('Authorization')
    const { searchParams } = request.nextUrl
    const urlSecret = searchParams.get('secret')

    // Simple siber-security validation if CRON_SECRET is configured
    if (cronSecret) {
        const isAuthHeaderValid = authHeader === `Bearer ${cronSecret}`
        const isUrlSecretValid = urlSecret === cronSecret
        if (!isAuthHeaderValid && !isUrlSecretValid) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    } else if (process.env.NODE_ENV === 'production') {
        // Enforce secret in production environments
        return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
    }

    try {
        const stats = await syncBufferedAnalytics()
        return NextResponse.json({ success: true, stats })
    } catch (error) {
        captureError(error, { endpoint: '/api/cron/sync-analytics' })
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Sync failed' },
            { status: 500 }
        )
    }
}
