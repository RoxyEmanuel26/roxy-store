import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateOrigin } from '@/lib/csrf'
import { revalidateTag } from 'next/cache'
import { scrapeShopeeProduct, classifyCategoryFromTitle } from '@/lib/shopee-scraper'
import slugify from 'slugify'

interface SyncBatchStatusState {
    status: 'idle' | 'running' | 'completed' | 'cancelled'
    syncType: 'data' | 'image' | 'description' | null
    checked: number
    total: number
    updated: number
    logs: string[]
    startedAt: string | null
    completedAt: string | null
}

const SETTING_KEY = 'shopee_sync_batch_status'

async function getSyncStatus(): Promise<SyncBatchStatusState> {
    const setting = await prisma.siteSettings.findUnique({
        where: { key: SETTING_KEY }
    })
    
    const defaultState: SyncBatchStatusState = {
        status: 'idle',
        syncType: null,
        checked: 0,
        total: 0,
        updated: 0,
        logs: [],
        startedAt: null,
        completedAt: null
    }

    if (!setting) return defaultState

    try {
        return JSON.parse(setting.value)
    } catch {
        return defaultState
    }
}

async function updateStatus(state: Partial<SyncBatchStatusState>) {
    const currentState = await getSyncStatus()
    const newState = { ...currentState, ...state }
    
    if (newState.logs.length > 100) {
        newState.logs = newState.logs.slice(-100)
    }
    
    await prisma.siteSettings.upsert({
        where: { key: SETTING_KEY },
        create: {
            key: SETTING_KEY,
            value: JSON.stringify(newState)
        },
        update: {
            value: JSON.stringify(newState)
        }
    })
    
    return newState
}

