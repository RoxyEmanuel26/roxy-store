import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { validateOrigin } from '@/lib/csrf'
import { scrapeShopeeProduct } from '@/lib/shopee-scraper'
import { productRepository } from '@/repositories/product.repository'
import { revalidateTag } from 'next/cache'
import { captureError } from '@/lib/sentry-helpers'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!validateOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const product = await productRepository.findById(id)

    if (!product) {
        return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    if (!product.shopeeUrl) {
        return NextResponse.json(
            { error: 'Produk ini tidak memiliki tautan Shopee untuk disinkronisasi' },
            { status: 400 }
        )
    }

    try {
        const body = await request.json()
        const { action } = body

        if (!action || (action !== 'price' && action !== 'content')) {
            return NextResponse.json(
                { error: 'Action harus berupa "price" atau "content"' },
                { status: 400 }
            )
        }

        console.log(`Syncing product: "${product.title}" (${id}), action: ${action}`)
        const scraped = await scrapeShopeeProduct(product.shopeeUrl)

        if (action === 'price') {
            if (scraped.price === undefined || scraped.price === null || scraped.price <= 0) {
                return NextResponse.json(
                    { error: 'Harga produk tidak ditemukan atau tidak valid di Shopee' },
                    { status: 422 }
                )
            }

            const updatedProduct = await productRepository.update(id, {
                price: scraped.price
            })

            revalidateTag('products', { expire: 0 })
            revalidateTag('categories', { expire: 0 })

            return NextResponse.json({
                message: 'Harga berhasil diperbarui!',
                product: updatedProduct
            })
        } else {
            // Action is content (images & description)
            if (!scraped.description && (!scraped.images || scraped.images.length === 0)) {
                return NextResponse.json(
                    { error: 'Gagal mengambil deskripsi atau gambar dari Shopee' },
                    { status: 422 }
                )
            }

            const updateData: Record<string, any> = {}
            if (scraped.description) {
                updateData.description = scraped.description
            }
            if (scraped.images && scraped.images.length > 0) {
                updateData.image = scraped.images[0]
                updateData.images = scraped.images
            }

            const updatedProduct = await productRepository.update(id, updateData)

            revalidateTag('products', { expire: 0 })
            revalidateTag('categories', { expire: 0 })

            return NextResponse.json({
                message: 'Deskripsi dan gambar berhasil diperbarui!',
                product: updatedProduct
            })
        }
    } catch (err: any) {
        console.error('Error in sync-product route:', err)
        captureError(err, { endpoint: `/api/admin/products/${id}/sync` })
        return NextResponse.json(
            { error: err.message || 'Gagal sinkronisasi dengan Shopee' },
            { status: 500 }
        )
    }
}
