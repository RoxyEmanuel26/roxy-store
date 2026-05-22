'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView } from '@/lib/analytics-events'

export function PageViewTracker() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        const url = pathname +
            (searchParams?.toString() ? `?${searchParams}` : '')

        trackPageView(
            `${window.location.origin}${url}`,
            document.title
        )
    }, [pathname, searchParams])

    useEffect(() => {
        // Global event listener to automatically track WhatsApp clicks from any anchor elements targeting wa.me
        const handleGlobalClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const anchor = target.closest('a')
            if (anchor && anchor.href && (anchor.href.includes('wa.me') || anchor.href.includes('whatsapp.com'))) {
                fetch('/api/analytics/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventType: 'wa_click' }),
                }).catch(() => {})
            }
        }

        document.addEventListener('click', handleGlobalClick)
        return () => {
            document.removeEventListener('click', handleGlobalClick)
        }
    }, [])

    return null
}
