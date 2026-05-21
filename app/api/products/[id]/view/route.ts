import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/product.service'
import { captureError } from '@/lib/sentry-helpers'
import { validateOrigin } from '@/lib/csrf'

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
        await productService.trackProductView(id)
        return NextResponse.json({ success: true })
    } catch (error) {
        captureError(error, { endpoint: '/api/products/[id]/view' })
        return NextResponse.json({ success: false })
    }
}
