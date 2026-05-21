import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { scrapeShopeeProduct } from '@/lib/shopee-scraper'
import { validateOrigin } from '@/lib/csrf'
import { captureError } from '@/lib/sentry-helpers'

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
        const { url } = body

        if (!url) {
            return NextResponse.json(
                { error: 'Tautan Shopee wajib diisi' },
                { status: 400 }
            )
        }

        if (!url.includes('shopee.co.id')) {
            return NextResponse.json(
                { error: 'Harus berupa tautan Shopee Indonesia (shopee.co.id)' },
                { status: 400 }
            )
        }

        const data = await scrapeShopeeProduct(url)

        return NextResponse.json(data)
    } catch (err: any) {
        console.error('Error in scrape-shopee route:', err)
        captureError(err, { endpoint: '/api/admin/products/scrape-shopee' })
        return NextResponse.json(
            { error: err.message || 'Gagal mengambil data dari Shopee' },
            { status: 500 }
        )
    }
}
