import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { captureError } from '@/lib/sentry-helpers'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.product.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        captureError(error, { endpoint: '/api/products/[id]/view' })
        return NextResponse.json({ success: false })
    }
}
