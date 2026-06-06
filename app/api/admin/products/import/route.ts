import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CsvProductSchema } from '@/lib/validations'
import { validateOrigin } from '@/lib/csrf'
import { sanitizeText, sanitizeDescription } from '@/lib/sanitize'
import slugify from 'slugify'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { scrapeShopeeProduct, classifyCategoryFromTitle } from '@/lib/shopee-scraper'
import { generateProductSlug } from '@/lib/utils'

const MAX_PRODUCTS_PER_IMPORT = 100

/**
 * Normalize category name for fuzzy matching.
 * Handles: lowercase, trim, "&" vs "dan", remove extra whitespace, strip accents.
 */
function normalizeCategoryName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/&/g, 'dan')
        .replace(/\s+/g, ' ')
        .replace(/[''""]/g, '')
        .trim()
}

/**
 * Find category ID using fuzzy matching.
 * First tries exact match, then normalized match, then slug-based match.
 */
function findCategoryIdFuzzy(
    categoryName: string,
    categoryMap: Map<string, string>,
    categorySlugMap: Map<string, string>
): string | undefined {
    // 1. Exact lowercase match
    const exact = categoryMap.get(categoryName.toLowerCase())
    if (exact) return exact

    // 2. Normalized match (handles & vs dan, extra spaces, etc.)
    const normalized = normalizeCategoryName(categoryName)
    for (const [key, id] of categoryMap.entries()) {
        if (normalizeCategoryName(key) === normalized) {
            return id
        }
    }

    // 3. Slug-based match
    const slug = slugify(categoryName, { lower: true, locale: 'id', strict: true })
    const slugMatch = categorySlugMap.get(slug)
    if (slugMatch) return slugMatch

    // 4. Partial match - if the category name is contained in an existing category name
    for (const [key, id] of categoryMap.entries()) {
        if (key.includes(categoryName.toLowerCase()) || categoryName.toLowerCase().includes(key)) {
            return id
        }
    }

    return undefined
}

function findSubcategoryIdFuzzy(
    subName: string,
    categoryId: string,
    existingSubcategories: { id: string; name: string; slug: string; categoryId: string }[]
): string | undefined {
    const targetNormalized = normalizeCategoryName(subName)
    const targetSlug = slugify(subName, { lower: true, locale: 'id', strict: true })

    // Filter subcategories for this category first
    const subs = existingSubcategories.filter(s => s.categoryId === categoryId)

    // 1. Exact lowercase match
    const exact = subs.find(s => s.name.toLowerCase() === subName.toLowerCase())
    if (exact) return exact.id

    // 2. Normalized match
    for (const sub of subs) {
        if (normalizeCategoryName(sub.name) === targetNormalized) {
            return sub.id
        }
    }

    // 3. Slug match
    for (const sub of subs) {
        if (sub.slug === targetSlug) {
            return sub.id
        }
    }

    // 4. Partial match
    for (const sub of subs) {
        const subLower = sub.name.toLowerCase()
        const targetLower = subName.toLowerCase()
        if (subLower.includes(targetLower) || targetLower.includes(subLower)) {
            return sub.id
        }
    }

    return undefined
}

