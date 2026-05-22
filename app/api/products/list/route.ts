import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/product.service'
import { captureError } from '@/lib/sentry-helpers'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const { products, total, page } = await productService.getPaginatedList(searchParams)

        return NextResponse.json({ products, total, page })
    } catch (error) {
        captureError(error, { endpoint: '/api/products/list' })
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
