import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { analyticsService } from '@/services/analytics.service'
import { captureError } from '@/lib/sentry-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const summary = await analyticsService.getDashboardSummary()
        return NextResponse.json(summary)
    } catch (error) {
        captureError(error, { endpoint: '/api/admin/analytics/summary' })
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