function isValidProductImage(url: string | null | undefined): boolean {
    if (!url) return false
    if (url.includes('unsplash.com')) return false
    if (url.includes('placeholder')) return false
    return true
}

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
    if (!session || (session.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { products, autoScrape = true } = body

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
        const categorySlugMap = new Map<string, string>() // slug -> id
        for (const cat of existingCategories) {
            categoryMap.set(cat.name.toLowerCase(), cat.id)
            categorySlugMap.set(cat.slug, cat.id)
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

                // Check if shopeeUrl already exists in database (for UPDATE instead of duplicate skip)
                let existingByShopeeUrl: { id: string; slug: string; image: string; images: string[]; description: string; shopeeRating: number | null; shopeeSold: number | null; shopeeRatingCountStr: string | null; shopeeSoldStr: string | null; badge: string | null; categoryId: string; subcategoryId: string | null; price: number; originalPrice: number | null; } | null = null
                if (data.shopeeUrl) {
                    existingByShopeeUrl = await prisma.product.findFirst({
                        where: { shopeeUrl: data.shopeeUrl },
                        select: { id: true, slug: true, image: true, images: true, description: true, shopeeRating: true, shopeeSold: true, shopeeRatingCountStr: true, shopeeSoldStr: true, badge: true, categoryId: true, subcategoryId: true, price: true, originalPrice: true }
                    })
                }

                let slug = generateProductSlug(title)

                // If not found by Shopee URL, check if found by Slug to detect database duplicates
                let existingBySlug: { id: string; slug: string; image: string; images: string[]; description: string; shopeeRating: number | null; shopeeSold: number | null; shopeeRatingCountStr: string | null; shopeeSoldStr: string | null; badge: string | null; categoryId: string; subcategoryId: string | null; price: number; originalPrice: number | null; } | null = null
                if (!existingByShopeeUrl) {
                    existingBySlug = await prisma.product.findUnique({
                        where: { slug },
                        select: { id: true, slug: true, image: true, images: true, description: true, shopeeRating: true, shopeeSold: true, shopeeRatingCountStr: true, shopeeSoldStr: true, badge: true, categoryId: true, subcategoryId: true, price: true, originalPrice: true }
                    })
                }

                const matchedProduct = existingByShopeeUrl || existingBySlug
                const alreadyExists = !!matchedProduct
                const hasImage = isValidProductImage(matchedProduct?.image)
                const hasSubcategory = !!(matchedProduct && matchedProduct.subcategoryId)
                const hasAdditionalImages = !!(matchedProduct && matchedProduct.images && matchedProduct.images.length > 0)

                // If product exists but is in the "Other" category, force scrape to classify it properly
                const otherCategory = existingCategories.find(c => c.slug === 'other' || c.name.toLowerCase() === 'other')
                const isOtherCategory = !!(matchedProduct && otherCategory && matchedProduct.categoryId === otherCategory.id)

                // Scrape Shopee when URL exists to get images, description, category, etc.
                let scrapedCategory = ''
                let scrapedSubcategory = ''
                let scrapedImages: string[] = []
                let scrapedPrice: number | null = null
                let scrapedSuccess = false
                
                const shouldScrape = autoScrape && data.shopeeUrl && (
                    !alreadyExists || 
                    !hasImage || 
                    !hasSubcategory || 
                    !hasAdditionalImages || 
                    isOtherCategory
                )

                let scrapedDescription = ''
                let scrapedTitle = ''
                let scrapedImageUrl = ''

                if (shouldScrape) {
                    try {
                        const scraped = await scrapeShopeeProduct(data.shopeeUrl)
                        scrapedSuccess = true
                        
                        if (scraped.title) {
                            scrapedTitle = scraped.title
                        }
                        if (scraped.description) {
                            scrapedDescription = scraped.description
                        }
                        if (scraped.imageUrl) {
                            scrapedImageUrl = scraped.imageUrl
                        }
                        if (scraped.category) {
                            scrapedCategory = scraped.category
                        }
                        if (scraped.subcategory) {
                            scrapedSubcategory = scraped.subcategory
                        }
                        if (scraped.price && scraped.price > 0) {
                            scrapedPrice = scraped.price
                        }
                        // Capture ALL scraped images (carousel)
                        if (scraped.images && scraped.images.length > 0) {
                            scrapedImages = scraped.images
                            if (!scrapedImageUrl && scrapedImages.length > 0) {
                                scrapedImageUrl = scrapedImages[0]
                            }
                        }
                    } catch (err) {
                        console.error(`Gagal scraping on-the-fly untuk URL: ${data.shopeeUrl}`, err)
                    }
                }

                // Fallback: use title-based keyword classifier when scraping failed or returned no category
                // This ensures products get proper categories even when Shopee blocks server-side scraping
                if (!scrapedCategory && title) {
                    const classified = classifyCategoryFromTitle(title)
                    if (classified) {
                        scrapedCategory = classified.category
                        scrapedSubcategory = classified.subcategory
                    }
                }

                // Resolve product title
                if (scrapedSuccess && scrapedTitle) {
                    title = sanitizeText(scrapedTitle)
                }

                slug = generateProductSlug(title)

                // Resolve description
                let description = data.description || ''
                if (scrapedSuccess && scrapedDescription) {
                    description = sanitizeDescription(scrapedDescription)
                } else if (matchedProduct?.description) {
                    description = matchedProduct.description
                }
                
                if (!description) {
                    description = `Dapatkan ${title} original berkualitas terbaik hanya di Roxy Store! Produk pilihan ini dirancang dengan desain modern dan material berkualitas untuk memberikan kenyamanan serta keandalan maksimal dalam penggunaan sehari-hari.`
                }

                // Resolve main image
                // Priority: scraped image > existing valid DB image > CSV image
                let imageUrl = data.image || ''
                if (scrapedSuccess && scrapedImageUrl) {
                    imageUrl = scrapedImageUrl
                } else if (matchedProduct?.image && isValidProductImage(matchedProduct.image)) {
                    // Preserve existing valid product image when scraping fails
                    imageUrl = matchedProduct.image
                }
                if ((!imageUrl || !isValidProductImage(imageUrl)) && scrapedImages.length > 0) {
                    imageUrl = scrapedImages[0]
                }

                // Resolve gallery images
                // Priority: scraped gallery > existing DB gallery > CSV gallery
                let imageUrls: string[] = []
                if (scrapedSuccess && scrapedImages.length > 1) {
                    imageUrls = scrapedImages.slice(1)
                } else if (matchedProduct?.images && matchedProduct.images.length > 0) {
                    // Preserve existing gallery images when scraping fails
                    imageUrls = matchedProduct.images
                } else if (data.images) {
                    imageUrls = data.images.split(/[|,;]/).map(u => u.trim()).filter(Boolean)
                }

                // Resolve price
                // Priority: scraped live price > existing DB price > CSV price
                let price = data.price
                if (scrapedSuccess && scrapedPrice && scrapedPrice > 0) {
                    // Best: live price from Shopee page
                    price = scrapedPrice
                } else if (matchedProduct && matchedProduct.price > 0) {
                    // Existing product: preserve DB price when scraping fails
                    // CSV prices from Shopee Affiliate exports are often outdated
                    price = matchedProduct.price
                }

                // Resolve category and subcategory
                let finalCategoryName = ''
                let finalSubcategoryName = ''

                if (scrapedCategory) {
                    finalCategoryName = scrapedCategory
                    finalSubcategoryName = scrapedSubcategory
                } else if (data.category && data.category !== 'Other') {
                    finalCategoryName = data.category
                    finalSubcategoryName = data.subcategory || ''
                }

                let categoryId = matchedProduct?.categoryId
                let subcategoryId = matchedProduct?.subcategoryId

                if (finalCategoryName) {
                    let resolvedCatId = findCategoryIdFuzzy(finalCategoryName, categoryMap, categorySlugMap)
                    if (!resolvedCatId) {
                        const catSlug = slugify(finalCategoryName, { lower: true, locale: 'id', strict: true })
                        const newCategory = await prisma.category.create({
                            data: {
                                name: finalCategoryName,
                                slug: catSlug || `cat-${Date.now()}`,
                            },
                        })
                        resolvedCatId = newCategory.id
                        categoryMap.set(finalCategoryName.toLowerCase(), resolvedCatId)
                        categorySlugMap.set(newCategory.slug, resolvedCatId)
                    }
                    categoryId = resolvedCatId

                    if (finalSubcategoryName) {
                        const subMapKey = `${categoryId}:${finalSubcategoryName.toLowerCase()}`
                        let subId = subcategoryMap.get(subMapKey)
                        if (!subId) {
                            subId = findSubcategoryIdFuzzy(finalSubcategoryName, categoryId, existingSubcategories)
                        }
                        if (!subId) {
                            const subSlug = slugify(finalSubcategoryName, { lower: true, locale: 'id', strict: true })
                            const newSubcategory = await prisma.subcategory.create({
                                data: {
                                    name: finalSubcategoryName,
                                    slug: subSlug || `sub-${Date.now()}`,
                                    categoryId,
                                },
                            })
                            subId = newSubcategory.id
                            subcategoryMap.set(subMapKey, subId)
                            existingSubcategories.push(newSubcategory)
                        }
                        subcategoryId = subId
                    } else if (scrapedSuccess) {
                        // If successfully scraped but no subcategory returned, clear subcategory
                        subcategoryId = null
                    }
                } else if (!categoryId) {
                    // Fallback for brand-new products if category is missing or default
                    const categoryName = 'Other'
                    let resolvedCatId = findCategoryIdFuzzy(categoryName, categoryMap, categorySlugMap)
                    if (!resolvedCatId) {
                        const catSlug = slugify(categoryName, { lower: true, locale: 'id', strict: true })
                        const newCategory = await prisma.category.create({
                            data: {
                                name: categoryName,
                                slug: catSlug || `cat-${Date.now()}`,
                            },
                        })
                        resolvedCatId = newCategory.id
                        categoryMap.set(categoryName.toLowerCase(), resolvedCatId)
                        categorySlugMap.set(newCategory.slug, resolvedCatId)
                    }
                    categoryId = resolvedCatId
                    subcategoryId = null
                }

                // Priority 1: Update existing product matched by shopeeUrl
                if (existingByShopeeUrl) {
                    await prisma.product.update({
                        where: { id: existingByShopeeUrl.id },
                        data: {
                            title,
                            description,
                            price,
                            originalPrice: data.originalPrice ?? undefined,
                            image: imageUrl,
                            images: imageUrls,
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
                                description,
                                price,
                                originalPrice: data.originalPrice ?? existing.originalPrice,
                                image: imageUrl,
                                images: imageUrls,
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
                                price,
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
