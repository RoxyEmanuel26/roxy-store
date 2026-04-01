import { NextRequest, NextResponse } from 'next/server'
import { sendServerEvent } from '@/lib/meta-conversions'

export const dynamic = 'force-dynamic'

/**
 * POST /api/meta-events
 *
 * Endpoint untuk menerima event dari client-side dan meneruskannya
 * ke Meta Conversions API (server-side).
 *
 * Ini digunakan untuk:
 * 1. ViewContent — saat user membuka halaman produk
 * 2. Lead — saat user klik tombol "Beli di Shopee" (affiliate)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { eventName, eventId, sourceUrl, customData } = body

        if (!eventName || !eventId) {
            return NextResponse.json(
                { error: 'eventName dan eventId wajib diisi' },
                { status: 400 }
            )
        }

        // Ambil user data dari request headers
        const clientIp =
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1'
        const userAgent = request.headers.get('user-agent') || ''

        // Ambil Facebook cookies dari request
        const cookies = request.cookies
        const fbc = cookies.get('_fbc')?.value || ''
        const fbp = cookies.get('_fbp')?.value || ''

        const result = await sendServerEvent({
            eventName,
            eventId,
            sourceUrl: sourceUrl || request.headers.get('referer') || '',
            userData: {
                client_ip_address: clientIp,
                client_user_agent: userAgent,
                fbc,
                fbp,
            },
            customData,
        })

        if (!result.success) {
            console.error('[Meta Events API]', result.error)
            // Tetap return 200 agar tidak mengganggu UX
            return NextResponse.json({ ok: true, serverSent: false })
        }

        return NextResponse.json({ ok: true, serverSent: true })
    } catch (err) {
        console.error('[Meta Events API] Error:', err)
        return NextResponse.json({ ok: true, serverSent: false })
    }
}
