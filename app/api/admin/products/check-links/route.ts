import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateOrigin } from '@/lib/csrf'
import { revalidateTag } from 'next/cache'
import { extractShopeeIds, getMetaContent, cleanShopeeTitle } from '@/lib/shopee-scraper'

interface CheckStatusState {
    status: 'idle' | 'running' | 'completed' | 'cancelled'
    checked: number
    total: number
    deactivated: number
    logs: string[]
    startedAt: string | null
    completedAt: string | null
}

const SETTING_KEY = 'shopee_link_check_status'

async function getCheckStatus(): Promise<CheckStatusState> {
    const setting = await prisma.siteSettings.findUnique({
        where: { key: SETTING_KEY }
    })
    
    const defaultState: CheckStatusState = {
        status: 'idle',
        checked: 0,
        total: 0,
        deactivated: 0,
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

async function updateStatus(state: Partial<CheckStatusState>) {
    const currentState = await getCheckStatus()
    const newState = { ...currentState, ...state }
    
    // Keep only last 100 log lines to prevent DB column bloat
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

async function verifyShopeeLink(url: string): Promise<{ active: boolean; reason: string }> {
    try {
        if (!url || !url.includes('shopee.co.id')) {
            return { active: false, reason: 'Bukan link Shopee Indonesia' }
        }

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_codedoc.html)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(10000)
        })

        if (!res.ok) {
            return { active: false, reason: `HTTP Status ${res.status}` }
        }

        const finalUrl = res.url
        
        // Check if redirect went to generic home/search/error page
        const ids = extractShopeeIds(url) || extractShopeeIds(finalUrl)
        if (!ids) {
            if (finalUrl.match(/shopee\.co\.id\/?$/) || finalUrl.includes('/search') || finalUrl.includes('/error')) {
                return { active: false, reason: `Dialihkan ke halaman non-produk (${finalUrl})` }
            }
            return { active: false, reason: `ID produk tidak ditemukan di tautan akhir (${finalUrl})` }
        }

        const html = await res.text()
        const rawTitle = getMetaContent(html, 'og:title') || getMetaContent(html, 'twitter:title') || ''
        const cleanTitle = cleanShopeeTitle(rawTitle)

        if (!cleanTitle || cleanTitle.toLowerCase() === 'shopee indonesia') {
            return { active: false, reason: 'Judul produk kosong atau halaman tidak aktif' }
        }

        const boilerplateTitles = [
            'situs belanja online terlengkap',
            'belanja online',
            'produk tidak ditemukan',
            'halaman tidak ditemukan',
            'tidak aktif'
        ]
        
        if (boilerplateTitles.some(term => cleanTitle.toLowerCase().includes(term))) {
            return { active: false, reason: `Judul terdeteksi sebagai halaman eror/generic: "${cleanTitle}"` }
        }

        return { active: true, reason: 'Tautan aktif' }
    } catch (error: any) {
        return { active: false, reason: `Error: ${error.message || 'Koneksi gagal'}` }
    }
}

