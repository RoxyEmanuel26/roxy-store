import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/product.service'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const { products, total, page } = await productService.getPaginatedList(searchParams)

    return NextResponse.json({ products, total, page })
}
