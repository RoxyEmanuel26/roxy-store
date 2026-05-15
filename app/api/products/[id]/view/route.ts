import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/product.service'
import { captureError } from '@/lib/sentry-helpers'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await productService.trackProductView(id)
        return NextResponse.json({ success: true })
    } catch (error) {
        captureError(error, { endpoint: '/api/products/[id]/view' })
        return NextResponse.json({ success: false })
    }
}
