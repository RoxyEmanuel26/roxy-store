import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/product.service'
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    const products = await productService.getSearchProducts(q, 50)

    return NextResponse.json(products, {
        headers: {
            'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
        },
    })
}
