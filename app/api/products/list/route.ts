import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || searchParams.get('kategori') || ''
    const badge = searchParams.get('badge') || ''
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
    const sort = searchParams.get('sort') || 'newest'
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 12))

    const where: Record<string, unknown> = { isActive: true }
    if (q) where.title = { contains: q, mode: 'insensitive' }
    if (category) where.category = { slug: category }
    if (badge) where.badge = badge
    if (minPrice || maxPrice) {
        const priceFilter: Record<string, number> = {}
        if (minPrice) priceFilter.gte = minPrice
        if (maxPrice) priceFilter.lte = maxPrice
        where.price = priceFilter
    }

    const orderByMap: Record<string, Record<string, string>> = {
        newest: { createdAt: 'desc' },
        terbaru: { createdAt: 'desc' },
        'price-asc': { price: 'asc' },
        'harga-terendah': { price: 'asc' },
        'price-desc': { price: 'desc' },
        'harga-tertinggi': { price: 'desc' },
        popular: { viewCount: 'desc' },
        terlaris: { shopeeSold: 'desc' },
        'rating-tertinggi': { shopeeRating: 'desc' },
    }

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                originalPrice: true,
                image: true,
                badge: true,
                viewCount: true,
                shopeeRating: true,
                shopeeSold: true,
                category: { select: { name: true, slug: true } }
            },
            orderBy: orderByMap[sort] || orderByMap.newest,
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.product.count({ where }),
    ])

    return NextResponse.json({ products, total, page })
}
