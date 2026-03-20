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

    return null
}
