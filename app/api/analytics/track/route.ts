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

        const userAgent = request.headers.get('user-agent') || null

        // Write ALL events (view, shopee_click, wa_click) to the analytics table
        // immediately so they appear in the Admin Panel "Aktivitas Live" feed.
        // For shopee_click, this also increments product.shopeeClicks directly.
        await analyticsService.trackEvent(eventType, productId, userAgent)

        return NextResponse.json({ success: true })
    } catch (error) {
        captureError(error, { endpoint: '/api/analytics/track' })
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
