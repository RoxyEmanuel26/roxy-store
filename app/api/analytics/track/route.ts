import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '@/services/analytics.service'
import { captureError } from '@/lib/sentry-helpers'
import { bufferShopeeClick, bufferWaClick } from '@/lib/redis-buffer'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { eventType, productId } = body

        if (!analyticsService.isValidEvent(eventType)) {
            return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
        }

        const userAgent = request.headers.get('user-agent') || null

        // Buffer click events in Upstash Redis to prevent Postgres transaction pool saturation
        if (eventType === 'shopee_click') {
            await bufferShopeeClick(productId, userAgent)
        } else if (eventType === 'wa_click') {
            await bufferWaClick(productId, userAgent)
        } else {
            // Await tracking completion for any unhandled events
            await analyticsService.trackEvent(
                eventType,
                productId,
                userAgent
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        captureError(error, { endpoint: '/api/analytics/track' })
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
