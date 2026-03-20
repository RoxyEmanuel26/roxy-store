'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { Home, RefreshCw } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
        Sentry.captureException(error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-surface dark:bg-dark-bg px-4">
            <div className="text-center max-w-md">
                <p className="text-8xl mb-4">😵</p>
                <h1 className="text-2xl font-bold text-brand-text dark:text-dark-text mb-2">
                    Ups! Ada yang tidak beres
                </h1>
                <p className="text-brand-muted dark:text-dark-muted mb-8">
                    Terjadi kesalahan. Tim kami sudah diberitahu.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => reset()} className="bg-brand-primary hover:bg-brand-accent text-white gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Coba Lagi
                    </Button>
                    <Link href="/">
                        <Button variant="outline" className="border-brand-primary text-brand-primary gap-2">
                            <Home className="h-4 w-4" />
                            Kembali ke Beranda
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
