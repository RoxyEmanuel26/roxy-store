import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    const where: any = { isActive: true }
    if (q) where.title = { contains: q, mode: 'insensitive' }

    const products = await prisma.product.findMany({
        where,
        select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            image: true,
            badge: true,
            category: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    })

    return NextResponse.json(products, {
        headers: {
            'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
        },
    })
}
