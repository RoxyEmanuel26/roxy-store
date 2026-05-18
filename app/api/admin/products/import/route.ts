import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CsvProductSchema } from '@/lib/validations'
import { validateOrigin } from '@/lib/csrf'
import { sanitizeText, sanitizeDescription } from '@/lib/sanitize'
import slugify from 'slugify'
import { revalidateTag } from 'next/cache'

const MAX_PRODUCTS_PER_IMPORT = 100

interface ImportResult {
    row: number
    title: string
    status: 'created' | 'updated' | 'error'
    error?: string
}

export async function POST(request: NextRequest) {
    if (!validateOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { products } = body

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json(
                { error: 'Data produk tidak boleh kosong' },
                { status: 400 }
            )
        }

        if (products.length > MAX_PRODUCTS_PER_IMPORT) {
            return NextResponse.json(
                { error: `Maksimal ${MAX_PRODUCTS_PER_IMPORT} produk per import` },
                { status: 400 }
            )
        }

        // Cache kategori yang ada
        const existingCategories = await prisma.category.findMany()
        const categoryMap = new Map<string, string>() // name (lowercase) -> id
        for (const cat of existingCategories) {
            categoryMap.set(cat.name.toLowerCase(), cat.id)
        }

        const results: ImportResult[] = []
        let created = 0
        let updated = 0
        let errors = 0

        for (let i = 0; i < products.length; i++) {
            const rawProduct = products[i]
            const rowNum = i + 2 // +2 because row 1 is header, data starts at row 2

            try {
                // Parse & validate
                const parsed = CsvProductSchema.safeParse({
                    ...rawProduct,
                    price: rawProduct.price === '' || rawProduct.price === undefined || rawProduct.price === null
                        ? 0
                        : Number(rawProduct.price),
                    originalPrice: rawProduct.originalPrice === '' || rawProduct.originalPrice === undefined || rawProduct.originalPrice === null
                        ? undefined
                        : Number(rawProduct.originalPrice),
                    shopeeRating: rawProduct.shopeeRating === '' || rawProduct.shopeeRating === undefined || rawProduct.shopeeRating === null
                        ? undefined
                        : Number(rawProduct.shopeeRating),
                    shopeeSold: rawProduct.shopeeSold === '' || rawProduct.shopeeSold === undefined || rawProduct.shopeeSold === null
                        ? undefined
                        : Number(rawProduct.shopeeSold),
                    description: rawProduct.description || '',
                    image: rawProduct.image || '',
                    images: rawProduct.images || '',
                    shopeeUrl: rawProduct.shopeeUrl || '',
                    tokopediaUrl: rawProduct.tokopediaUrl || '',
                    category: rawProduct.category?.trim() || 'Other',
                    badge: rawProduct.badge || '',
                    isActive: rawProduct.isActive === undefined || rawProduct.isActive === '' ? true : rawProduct.isActive,
                })

                if (!parsed.success) {
                    const errorMsg = parsed.error.issues.map((e: { message: string }) => e.message).join(', ')
                    results.push({ row: rowNum, title: rawProduct.title || '(kosong)', status: 'error', error: errorMsg })
                    errors++
                    continue
                }

                const data = parsed.data
                const title = sanitizeText(data.title)
                const description = sanitizeDescription(data.description || '')
                const slug = slugify(title, { lower: true, locale: 'id', strict: true })

                // Resolve kategori
                const categoryName = data.category.trim() || 'Other'
                let categoryId = categoryMap.get(categoryName.toLowerCase())

                if (!categoryId) {
                    // Buat kategori baru
                    const catSlug = slugify(categoryName, { lower: true, locale: 'id', strict: true })
                    const newCategory = await prisma.category.create({
                        data: {
                            name: categoryName,
                            slug: catSlug || `cat-${Date.now()}`,
                        },
                    })
                    categoryId = newCategory.id
                    categoryMap.set(categoryName.toLowerCase(), categoryId)
                }

                // Parse images (pipe-separated)
                const imageUrls = data.images
                    ? data.images.split('|').map(u => u.trim()).filter(Boolean)
                    : []

                // Cek apakah produk dengan slug yang sama sudah ada
                const existing = await prisma.product.findUnique({
                    where: { slug },
                })

                if (existing) {
                    // UPDATE produk yang sudah ada
                    await prisma.product.update({
                        where: { id: existing.id },
                        data: {
                            title,
                            description: description || existing.description,
                            price: data.price || existing.price,
                            originalPrice: data.originalPrice ?? existing.originalPrice,
                            image: data.image || existing.image,
                            images: imageUrls.length > 0 ? imageUrls : existing.images,
                            shopeeUrl: data.shopeeUrl || existing.shopeeUrl,
                            tokopediaUrl: data.tokopediaUrl || existing.tokopediaUrl,
                            shopeeRating: data.shopeeRating ?? existing.shopeeRating,
                            shopeeSold: data.shopeeSold ?? existing.shopeeSold,
                            categoryId,
                            badge: data.badge || existing.badge,
                            isActive: data.isActive,
                        },
                    })
                    results.push({ row: rowNum, title, status: 'updated' })
                    updated++
                } else {
                    // CREATE produk baru
                    // Cek apakah slug sudah terpakai (edge case: concurrent import)
                    let finalSlug = slug
                    const slugCheck = await prisma.product.findUnique({ where: { slug: finalSlug } })
                    if (slugCheck) {
                        finalSlug = `${slug}-${Date.now()}`
                    }

                    await prisma.product.create({
                        data: {
                            title,
                            slug: finalSlug,
                            description: description || 'Deskripsi belum tersedia',
                            price: data.price,
                            originalPrice: data.originalPrice ?? null,
                            image: data.image || '',
                            images: imageUrls,
                            shopeeUrl: data.shopeeUrl || '',
                            tokopediaUrl: data.tokopediaUrl || '',
                            shopeeRating: data.shopeeRating ?? null,
                            shopeeSold: data.shopeeSold ?? null,
                            categoryId,
                            badge: data.badge || null,
                            isActive: data.isActive,
                        },
                    })
                    results.push({ row: rowNum, title, status: 'created' })
                    created++
                }
            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : 'Kesalahan tidak diketahui'
                results.push({
                    row: rowNum,
                    title: rawProduct.title || '(kosong)',
                    status: 'error',
                    error: errorMsg,
                })
                errors++
            }
        }

        revalidateTag('products', { expire: 0 })
        revalidateTag('categories', { expire: 0 })

        return NextResponse.json({
            message: 'Import selesai',
            summary: { total: products.length, created, updated, errors },
            results,
        })
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Internal Server Error'
        return NextResponse.json({ error: errorMsg }, { status: 500 })
    }
}
