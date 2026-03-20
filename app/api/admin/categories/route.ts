import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CategorySchema } from '@/lib/validations'
import { validateOrigin } from '@/lib/csrf'
import { parseAndValidate } from '@/lib/api-helpers'
import { sanitizeText } from '@/lib/sanitize'
import slugify from 'slugify'

export async function GET() {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { products: true } },
        },
    })

    return NextResponse.json(categories)
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
    const validation = await parseAndValidate(CategorySchema, body)

    if (!validation.success) {
        return validation.response
    }

    const name = sanitizeText(validation.data.name)
    const slug = slugify(name, { lower: true, locale: 'id', strict: true })

    const existing = await prisma.category.findFirst({
        where: { OR: [{ name }, { slug }] },
    })

    if (existing) {
        return NextResponse.json(
            { error: 'Kategori dengan nama ini sudah ada' },
            { status: 409 }
        )
    }

    const category = await prisma.category.create({
        data: { name, slug },
    })

    revalidateTag('categories', { expire: 0 })

    return NextResponse.json(category, { status: 201 })
}
