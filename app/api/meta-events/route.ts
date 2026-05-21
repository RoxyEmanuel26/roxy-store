import { NextRequest, NextResponse } from 'next/server'
import { sendServerEvent } from '@/lib/meta-conversions'

export const dynamic = 'force-dynamic'

// [SECURITY FIX] Whitelist event yang diizinkan dikirim dari client
const ALLOWED_EVENTS = ['ViewContent', 'Lead', 'PageView'] as const
type AllowedEvent = typeof ALLOWED_EVENTS[number]

// [SECURITY FIX] Validasi sourceUrl harus dari domain sendiri
function isValidSourceUrl(url: string): boolean {
    if (!url) return false
    try {
        const u = new URL(url)
        const allowedHosts = [
            'www.roxystore.web.id',
            'roxystore.web.id',
            'localhost',
        ]
        return allowedHosts.some(h =>
            u.hostname === h || u.hostname.endsWith('.vercel.app')
        )
    } catch {
        return false
    }
}

/**
 * POST /api/meta-events
 *
 * Endpoint untuk menerima event dari client-side dan meneruskannya
 * ke Meta Conversions API (server-side).
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

        // [SECURITY FIX] Validasi eventName dari whitelist
        if (!ALLOWED_EVENTS.includes(eventName as AllowedEvent)) {
            return NextResponse.json(
                { error: 'eventName tidak valid' },
                { status: 400 }
            )
        }

        // [SECURITY FIX] Validasi eventId format (alphanumeric, max 64 char)
        if (typeof eventId !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(eventId)) {
            return NextResponse.json(
                { error: 'eventId tidak valid' },
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

        // [SECURITY FIX] Validasi sourceUrl
        const referer = request.headers.get('referer') || ''
        const validatedSourceUrl =
            isValidSourceUrl(sourceUrl) ? sourceUrl :
            isValidSourceUrl(referer) ? referer : ''

        const result = await sendServerEvent({
            eventName,
            eventId,
            sourceUrl: validatedSourceUrl,
            userData: {
                client_ip_address: clientIp,
                client_user_agent: userAgent,
                fbc,
                fbp,
            },
            customData,
        })

        if (!result.success) {
            // [SECURITY FIX] Log hanya error message, tidak log full error object
            console.error('[Meta Events API]', result.error)
            // Tetap return 200 agar tidak mengganggu UX
            return NextResponse.json({ ok: true, serverSent: false })
        }

        return NextResponse.json({ ok: true, serverSent: true })
    } catch (err) {
        // [SECURITY FIX] Jangan log full error object
        const errMsg = err instanceof Error ? err.message : String(err)
        console.error('[Meta Events API] Error:', errMsg)
        return NextResponse.json({ ok: true, serverSent: false })
    }
}
