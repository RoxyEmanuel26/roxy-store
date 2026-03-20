import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { captureError } from '@/lib/sentry-helpers'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { eventType, productId } = body

        const validEvents = ['view', 'shopee_click', 'tokopedia_click', 'wa_click']
        if (!validEvents.includes(eventType)) {
            return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
        }

        // Fire and forget analytics event
        const trackEvent = async () => {
            try {
                await prisma.analytics.create({
                    data: {
                        eventType,
                        productId: productId || null,
                        userAgent: request.headers.get('user-agent'),
                    },
                })

                if (eventType === 'shopee_click' && productId) {
                    await prisma.product.update({
                        where: { id: productId },
                        data: { shopeeClicks: { increment: 1 } },
                    })
                }
                if (eventType === 'tokopedia_click' && productId) {
                    await prisma.product.update({
                        where: { id: productId },
                        data: { tokopediaClicks: { increment: 1 } },
                    })
                }
            } catch (err) {
                console.error('Analytics tracking error:', err)
                captureError(err, { endpoint: '/api/analytics/track', bgTask: true })
            }
        }

        trackEvent()

        return NextResponse.json({ success: true })
    } catch (error) {
        captureError(error, { endpoint: '/api/analytics/track' })
        return NextResponse.json({ success: false })
    }
}
