'use client'

import { useEffect, useRef } from 'react'
import { trackViewContent } from '@/lib/facebook-pixel'

interface MetaViewContentProps {
    productId: string
    productName: string
    price: number
    category: string
}

/**
 * MetaViewContent — Component yang otomatis mengirim event ViewContent
 * ke Facebook Pixel (client-side) + Meta Conversions API (server-side).
 *
 * Dipasang di halaman /produk/[slug].
 * Event ID yang sama digunakan untuk client + server agar Meta bisa deduplikasi.
 */
export function MetaViewContent({
    productId,
    productName,
    price,
    category,
}: MetaViewContentProps) {
    const hasFired = useRef(false)

    useEffect(() => {
        if (hasFired.current) return
        hasFired.current = true

        // Generate unique event ID untuk deduplikasi client ↔ server
        const eventId = `vc_${productId}_${Date.now()}`

        const customData = {
            content_name: productName,
            content_ids: [productId],
            content_type: 'product',
            content_category: category,
            value: price,
            currency: 'IDR',
        }

        // 1. Client-side: Facebook Pixel
        trackViewContent(customData)

        // 2. Server-side: Meta Conversions API (fire-and-forget)
        fetch('/api/meta-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventName: 'ViewContent',
                eventId,
                sourceUrl: window.location.href,
                customData,
            }),
        }).catch(() => {
            // Silently fail — jangan ganggu UX
        })
    }, [productId, productName, price, category])

    return null // Invisible component
}
