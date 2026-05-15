import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/services/analytics.service'
import { captureError } from '@/lib/sentry-helpers'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { eventType, productId } = body

        if (!analyticsService.isValidEvent(eventType)) {
            return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
        }

        // Fire and forget
        analyticsService.trackEvent(
            eventType,
            productId,
            request.headers.get('user-agent')
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        captureError(error, { endpoint: '/api/analytics/track' })
        return NextResponse.json({ success: false })
    }
}
