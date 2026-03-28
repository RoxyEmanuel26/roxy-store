import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { captureError } from '@/lib/sentry-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const rawEvents = await prisma.analytics.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
        })

        const productIds = Array.from(new Set(rawEvents.map(e => e.productId).filter(Boolean))) as String[]

        const products = await prisma.product.findMany({
            where: { id: { in: productIds as string[] } },
            select: { id: true, title: true }
        })

        const productMap = products.reduce((acc, p) => {
            acc[p.id] = p
            return acc
        }, {} as Record<string, { id: string, title: string }>)

        const recentEvents = rawEvents.map(event => ({
            ...event,
            product: event.productId ? productMap[event.productId] : null
        }))

        return NextResponse.json({ events: recentEvents })
    } catch (error) {
        captureError(error, { endpoint: '/api/admin/analytics/recent' })
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
