import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/product.service'
import { captureError } from '@/lib/sentry-helpers'
import { validateOrigin } from '@/lib/csrf'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // CSRF origin validation check
    if (!validateOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const { id } = await params

        // Verify product exists first to avoid Prisma update errors and return 404
        const productExists = await prisma.product.findUnique({
            where: { id },
            select: { id: true }
        })

        if (!productExists) {
            return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
        }

        await productService.trackProductView(id)
        return NextResponse.json({ success: true })
    } catch (error) {
        captureError(error, { endpoint: '/api/products/[id]/view' })
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
