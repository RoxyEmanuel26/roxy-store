import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SubcategorySchema } from '@/lib/validations'
import { validateOrigin } from '@/lib/csrf'
import { parseAndValidate } from '@/lib/api-helpers'
import { sanitizeText } from '@/lib/sanitize'
import slugify from 'slugify'
import { revalidateTag } from 'next/cache'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const subcategory = await prisma.subcategory.findUnique({
        where: { id },
        include: { category: true }
    })

    if (!subcategory) {
        return NextResponse.json({ error: 'Sub-kategori tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(subcategory)
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!validateOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const session = await auth()
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validation = await parseAndValidate(SubcategorySchema, body)

    if (!validation.success) {
        return validation.response
    }

    const name = sanitizeText(validation.data.name)
    const categoryId = validation.data.categoryId
    const slug = slugify(name, { lower: true, locale: 'id', strict: true })

    const existing = await prisma.subcategory.findFirst({
        where: {
            categoryId,
            OR: [
                { name: { equals: name, mode: 'insensitive' } },
                { slug }
            ],
            NOT: { id },
        },
    })

    if (existing) {
        return NextResponse.json(
            { error: 'Sub-kategori dengan nama atau slug ini sudah ada di kategori utama yang sama' },
            { status: 409 }
        )
    }

    const subcategory = await prisma.subcategory.update({
        where: { id },
        data: {
            name,
            slug,
            categoryId,
            description: validation.data.description || null,
        },
    })

    revalidateTag('categories', { expire: 0 })
    revalidateTag('products', { expire: 0 })

    return NextResponse.json(subcategory)
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!validateOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const session = await auth()
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const productCount = await prisma.product.count({
        where: { subcategoryId: id },
    })

    if (productCount > 0) {
        return NextResponse.json(
            { error: 'Hapus atau pindahkan semua produk di sub-kategori ini terlebih dahulu' },
            { status: 400 }
        )
    }

    await prisma.subcategory.delete({ where: { id } })

    revalidateTag('categories', { expire: 0 })
    revalidateTag('products', { expire: 0 })

    return NextResponse.json({ message: 'Sub-kategori berhasil dihapus' })
}