export async function GET(request: NextRequest) {
    if (!validateOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await getSyncStatus()
    return NextResponse.json(status)
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
        const { action, syncType, productId } = body

        if (action === 'start') {
            if (!syncType) {
                return NextResponse.json({ error: 'syncType required' }, { status: 400 })
            }

            const products = await prisma.product.findMany({
                where: {
                    shopeeUrl: { not: '' }
                },
                select: { id: true, title: true, shopeeUrl: true }
            })

            const activeProducts = products.filter(p => p.shopeeUrl && p.shopeeUrl.trim() !== '')

            let logTypeStr = 'Data (Kategori & Harga)'
            if (syncType === 'image') logTypeStr = 'Gambar'
            if (syncType === 'description') logTypeStr = 'Deskripsi'

            const startedState: SyncBatchStatusState = {
                status: 'running',
                syncType,
                total: activeProducts.length,
                checked: 0,
                updated: 0,
                logs: [`Menemukan ${activeProducts.length} produk. Memulai sinkronisasi massal ${logTypeStr}...`],
                startedAt: new Date().toISOString(),
                completedAt: null
            }

            await prisma.siteSettings.upsert({
                where: { key: SETTING_KEY },
                create: { key: SETTING_KEY, value: JSON.stringify(startedState) },
                update: { value: JSON.stringify(startedState) }
            })

            return NextResponse.json({
                message: 'Sinkronisasi massal dimulai',
                products: activeProducts,
                status: startedState
            })
        }

        if (action === 'sync-single') {
            if (!productId || !syncType) {
                return NextResponse.json({ error: 'productId and syncType required' }, { status: 400 })
            }

            const product = await prisma.product.findUnique({
                where: { id: productId },
                include: { category: true }
            })

            if (!product || !product.shopeeUrl) {
                return NextResponse.json({ error: 'Produk tidak ditemukan atau tidak memiliki URL Shopee' }, { status: 404 })
            }

            const latestStatus = await getSyncStatus()
            if (latestStatus.status !== 'running') {
                return NextResponse.json({ error: 'Sinkronisasi tidak sedang berjalan' }, { status: 400 })
            }

            let logMsg = ''
            const currentChecked = latestStatus.checked + 1
            let isUpdated = false

            try {
                const scraped = await scrapeShopeeProduct(product.shopeeUrl)
                let updateData: any = {}

                if (syncType === 'data') {
                    if (scraped.price && scraped.price > 0) updateData.price = scraped.price
                    if (scraped.title) updateData.title = scraped.title

                    let categoryName = scraped.category
                    let subcategoryName = scraped.subcategory

                    if (!categoryName && scraped.title) {
                        const classified = classifyCategoryFromTitle(scraped.title)
                        if (classified) {
                            categoryName = classified.category
                            subcategoryName = classified.subcategory
                        }
                    }

                    if (categoryName) {
                        // Find category
                        let category = await prisma.category.findFirst({
                            where: { name: { equals: categoryName, mode: 'insensitive' } }
                        })
                        if (!category) {
                            category = await prisma.category.create({
                                data: { name: categoryName, slug: slugify(categoryName, { lower: true, strict: true }) }
                            })
                        }
                        updateData.categoryId = category.id

                        if (subcategoryName) {
                            let subcategory = await prisma.subcategory.findFirst({
                                where: { categoryId: category.id, name: { equals: subcategoryName, mode: 'insensitive' } }
                            })
                            if (!subcategory) {
                                subcategory = await prisma.subcategory.create({
                                    data: { name: subcategoryName, categoryId: category.id, slug: slugify(subcategoryName, { lower: true, strict: true }) }
                                })
                            }
                            updateData.subcategoryId = subcategory.id
                        } else {
                            updateData.subcategoryId = null
                        }
                    }

                    if (Object.keys(updateData).length > 0) {
                        await prisma.product.update({ where: { id: product.id }, data: updateData })
                        isUpdated = true
                        logMsg = `✅ [${currentChecked}/${latestStatus.total}] ${product.title} -> Kategori/Harga Diperbarui`
                    } else {
                        logMsg = `⚠️ [${currentChecked}/${latestStatus.total}] ${product.title} -> Tidak ada data baru`
                    }
                } else if (syncType === 'image') {
                    if (scraped.imageUrl) updateData.image = scraped.imageUrl
                    if (scraped.images && scraped.images.length > 0) updateData.images = scraped.images
                    
                    if (Object.keys(updateData).length > 0) {
                        await prisma.product.update({ where: { id: product.id }, data: updateData })
                        isUpdated = true
                        logMsg = `✅ [${currentChecked}/${latestStatus.total}] ${product.title} -> Gambar Diperbarui`
                    } else {
                        logMsg = `⚠️ [${currentChecked}/${latestStatus.total}] ${product.title} -> Gambar gagal diambil`
                    }
                } else if (syncType === 'description') {
                    if (scraped.description) {
                        await prisma.product.update({ where: { id: product.id }, data: { description: scraped.description } })
                        isUpdated = true
                        logMsg = `✅ [${currentChecked}/${latestStatus.total}] ${product.title} -> Deskripsi Diperbarui`
                    } else {
                        logMsg = `⚠️ [${currentChecked}/${latestStatus.total}] ${product.title} -> Deskripsi kosong`
                    }
                }

            } catch (err: any) {
                logMsg = `❌ [${currentChecked}/${latestStatus.total}] ${product.title} -> Gagal (${err.message || 'Scrape Error'})`
            }

            const updatedLogs = [...latestStatus.logs, logMsg]
            const newUpdatedCount = latestStatus.updated + (isUpdated ? 1 : 0)

            const updatedState = await updateStatus({
                checked: currentChecked,
                updated: newUpdatedCount,
                logs: updatedLogs
            })

            return NextResponse.json({ success: true, status: updatedState })
        }

        if (action === 'cancel') {
            const latestStatus = await getSyncStatus()
            const updatedState = await updateStatus({
                status: 'cancelled',
                completedAt: new Date().toISOString(),
                logs: [...latestStatus.logs, '❌ Sinkronisasi massal dibatalkan oleh Admin.']
            })
            return NextResponse.json({ success: true, status: updatedState })
        }

        if (action === 'complete') {
            const latestStatus = await getSyncStatus()
            const updatedState = await updateStatus({
                status: 'completed',
                completedAt: new Date().toISOString(),
                logs: [...latestStatus.logs, `🎉 Sinkronisasi massal selesai! ${latestStatus.updated} produk berhasil diperbarui.`]
            })
            revalidateTag('products', { expire: 0 })
            revalidateTag('categories', { expire: 0 })
            return NextResponse.json({ success: true, status: updatedState })
        }

        return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Terjadi kesalahan internal' }, { status: 500 })
    }
}
