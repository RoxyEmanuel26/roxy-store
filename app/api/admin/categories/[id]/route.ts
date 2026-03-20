import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CategorySchema } from '@/lib/validations'
import { validateOrigin } from '@/lib/csrf'
import { parseAndValidate } from '@/lib/api-helpers'
import { sanitizeText } from '@/lib/sanitize'
import slugify from 'slugify'

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
    const validation = await parseAndValidate(CategorySchema, body)

    if (!validation.success) {
        return validation.response
    }

    const name = sanitizeText(validation.data.name)
    const slug = slugify(name, { lower: true, locale: 'id', strict: true })

    const existing = await prisma.category.findFirst({
        where: {
            OR: [{ name }, { slug }],
            NOT: { id },
        },
    })

    if (existing) {
        return NextResponse.json(
            { error: 'Kategori dengan nama ini sudah ada' },
            { status: 409 }
        )
    }

    const category = await prisma.category.update({
        where: { id },
        data: {
            name,
            slug,
            description: validation.data.description || null,
            icon: validation.data.icon || null,
        },
    })

    revalidateTag('categories', { expire: 0 })

    return NextResponse.json(category)
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

    const productCount = await prisma.product.count({
        where: { categoryId: id },
    })

    if (productCount > 0) {
        return NextResponse.json(
            { error: 'Hapus atau pindahkan semua produk di kategori ini terlebih dahulu' },
            { status: 400 }
        )
    }

    await prisma.category.delete({ where: { id } })

    revalidateTag('categories', { expire: 0 })

    return NextResponse.json({ message: 'Kategori berhasil dihapus' })
}
