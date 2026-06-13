import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateOrigin } from '@/lib/csrf'
import { revalidateTag } from 'next/cache'

interface CheckStatusState {
    status: 'idle' | 'running' | 'completed' | 'cancelled'
    checked: number
    total: number
    deactivated: number
    logs: string[]
    startedAt: string | null
    completedAt: string | null
}

const SETTING_KEY = 'shopee_image_check_status'

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

async function verifyImageLink(url: string): Promise<{ active: boolean; reason: string }> {
    try {
        if (!url) {
            return { active: false, reason: 'URL kosong' }
        }
        if (!url.startsWith('http')) {
            // For local paths like /icon kategori/ or /banners/
            return { active: true, reason: 'Gambar lokal' }
        }

        // Try HEAD request first
        const res = await fetch(url, {
            method: 'HEAD',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(6000)
        })

        if (res.ok) {
            return { active: true, reason: 'Gambar aktif' }
        }

        // Try GET request if HEAD is not allowed (405, 403, 501)
        if (res.status === 405 || res.status === 403 || res.status === 501) {
            const getRes = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                signal: AbortSignal.timeout(6000)
            })
            if (getRes.ok) {
                return { active: true, reason: 'Gambar aktif (GET)' }
            }
            return { active: false, reason: `HTTP Status ${getRes.status}` }
        }

        return { active: false, reason: `HTTP Status ${res.status}` }
    } catch (error: any) {
        return { active: false, reason: `Error: ${error.message || 'Koneksi gagal'}` }
    }
}

export async function GET(request: NextRequest) {
    if (!validateOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
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
    if (!session || (session.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { action } = body

        if (action === 'start') {
            const activeProducts = await prisma.product.findMany({
                where: {
                    isActive: true,
                    image: { not: '' }
                },
                select: {
                    id: true,
                    title: true,
                    image: true
                }
            })

            const startedState: CheckStatusState = {
                status: 'running',
                total: activeProducts.length,
                checked: 0,
                deactivated: 0,
                logs: [`Menemukan ${activeProducts.length} produk aktif dengan gambar. Memulai verifikasi...`],
                startedAt: new Date().toISOString(),
                completedAt: null
            }

            await prisma.siteSettings.upsert({
                where: { key: SETTING_KEY },
                create: {
                    key: SETTING_KEY,
                    value: JSON.stringify(startedState)
                },
                update: {
                    value: JSON.stringify(startedState)
                }
            })

            return NextResponse.json({
                message: 'Pengecekan gambar dimulai',
                products: activeProducts,
                status: startedState
            })
        }

        if (action === 'check-single') {
            const { productId } = body
            if (!productId) {
                return NextResponse.json({ error: 'productId required' }, { status: 400 })
            }

            const product = await prisma.product.findUnique({
                where: { id: productId },
                select: { id: true, title: true, image: true }
            })

            if (!product || !product.image) {
                return NextResponse.json({ error: 'Produk tidak ditemukan atau tidak memiliki gambar' }, { status: 404 })
            }

            const latestStatus = await getCheckStatus()
            if (latestStatus.status !== 'running') {
                return NextResponse.json({ error: 'Pengecekan tidak sedang berjalan' }, { status: 400 })
            }

            const checkResult = await verifyImageLink(product.image)
            let isDeactivated = false

            let logMsg = ''
            const currentChecked = latestStatus.checked + 1
            if (checkResult.active) {
                logMsg = `✅ [${currentChecked}/${latestStatus.total}] ${product.title} -> GAMBAR AKTIF`
            } else {
                isDeactivated = true
                logMsg = `⚠️ [${currentChecked}/${latestStatus.total}] ${product.title} -> GAMBAR MATI (${checkResult.reason})`

                // Deactivate product in Postgres since its image is broken
                await prisma.product.update({
                    where: { id: product.id },
                    data: { isActive: false }
                })
            }

            const updatedLogs = [...latestStatus.logs, logMsg]
            const newDeactivatedCount = latestStatus.deactivated + (isDeactivated ? 1 : 0)

            const updatedState = await updateStatus({
                checked: currentChecked,
                deactivated: newDeactivatedCount,
                logs: updatedLogs
            })

            return NextResponse.json({ success: true, status: updatedState })
        }

        if (action === 'cancel') {
            const latestStatus = await getCheckStatus()
            const cancelledState = await updateStatus({
                status: 'cancelled',
                completedAt: new Date().toISOString(),
                logs: [...latestStatus.logs, '❌ Pengecekan dibatalkan oleh Admin.']
            })

            revalidateTag('products', { expire: 0 })
            revalidateTag('categories', { expire: 0 })

            return NextResponse.json({ success: true, status: cancelledState })
        }

        if (action === 'complete') {
            const latestStatus = await getCheckStatus()
            const completedState = await updateStatus({
                status: 'completed',
                completedAt: new Date().toISOString(),
                logs: [...latestStatus.logs, `🎉 Pengecekan selesai! Total gambar diperiksa: ${latestStatus.total}. Gambar mati: ${latestStatus.deactivated}`]
            })

            revalidateTag('products', { expire: 0 })
            revalidateTag('categories', { expire: 0 })

            return NextResponse.json({ success: true, status: completedState })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}
