import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProductSchema } from '@/lib/validations'
import { validateOrigin } from '@/lib/csrf'
import { parseAndValidate } from '@/lib/api-helpers'
import { sanitizeText, sanitizeDescription, sanitizeUrl } from '@/lib/sanitize'
import slugify from 'slugify'

export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {}

    if (search) {
        where.title = { contains: search, mode: 'insensitive' }
    }
    if (categoryId) {
        where.categoryId = categoryId
    }
    if (isActive !== null && isActive !== '') {
        where.isActive = isActive === 'true'
    }

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            include: { category: true },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.product.count({ where }),
    ])

    return NextResponse.json({
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    })
}

import { revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
    if (!validateOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = await parseAndValidate(ProductSchema, body)

    if (!validation.success) {
        return validation.response
    }

    const data = validation.data

    const title = sanitizeText(data.title)
    let slug = slugify(title, { lower: true, locale: 'id', strict: true })

    const existingSlug = await prisma.product.findUnique({
        where: { slug },
    })
    if (existingSlug) {
        slug = `${slug}-${Date.now()}`
    }

    const product = await prisma.product.create({
        data: {
            title,
            slug,
            description: sanitizeDescription(data.description),
            price: data.price,
            image: sanitizeUrl(data.image) || data.image,
            images: data.images?.map(img => sanitizeUrl(img) || img) || [],
            shopeeUrl: sanitizeUrl(data.shopeeUrl) || data.shopeeUrl,
            tokopediaUrl: sanitizeUrl(data.tokopediaUrl) || data.tokopediaUrl,
            categoryId: data.categoryId,
            badge: data.badge || null,
            isActive: data.isActive ?? true,
        },
        include: { category: true },
    })

    revalidateTag('products', { expire: 0 })
    revalidateTag('categories', { expire: 0 })

    return NextResponse.json(product, { status: 201 })
}
