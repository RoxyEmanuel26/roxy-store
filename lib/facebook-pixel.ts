/**
 * Facebook Pixel — Client-side helper
 *
 * Digunakan untuk mengirim event ke Facebook Pixel dari browser.
 * Pixel ID diambil dari environment variable NEXT_PUBLIC_FB_PIXEL_ID.
 */

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || ''

// Extend window type for fbq
declare global {
    interface Window {
        fbq: (...args: unknown[]) => void
        _fbq: (...args: unknown[]) => void
    }
}

/**
 * Inisialisasi Facebook Pixel.
 * Dipanggil sekali saat script pixel selesai dimuat.
 */
export function initPixel(): void {
    if (!FB_PIXEL_ID || typeof window === 'undefined') return
    window.fbq('init', FB_PIXEL_ID)
    window.fbq('track', 'PageView')
}

/**
 * Track PageView — dipanggil setiap navigasi halaman (client-side).
 */
export function trackPageView(): void {
    if (!FB_PIXEL_ID || typeof window === 'undefined') return
    window.fbq('track', 'PageView')
}

/**
 * Track ViewContent — dipanggil di halaman detail produk.
 */
export function trackViewContent(params: {
    content_name: string
    content_ids: string[]
    content_type: string
    value: number
    currency: string
}): void {
    if (!FB_PIXEL_ID || typeof window === 'undefined') return
    window.fbq('track', 'ViewContent', params)
}

/**
 * Track Lead — dipanggil saat klik tombol "Beli di Shopee" (affiliate click).
 * Event Lead digunakan karena ini affiliate (bukan Purchase langsung).
 */
export function trackLead(params: {
    content_name: string
    content_ids: string[]
    value: number
    currency: string
}): void {
    if (!FB_PIXEL_ID || typeof window === 'undefined') return
    window.fbq('track', 'Lead', params)
}

/**
 * Track custom event — untuk event yang tidak ada di standard events.
 */
export function trackCustomEvent(eventName: string, params?: Record<string, unknown>): void {
    if (!FB_PIXEL_ID || typeof window === 'undefined') return
    window.fbq('trackCustom', eventName, params)
}
