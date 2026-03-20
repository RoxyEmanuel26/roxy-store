import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { captureError } from '@/lib/sentry-helpers'

export async function GET(request: Request) {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || '7days'

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        let gteDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

        if (period === '30days') {
            gteDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        } else if (period === 'today') {
            gteDate = today
        } else if (period === 'alltime') {
            gteDate = new Date(0)
        }

        const eventsByDayRaw = await prisma.$queryRaw<any[]>`
            SELECT 
              DATE_TRUNC('day', "createdAt") as date,
              "eventType",
              COUNT(*) as count
            FROM "Analytics"
            WHERE "createdAt" >= ${gteDate}
            GROUP BY DATE_TRUNC('day', "createdAt"), "eventType"
            ORDER BY date ASC
        `

        const eventsByDay = eventsByDayRaw.map(r => ({
            ...r,
            count: Number(r.count)
        }))

        return NextResponse.json({ data: eventsByDay })
    } catch (error) {
        captureError(error, { endpoint: '/api/admin/analytics/chart-data' })
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
