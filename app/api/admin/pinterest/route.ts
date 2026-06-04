import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'

export const dynamic = 'force-dynamic'

/**
 * Decode HTML entities (e.g. &amp; → &, &nbsp; → space, &#39; → ')
 */
function decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&nbsp;': ' ',
        '&ndash;': '–',
        '&mdash;': '—',
        '&hellip;': '…',
        '&laquo;': '«',
        '&raquo;': '»',
    }
    // Replace named entities
    let result = text.replace(/&[a-zA-Z]+;/g, (match) => entities[match] || match)
    // Replace numeric entities (e.g. &#8220; &#x2014;)
    result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    return result
}

/**
 * Strip HTML tags, decode entities, normalize whitespace for clean description text.
 */
function cleanDescription(html: string | null | undefined): string {
    if (!html) return ''

    let text = html
        // Replace block-level tags with space so words don't merge
        .replace(/<\/(p|div|br|li|h[1-6]|tr|td|th|blockquote|section|article|header|footer)>/gi, ' ')
        // Replace <br>, <br/>, <br /> with space
        .replace(/<br\s*\/?>/gi, ' ')
        // Remove all remaining HTML tags
        .replace(/<[^>]*>/g, '')

    // Decode HTML entities
    text = decodeHtmlEntities(text)

    // Normalize whitespace: collapse multiple spaces/newlines into single space
    text = text.replace(/[\s\r\n]+/g, ' ').trim()

    // Truncate to 500 chars (Pinterest limit)
    if (text.length > 500) {
        text = text.substring(0, 497) + '...'
    }

    return text
}

export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const subcategoryId = searchParams.get('subcategoryId')
    const batchStr = searchParams.get('batch')
    const format = searchParams.get('format')

    const batch = batchStr ? parseInt(batchStr, 10) : 1
    const batchSize = 200
    const skip = (batch - 1) * batchSize

    try {
        // Build where filter
        const where: any = {
            isActive: true,
        }

        if (categoryId && categoryId !== 'all') {
            where.categoryId = categoryId
        }

        if (subcategoryId && subcategoryId !== 'all') {
            where.subcategoryId = subcategoryId
        }

        // Count total matching products
        const totalCount = await prisma.product.count({ where })

        // Fetch products for current batch
        const products = await prisma.product.findMany({
            where,
            include: {
                category: true,
                subcategory: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take: batchSize,
        })

        // Map to Pinterest bulk upload rows
        const csvRows: any[] = []
        let skippedCount = 0

        for (const product of products) {
            // [FIX Bug #3] Skip produk tanpa link Shopee yang valid
            const shopeeLink = (product.shopeeUrl || '').trim()
            if (!shopeeLink || shopeeLink.length < 5) {
                skippedCount++
                continue
            }

            // Collect valid images: filter out empty/null/whitespace-only URLs
            const rawImages = product.images && product.images.length > 0 ? product.images : [product.image]
            const validImages = rawImages.filter((img): img is string => !!img && img.trim() !== '')

            // Skip produk tanpa gambar valid
            if (validImages.length === 0) {
                skippedCount++
                continue
            }

            const hasMultipleImages = validImages.length > 1

            // [FIX Bug #6] Bersihkan deskripsi HTML sekali saja per produk
            const cleanDesc = cleanDescription(product.description)

            const board = product.subcategory?.name || product.category.name || 'Other'

            validImages.forEach((imgUrl, idx) => {
                const title = hasMultipleImages ? `${product.title} - ${idx + 1}` : product.title

                // [FIX Bug #4] Selalu tambahkan utm_source=pinterest untuk tracking
                // Untuk multi-image, tambahkan juga utm_content=pin{index} agar link unik
                let link = shopeeLink
                const separator = link.includes('?') ? '&' : (link.endsWith('/') ? '?' : '/?')
                if (hasMultipleImages) {
                    link = `${link}${separator}utm_source=pinterest&utm_content=pin${idx + 1}`
                } else {
                    link = `${link}${separator}utm_source=pinterest`
                }

                csvRows.push({
                    Title: title,
                    'Media URL': imgUrl,
                    'Pinterest board': board,
                    Thumbnail: '',
                    Description: cleanDesc,
                    Link: link,
                    'Publish date': '',
                    Keywords: '',
                })
            })
        }

        // Handle CSV download request
        if (format === 'csv') {
            const csvContent = Papa.unparse(csvRows)
            const filename = `pinterest-export-batch-${batch}.csv`
            
            return new Response(csvContent, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            })
        }

        // Handle JSON preview request
        return NextResponse.json({
            totalProducts: totalCount,
            batchSize,
            totalPages: Math.ceil(totalCount / batchSize) || 1,
            currentBatch: batch,
            productsCount: products.length,
            skippedCount,
            rowsCount: csvRows.length,
            previewRows: csvRows.slice(0, 10), // First 10 rows
        })

    } catch (error: any) {
        console.error('Error in pinterest export API:', error)
        return NextResponse.json(
            { error: error.message || 'Gagal memproses ekspor Pinterest' },
            { status: 500 }
        )
    }
}