async function runLinkCheckInBackground() {
    try {
        const products = await prisma.product.findMany({
            where: {
                shopeeUrl: {
                    not: ''
                }
            },
            select: {
                id: true,
                title: true,
                shopeeUrl: true,
                isActive: true
            }
        })
        
        const activeProducts = products.filter(p => p.shopeeUrl && p.shopeeUrl.trim() !== '')
        
        await updateStatus({
            status: 'running',
            total: activeProducts.length,
            checked: 0,
            deactivated: 0,
            logs: [`Menemukan ${activeProducts.length} produk dengan link Shopee. Memulai verifikasi...`],
            startedAt: new Date().toISOString(),
            completedAt: null
        })
        
        let checkedCount = 0
        let deactivatedCount = 0
        
        for (const product of activeProducts) {
            // Check cancellation status at the start of each product check
            const currentSetting = await prisma.siteSettings.findUnique({
                where: { key: SETTING_KEY }
            })
            if (currentSetting) {
                const currentStatus = JSON.parse(currentSetting.value)
                if (currentStatus.status === 'cancelled') {
                    await prisma.siteSettings.update({
                        where: { key: SETTING_KEY },
                        data: {
                            value: JSON.stringify({
                                ...currentStatus,
                                status: 'cancelled',
                                completedAt: new Date().toISOString(),
                                logs: [...currentStatus.logs, '❌ Verifikasi dibatalkan oleh Admin.']
                            })
                        }
                    })
                    return
                }
            }
            
            checkedCount++
            const checkResult = await verifyShopeeLink(product.shopeeUrl!)
            
            let logMsg = ''
            if (checkResult.active) {
                logMsg = `✅ [${checkedCount}/${activeProducts.length}] ${product.title} -> AKTIF`
            } else {
                deactivatedCount++
                logMsg = `⚠️ [${checkedCount}/${activeProducts.length}] ${product.title} -> NONAKTIF (${checkResult.reason})`
                
                // Deactivate in db
                await prisma.product.update({
                    where: { id: product.id },
                    data: { isActive: false }
                })
            }
            
            // Read latest status state to update progress and logs
            const latestStatus = await getCheckStatus()
            if (latestStatus.status === 'cancelled') {
                return // Avoid racing if cancelled in between
            }
            
            await updateStatus({
                checked: checkedCount,
                deactivated: deactivatedCount,
                logs: [...latestStatus.logs, logMsg]
            })
            
            // Throttled Sequential delay (1.5 seconds) to prevent Shopee IP rate limit/ban
            await new Promise(resolve => setTimeout(resolve, 1500))
        }
        
        // Completed successfully
        const finalStatus = await getCheckStatus()
        if (finalStatus.status === 'running') {
            await prisma.siteSettings.update({
                where: { key: SETTING_KEY },
                data: {
                    value: JSON.stringify({
                        ...finalStatus,
                        status: 'completed',
                        completedAt: new Date().toISOString(),
                        logs: [...finalStatus.logs, `🎉 Verifikasi selesai! ${checkedCount} produk diperiksa. ${deactivatedCount} produk dinonaktifkan.`]
                    })
                }
            })
        }
        
        // Revalidate tags to clear cache for public pages
        revalidateTag('products', { expire: 0 })
        
    } catch (error: any) {
        console.error('Link check background worker failed:', error)
        const latestStatus = await getCheckStatus()
        await prisma.siteSettings.update({
            where: { key: SETTING_KEY },
            data: {
                value: JSON.stringify({
                    ...latestStatus,
                    status: 'idle',
                    completedAt: new Date().toISOString(),
                    logs: [...latestStatus.logs, `❌ Terjadi kesalahan sistem: ${error.message || error}`]
                })
            }
        })
    }
}

export async function GET(request: NextRequest) {
    if (!validateOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await getCheckStatus()
    return NextResponse.json(status)
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
        const { action } = body

        if (action === 'start') {
            const currentStatus = await getCheckStatus()
            
            // Allow restarting if status is idle, completed, cancelled, or running but timed out (> 10 minutes)
            if (currentStatus.status === 'running') {
                const startedAt = currentStatus.startedAt ? new Date(currentStatus.startedAt).getTime() : 0
                const tenMinutesAgo = Date.now() - 10 * 60 * 1000
                if (startedAt > tenMinutesAgo) {
                    // Let it fall through to restart
                } else {
                    return NextResponse.json({ error: 'Proses verifikasi sedang berjalan' }, { status: 400 })
                }
            }

            // Trigger background task (does NOT await)
            runLinkCheckInBackground()

            return NextResponse.json({ message: 'Verifikasi tautan dimulai' }, { status: 202 })
        }

        if (action === 'cancel') {
            const currentStatus = await getCheckStatus()
            if (currentStatus.status !== 'running') {
                return NextResponse.json({ error: 'Tidak ada proses verifikasi yang sedang berjalan' }, { status: 400 })
            }

            await updateStatus({
                status: 'cancelled',
                logs: [...currentStatus.logs, '⏱️ Membatalkan verifikasi...']
            })

            return NextResponse.json({ message: 'Proses pembatalan dikirim' })
        }

        return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Terjadi kesalahan internal' }, { status: 500 })
    }
}
