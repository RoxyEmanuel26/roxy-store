import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProductSchema } from '@/lib/validations'
import { validateOrigin } from '@/lib/csrf'
import { parseAndValidate } from '@/lib/api-helpers'
import { sanitizeText, sanitizeDescription, sanitizeUrl } from '@/lib/sanitize'
import slugify from 'slugify'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const product = await prisma.product.findUnique({
        where: { id },
        include: { category: true },
    })

    if (!product) {
        return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(product)
}

import { revalidateTag } from 'next/cache'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!validateOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    if (Object.keys(body).length === 1 && 'isActive' in body) {
        const product = await prisma.product.update({
            where: { id },
            data: { isActive: body.isActive },
        })
        revalidateTag('products', { expire: 0 })
        revalidateTag('categories', { expire: 0 })
        return NextResponse.json(product)
    }

    const validation = await parseAndValidate(ProductSchema, body)

    if (!validation.success) {
        return validation.response
    }

    const data = validation.data

    const title = sanitizeText(data.title)
    let slug = slugify(title, { lower: true, locale: 'id', strict: true })

    const existingSlug = await prisma.product.findFirst({
        where: { slug, NOT: { id } },
    })
    if (existingSlug) {
        slug = `${slug}-${Date.now()}`
    }

    const product = await prisma.product.update({
        where: { id },
        data: {
            title,
            slug,
            description: sanitizeDescription(data.description),
            price: data.price,
            image: sanitizeUrl(data.image) || data.image,
            images: data.images?.map(img => sanitizeUrl(img) || img) || [],
            shopeeUrl: data.shopeeUrl ? (sanitizeUrl(data.shopeeUrl) || data.shopeeUrl) : '',
            tokopediaUrl: data.tokopediaUrl ? (sanitizeUrl(data.tokopediaUrl) || data.tokopediaUrl) : '',
            categoryId: data.categoryId,
            badge: data.badge || null,
            isActive: data.isActive ?? true,
        },
        include: { category: true },
    })

    revalidateTag('products', { expire: 0 })
    revalidateTag('categories', { expire: 0 })

    return NextResponse.json(product)
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!validateOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.product.delete({ where: { id } })

    revalidateTag('products', { expire: 0 })
    revalidateTag('categories', { expire: 0 })

    return NextResponse.json({ message: 'Produk berhasil dihapus' })
}
