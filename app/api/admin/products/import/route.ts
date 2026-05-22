import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CsvProductSchema } from '@/lib/validations'
import { validateOrigin } from '@/lib/csrf'
import { sanitizeText, sanitizeDescription } from '@/lib/sanitize'
import slugify from 'slugify'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { scrapeShopeeProduct } from '@/lib/shopee-scraper'

const MAX_PRODUCTS_PER_IMPORT = 100

function cleanNumberString(val: string): string {
    let str = val.trim()
    // Remove currency prefixes
    str = str.replace(/^(rp|idr|usd|sgd)\.?\s*/i, '')
    // Remove any remaining letters/symbols except digits, dots, commas, and '-'
    str = str.replace(/[^\d.,-]/g, '')
    
    if (!str) return '0'

    // Check if both dots and commas exist
    const hasDot = str.includes('.')
    const hasComma = str.includes(',')

    if (hasDot && hasComma) {
        const dotIndex = str.lastIndexOf('.')
        const commaIndex = str.lastIndexOf(',')
        if (dotIndex > commaIndex) {
            // Dot is decimal, commas are thousands
            str = str.replace(/,/g, '')
        } else {
            // Comma is decimal, dots are thousands
            str = str.replace(/\./g, '').replace(/,/g, '.')
        }
    } else if (hasComma) {
        // Only commas. Check if it's thousands or decimal separator
        const parts = str.split(',')
        const lastPart = parts[parts.length - 1]
        if (lastPart.length === 3 && parts.length > 1) {
            // Thousands separator
            str = str.replace(/,/g, '')
        } else {
            // Decimal separator
            str = str.replace(/,/g, '.')
        }
    } else if (hasDot) {
        // Only dots. Check if it's thousands or decimal separator
        const parts = str.split('.')
        const lastPart = parts[parts.length - 1]
        if (lastPart.length === 3 && parts.length > 1) {
            // Thousands separator
            str = str.replace(/\./g, '')
        } else {
            // Decimal separator (keep it as dot)
        }
    }
    return str
}

function parseStringWithMultipliers(val: unknown): number {
    if (val === '' || val === undefined || val === null) return 0
    let str = String(val).trim().toLowerCase()
    
    // Remove currency prefix RP/IDR etc first
    str = str.replace(/^(rp|idr|usd|sgd)\.?\s*/i, '')
    // Remove 'terjual' word if present
    str = str.replace(/terjual/g, '').trim()
    
    // Handle multipliers - use includes to support trailing + like 10rb+ or 10k+
    let multiplier = 1
    if (str.includes('ribu') || str.includes('rb') || str.includes('k')) {
        multiplier = 1000
        str = str.replace(/ribu|rb|\+/g, '').replace(/k/g, '').trim()
    } else if (str.includes('juta') || str.includes('jt')) {
        multiplier = 1000000
        str = str.replace(/juta|jt|\+/g, '').trim()
    } else {
        str = str.replace(/\+/g, '').trim()
    }
    
    if (multiplier > 1) {
        const partsComma = str.split(',')
        const partsDot = str.split('.')
        if (partsComma.length === 2 && partsDot.length === 1) {
            str = str.replace(',', '.')
        } else {
            str = cleanNumberString(str)
        }
    } else {
        str = cleanNumberString(str)
    }
    
    const parsed = parseFloat(str)
    return isNaN(parsed) ? 0 : parsed * multiplier
}

function parseCsvPrice(val: unknown): number {
    return parseStringWithMultipliers(val)
}

function parseCsvPriceOrUndefined(val: unknown): number | undefined {
    if (val === '' || val === undefined || val === null) return undefined
    const price = parseCsvPrice(val)
    return price > 0 ? price : undefined
}

function parseCsvSold(val: unknown): number | undefined {
    if (val === '' || val === undefined || val === null) return undefined
    const sold = Math.round(parseStringWithMultipliers(val))
    return sold >= 0 ? sold : undefined
}

