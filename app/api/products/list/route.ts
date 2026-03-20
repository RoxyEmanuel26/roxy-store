import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const badge = searchParams.get('badge') || ''
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
    const sort = searchParams.get('sort') || 'newest'
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 12))

    const where: any = { isActive: true }
    if (q) where.title = { contains: q, mode: 'insensitive' }
    if (category) where.category = { slug: category }
    if (badge) where.badge = badge
    if (minPrice || maxPrice) {
        where.price = {}
        if (minPrice) where.price.gte = minPrice
        if (maxPrice) where.price.lte = maxPrice
    }

    const orderByMap: Record<string, any> = {
        newest: { createdAt: 'desc' },
        'price-asc': { price: 'asc' },
        'price-desc': { price: 'desc' },
        popular: { viewCount: 'desc' },
    }

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                image: true,
                badge: true,
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
