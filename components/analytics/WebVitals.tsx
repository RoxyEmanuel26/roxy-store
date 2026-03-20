'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
    useReportWebVitals((metric) => {
        // Check if window.gtag is available
        if (typeof window !== 'undefined' && (window as any).gtag) {
            ; (window as any).gtag('event', metric.name, {
                value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value), // values must be integers
                event_label: metric.id, // id unique to current page load
                non_interaction: true, // avoids affecting bounce rate.
            })
        }
    })

    return null
}