function parseCsvFloat(val: unknown): number | undefined {
    if (val === '' || val === undefined || val === null) return undefined
    const cleaned = cleanNumberString(String(val))
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? undefined : parsed
}

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

        // Cache sub-kategori yang ada
        const existingSubcategories = await prisma.subcategory.findMany()
        const subcategoryMap = new Map<string, string>() // `${categoryId}:${name.toLowerCase()}` -> id
        for (const sub of existingSubcategories) {
            subcategoryMap.set(`${sub.categoryId}:${sub.name.toLowerCase()}`, sub.id)
        }

        const results: ImportResult[] = []
        let created = 0
        let updated = 0
        let errors = 0

        for (let i = 0; i < products.length; i++) {
            const rawProduct = products[i]
            const rowNum = rawProduct.originalRow ? Number(rawProduct.originalRow) : (i + 2)

            try {
                // Parse & validate
                const parsed = CsvProductSchema.safeParse({
                    ...rawProduct,
                    price: parseCsvPrice(rawProduct.price),
                    originalPrice: parseCsvPriceOrUndefined(rawProduct.originalPrice),
                    shopeeRating: parseCsvFloat(rawProduct.shopeeRating),
                    shopeeSold: parseCsvSold(rawProduct.shopeeSold || rawProduct.penjualan),
                    shopeeRatingCountStr: rawProduct.shopeeRatingCountStr ? String(rawProduct.shopeeRatingCountStr).trim() : '',
                    shopeeSoldStr: rawProduct.shopeeSoldStr ? String(rawProduct.shopeeSoldStr).trim() : (rawProduct.shopeeSold ? String(rawProduct.shopeeSold).trim() : (rawProduct.penjualan ? String(rawProduct.penjualan).trim() : '')),
                    description: rawProduct.description || '',
                    image: rawProduct.image || '',
                    images: rawProduct.images || '',
                    shopeeUrl: rawProduct.shopeeUrl || '',
                    category: rawProduct.category?.trim() || 'Other',
                    subcategory: rawProduct.subcategory?.trim() || '',
                    badge: rawProduct.badge || 'NEW',
                    isActive: rawProduct.isActive === undefined || rawProduct.isActive === '' ? true : rawProduct.isActive,
                })

                if (!parsed.success) {
                    const errorMsg = parsed.error.issues.map((e: { message: string }) => e.message).join(', ')
                    results.push({ row: rowNum, title: rawProduct.title || '(kosong)', status: 'error', error: errorMsg })
                    errors++
                    continue
                }

                const data = parsed.data
                let title = sanitizeText(data.title)
                let description = sanitizeDescription(data.description || '')
                let imageUrl = data.image || ''

                // Check if shopeeUrl already exists in database (for UPDATE instead of duplicate skip)
                let existingByShopeeUrl: { id: string; slug: string; image: string; images: string[]; description: string; shopeeRating: number | null; shopeeSold: number | null; shopeeRatingCountStr: string | null; shopeeSoldStr: string | null; badge: string | null; } | null = null
                if (data.shopeeUrl) {
                    existingByShopeeUrl = await prisma.product.findFirst({
                        where: { shopeeUrl: data.shopeeUrl },
                        select: { id: true, slug: true, image: true, images: true, description: true, shopeeRating: true, shopeeSold: true, shopeeRatingCountStr: true, shopeeSoldStr: true, badge: true }
                    })
                }

                // ALWAYS scrape Shopee when URL exists to get images, description, category, etc.
                let scrapedCategory = ''
                let scrapedSubcategory = ''
                let scrapedImages: string[] = []
                if (data.shopeeUrl) {
                    try {
                        const scraped = await scrapeShopeeProduct(data.shopeeUrl)
                        if (!title && scraped.title) {
                            title = sanitizeText(scraped.title)
                        }
                        if (!description && scraped.description) {
                            description = sanitizeDescription(scraped.description)
                        }
                        if (!imageUrl && scraped.imageUrl) {
                            imageUrl = scraped.imageUrl
                        }
                        if (scraped.category) {
                            scrapedCategory = scraped.category
                        }
                        if (scraped.subcategory) {
                            scrapedSubcategory = scraped.subcategory
                        }
                        // Capture ALL scraped images (carousel)
                        if (scraped.images && scraped.images.length > 0) {
                            scrapedImages = scraped.images
                            // If main image wasn't set yet, use first scraped image
                            if (!imageUrl && scrapedImages.length > 0) {
                                imageUrl = scrapedImages[0]
                            }
                        }
                    } catch (err) {
                        console.error(`Gagal scraping on-the-fly untuk URL: ${data.shopeeUrl}`, err)
                    }
                }

                // Final check to make sure description has a fallback
                if (!description) {
                    description = `Dapatkan ${title} original berkualitas terbaik hanya di Roxy Store! Produk pilihan ini dirancang dengan desain modern dan material berkualitas untuk memberikan kenyamanan serta keandalan maksimal dalam penggunaan sehari-hari.`
                }

                const slug = slugify(title, { lower: true, locale: 'id', strict: true })

                // Resolve kategori
                const categoryName = scrapedCategory || data.category.trim() || 'Other'
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

                // Resolve sub-kategori
                const subcategoryName = scrapedSubcategory || data.subcategory || ''
                let subcategoryId: string | null = null

                if (subcategoryName) {
                    const subMapKey = `${categoryId}:${subcategoryName.toLowerCase()}`
                    let subId = subcategoryMap.get(subMapKey)

                    if (!subId) {
                        // Buat sub-kategori baru
                        const subSlug = slugify(subcategoryName, { lower: true, locale: 'id', strict: true })
                        const newSubcategory = await prisma.subcategory.create({
                            data: {
                                name: subcategoryName,
                                slug: subSlug || `sub-${Date.now()}`,
                                categoryId,
                            },
                        })
                        subId = newSubcategory.id
                        subcategoryMap.set(subMapKey, subId)
                    }
                    subcategoryId = subId
                }

                // Parse images: prefer scraped images (full carousel), fallback to CSV images
                let imageUrls: string[] = []
                if (scrapedImages.length > 1) {
                    // Use scraped carousel images (skip index 0 which is the main image)
                    imageUrls = scrapedImages.slice(1)
                } else if (data.images) {
                    imageUrls = data.images.split(/[|,;]/).map(u => u.trim()).filter(Boolean)
                }

                // Priority 1: Update existing product matched by shopeeUrl
                if (existingByShopeeUrl) {
                    await prisma.product.update({
                        where: { id: existingByShopeeUrl.id },
                        data: {
                            title,
                            description: description || existingByShopeeUrl.description,
                            price: data.price,
                            originalPrice: data.originalPrice ?? undefined,
                            image: imageUrl || existingByShopeeUrl.image,
                            images: imageUrls.length > 0 ? imageUrls : existingByShopeeUrl.images,
                            shopeeRating: data.shopeeRating ?? existingByShopeeUrl.shopeeRating,
                            shopeeSold: data.shopeeSold ?? existingByShopeeUrl.shopeeSold,
                            shopeeRatingCountStr: data.shopeeRatingCountStr || existingByShopeeUrl.shopeeRatingCountStr,
                            shopeeSoldStr: data.shopeeSoldStr || existingByShopeeUrl.shopeeSoldStr,
                            categoryId,
                            subcategoryId,
                            badge: data.badge || 'NEW',
                            isActive: data.isActive,
                        },
                    })
                    results.push({ row: rowNum, title, status: 'updated' })
                    updated++
                } else {
                    // Priority 2: Check by slug
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
                                image: imageUrl || existing.image,
                                images: imageUrls.length > 0 ? imageUrls : existing.images,
                                shopeeUrl: data.shopeeUrl || existing.shopeeUrl,
                                shopeeRating: data.shopeeRating ?? existing.shopeeRating,
                                shopeeSold: data.shopeeSold ?? existing.shopeeSold,
                                shopeeRatingCountStr: data.shopeeRatingCountStr || existing.shopeeRatingCountStr,
                                shopeeSoldStr: data.shopeeSoldStr || existing.shopeeSoldStr,
                                categoryId,
                                subcategoryId,
                                badge: data.badge || 'NEW',
                                isActive: data.isActive,
                            },
                        })
                        results.push({ row: rowNum, title, status: 'updated' })
                        updated++
                    } else {
                        // CREATE produk baru
                        let finalSlug = slug
                        const slugCheck = await prisma.product.findUnique({ where: { slug: finalSlug } })
                        if (slugCheck) {
                            finalSlug = `${slug}-${Date.now()}`
                        }

                        await prisma.product.create({
                            data: {
                                title,
                                slug: finalSlug,
                                description,
                                price: data.price,
                                originalPrice: data.originalPrice ?? null,
                                image: imageUrl,
                                images: imageUrls,
                                shopeeUrl: data.shopeeUrl || '',
                                shopeeRating: data.shopeeRating ?? null,
                                shopeeSold: data.shopeeSold ?? null,
                                shopeeRatingCountStr: data.shopeeRatingCountStr || null,
                                shopeeSoldStr: data.shopeeSoldStr || null,
                                categoryId,
                                subcategoryId,
                                badge: data.badge || 'NEW',
                                isActive: data.isActive,
                            },
                        })
                        results.push({ row: rowNum, title, status: 'created' })
                        created++
                    }
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
