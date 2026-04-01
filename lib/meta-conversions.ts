/**
 * Meta Conversions API — Server-side event tracking
 *
 * Mengirim event ke Meta melalui Graph API (server-side).
 * Ini meningkatkan Event Match Quality karena data dikirim dari server,
 * tidak terpengaruh ad blocker.
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import crypto from 'crypto'

const PIXEL_ID = process.env.FB_PIXEL_ID || ''
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || ''
const API_VERSION = 'v21.0'

/**
 * Hash data menggunakan SHA-256 (required by Meta CAPI).
 * Meta memerlukan data user di-hash sebelum dikirim.
 */
function hashData(data: string): string {
    return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex')
}

interface UserData {
    client_ip_address?: string
    client_user_agent?: string
    fbc?: string    // Facebook click ID (dari cookie _fbc)
    fbp?: string    // Facebook browser ID (dari cookie _fbp)
    em?: string     // Email (akan di-hash)
    ph?: string     // Phone (akan di-hash)
    external_id?: string  // External/user ID (akan di-hash)
}

interface ServerEventParams {
    eventName: string
    eventId: string
    sourceUrl: string
    userData: UserData
    customData?: Record<string, unknown>
}

/**
 * Kirim event ke Meta Conversions API.
 * Setiap event memiliki event_id yang sama dengan client-side pixel
 * untuk deduplikasi.
 */
export async function sendServerEvent({
    eventName,
    eventId,
    sourceUrl,
    userData,
    customData,
}: ServerEventParams): Promise<{ success: boolean; error?: string }> {
    if (!PIXEL_ID || !ACCESS_TOKEN) {
        return { success: false, error: 'FB_PIXEL_ID atau FB_ACCESS_TOKEN belum dikonfigurasi' }
    }

    // Build user_data dengan hashing
    const user_data: Record<string, string> = {}

    if (userData.client_ip_address) {
        user_data.client_ip_address = userData.client_ip_address
    }
    if (userData.client_user_agent) {
        user_data.client_user_agent = userData.client_user_agent
    }
    if (userData.fbc) {
        user_data.fbc = userData.fbc
    }
    if (userData.fbp) {
        user_data.fbp = userData.fbp
    }
    if (userData.em) {
        user_data.em = hashData(userData.em)
    }
    if (userData.ph) {
        user_data.ph = hashData(userData.ph)
    }
    if (userData.external_id) {
        user_data.external_id = hashData(userData.external_id)
    }

    const eventData = {
        data: [
            {
                event_name: eventName,
                event_time: Math.floor(Date.now() / 1000),
                event_id: eventId,
                event_source_url: sourceUrl,
                action_source: 'website',
                user_data,
                custom_data: customData,
            },
        ],
    }

    try {
        const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
        })

        const result = await response.json()

        if (!response.ok) {
            console.error('[Meta CAPI] Error:', result)
            return { success: false, error: result.error?.message || 'Unknown error' }
        }

        return { success: true }
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Network error'
        console.error('[Meta CAPI] Network error:', errorMsg)
        return { success: false, error: errorMsg }
    }
}
