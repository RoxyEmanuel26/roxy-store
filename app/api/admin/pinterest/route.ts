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

        // Fetch all matching products to build the complete rows
        const products = await prisma.product.findMany({
            where,
            include: {
                category: true,
                subcategory: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        // Map to Pinterest bulk upload rows
        const allCsvRows: any[] = []
        const skippedProducts: { id: string; title: string; reason: string }[] = []

        for (const product of products) {
            // Check Shopee Link
            const shopeeLink = (product.shopeeUrl || '').trim()
            if (!shopeeLink || shopeeLink.length < 5) {
                skippedProducts.push({
                    id: product.id,
                    title: product.title,
                    reason: 'Tidak memiliki link Shopee yang valid atau kosong'
                })
                continue
            }

            // Collect valid images: filter out empty/null/whitespace-only URLs
            const rawImages = product.images && product.images.length > 0 ? product.images : [product.image]
            const validImages = rawImages.filter((img): img is string => !!img && img.trim() !== '')

            // Skip produk tanpa gambar valid
            if (validImages.length === 0) {
                skippedProducts.push({
                    id: product.id,
                    title: product.title,
                    reason: 'Tidak memiliki gambar produk yang valid'
                })
                continue
            }

            const hasMultipleImages = validImages.length > 1

            // Bersihkan deskripsi HTML sekali saja per produk
            const cleanDesc = cleanDescription(product.description)

            const board = product.subcategory?.name || product.category.name || 'Other'

            validImages.forEach((imgUrl, idx) => {
                const title = hasMultipleImages ? `${product.title} - ${idx + 1}` : product.title

                // Selalu tambahkan utm_source=pinterest untuk tracking
                // Untuk multi-image, tambahkan juga utm_content=pin{index} agar link unik
                let link = shopeeLink
                const separator = link.includes('?') ? '&' : (link.endsWith('/') ? '?' : '/?')
                if (hasMultipleImages) {
                    link = `${link}${separator}utm_source=pinterest&utm_content=pin${idx + 1}`
                } else {
                    link = `${link}${separator}utm_source=pinterest`
                }

                allCsvRows.push({
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

        const totalRows = allCsvRows.length
        const totalPages = Math.ceil(totalRows / batchSize) || 1
        const currentBatch = Math.min(Math.max(1, batch), totalPages)
        
        const startIdx = (currentBatch - 1) * batchSize
        const endIdx = startIdx + batchSize
        const batchRows = allCsvRows.slice(startIdx, endIdx)

        // Handle CSV download request
        if (format === 'csv') {
            const csvContent = Papa.unparse(batchRows)
            const filename = `pinterest-export-batch-${currentBatch}.csv`
            
            return new Response(csvContent, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            })
        }

        // Handle JSON preview request
        return NextResponse.json({
            totalProducts: products.length,
            totalRows,
            batchSize,
            totalPages,
            currentBatch,
            rowsCount: batchRows.length,
            skippedCount: skippedProducts.length,
            skippedProducts,
            previewRows: batchRows.slice(0, 10), // First 10 rows of current batch
        })

    } catch (error: any) {
        console.error('Error in pinterest export API:', error)
        return NextResponse.json(
            { error: error.message || 'Gagal memproses ekspor Pinterest' },
            { status: 500 }
        )
    }
}
