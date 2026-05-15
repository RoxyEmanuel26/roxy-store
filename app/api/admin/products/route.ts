import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ProductSchema } from '@/lib/validations'
import { validateOrigin } from '@/lib/csrf'
import { parseAndValidate } from '@/lib/api-helpers'
import { sanitizeText, sanitizeDescription, sanitizeUrl } from '@/lib/sanitize'
import { productRepository } from '@/repositories/product.repository'
import { revalidateTag } from 'next/cache'
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

    const result = await productRepository.findAdminPaginated({
        search: search || undefined,
        categoryId: categoryId || undefined,
        isActive: isActive !== null && isActive !== '' ? isActive === 'true' : null,
        page,
        limit,
    })

    return NextResponse.json(result)
}

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

    const existingSlug = await productRepository.findBySlug(slug)
    if (existingSlug) {
        slug = `${slug}-${Date.now()}`
    }

    const product = await productRepository.create({
        title,
        slug,
        description: sanitizeDescription(data.description),
        price: data.price,
        image: sanitizeUrl(data.image) || data.image,
        images: data.images?.map((img: string) => sanitizeUrl(img) || img) || [],
        shopeeUrl: data.shopeeUrl ? (sanitizeUrl(data.shopeeUrl) || data.shopeeUrl) : '',
        tokopediaUrl: data.tokopediaUrl ? (sanitizeUrl(data.tokopediaUrl) || data.tokopediaUrl) : '',
        categoryId: data.categoryId,
        badge: data.badge || null,
        isActive: data.isActive ?? true,
    })

    revalidateTag('products', { expire: 0 })
    revalidateTag('categories', { expire: 0 })

    return NextResponse.json(product, { status: 201 })
}
