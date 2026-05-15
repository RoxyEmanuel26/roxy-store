import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { CategorySchema } from '@/lib/validations'
import { validateOrigin } from '@/lib/csrf'
import { parseAndValidate } from '@/lib/api-helpers'
import { sanitizeText } from '@/lib/sanitize'
import { categoryRepository } from '@/repositories/category.repository'
import { revalidateTag } from 'next/cache'
import slugify from 'slugify'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await categoryRepository.findAllWithCount()
    return NextResponse.json(categories)
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
    const validation = await parseAndValidate(CategorySchema, body)

    if (!validation.success) {
        return validation.response
    }

    const name = sanitizeText(validation.data.name)
    const slug = slugify(name, { lower: true, locale: 'id', strict: true })

    const existing = await categoryRepository.findByNameOrSlug(name, slug)

    if (existing) {
        return NextResponse.json(
            { error: 'Kategori dengan nama ini sudah ada' },
            { status: 409 }
        )
    }

    const category = await categoryRepository.create({
        name,
        slug,
        description: validation.data.description || null,
        icon: validation.data.icon || null,
    })

    revalidateTag('categories', { expire: 0 })

    return NextResponse.json(category, { status: 201 })
}
