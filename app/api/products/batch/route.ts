import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { captureError } from '@/lib/sentry-helpers'

export async function POST(request: NextRequest) {
    try {
        const { ids } = await request.json()

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json([])
        }

        // Limit maximum IDs to prevent unbounded IN query DB load
        const limitedIds = ids.slice(0, 50)

        const products = await prisma.product.findMany({
            where: { id: { in: limitedIds }, isActive: true },
            include: { category: true },
        })

        return NextResponse.json(products)
    } catch (error) {
        captureError(error, { endpoint: '/api/products/batch' })
        return NextResponse.json([], { status: 500 })
    }
}
