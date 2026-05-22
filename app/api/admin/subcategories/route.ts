import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { SubcategorySchema } from '@/lib/validations'
import { validateOrigin } from '@/lib/csrf'
import { parseAndValidate } from '@/lib/api-helpers'
import { sanitizeText } from '@/lib/sanitize'
import { subcategoryRepository } from '@/repositories/subcategory.repository'
import { revalidateTag } from 'next/cache'
import slugify from 'slugify'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await auth()
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subcategories = await subcategoryRepository.findAllWithCount()
    return NextResponse.json(subcategories)
}

export async function POST(request: NextRequest) {
    if (!validateOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const session = await auth()
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = await parseAndValidate(SubcategorySchema, body)

    if (!validation.success) {
        return validation.response
    }

    const name = sanitizeText(validation.data.name)
    const categoryId = validation.data.categoryId
    const slug = slugify(name, { lower: true, locale: 'id', strict: true })

    const existing = await subcategoryRepository.findByNameOrSlug(categoryId, name, slug)

    if (existing) {
        return NextResponse.json(
            { error: 'Sub-kategori dengan nama atau slug ini sudah ada di kategori utama yang sama' },
            { status: 409 }
        )
    }

    const subcategory = await subcategoryRepository.create({
        name,
        slug,
        categoryId,
        description: validation.data.description || null,
    })

    revalidateTag('categories', { expire: 0 })
    revalidateTag('products', { expire: 0 })

    return NextResponse.json(subcategory, { status: 201 })
}
