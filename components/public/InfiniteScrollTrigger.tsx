'use client'

import { useEffect, useRef } from 'react'

interface InfiniteScrollTriggerProps {
    onIntersect: () => void
    isLoading: boolean
    hasMore: boolean
}

export function InfiniteScrollTrigger({ onIntersect, isLoading, hasMore }: InfiniteScrollTriggerProps) {
    const triggerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    onIntersect()
                }
            },
            { threshold: 0.1 }
        )

        const el = triggerRef.current
        if (el) observer.observe(el)
        return () => { if (el) observer.unobserve(el) }
    }, [onIntersect, hasMore, isLoading])

    return (
        <div ref={triggerRef} className="py-8 flex justify-center">
            {isLoading && (
                <div className="flex items-center gap-2 text-brand-muted">
                    <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Memuat produk...</span>
                </div>
            )}
            {!hasMore && !isLoading && (
                <p className="text-sm text-brand-muted text-center py-4">
                    ✨ Semua produk sudah ditampilkan
                </p>
            )}
        </div>
    )
}
