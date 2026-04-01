'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ShoppingBag } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-surface dark:bg-dark-bg px-4">
            <div className="text-center max-w-md">
                <p className="text-8xl mb-4">🎀</p>
                <h1 className="text-6xl font-bold text-brand-primary mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-brand-text dark:text-dark-text mb-2">
                    Halaman Tidak Ditemukan
                </h2>
                <p className="text-brand-muted dark:text-dark-muted mb-8">
                    Halaman yang kamu cari tidak ada atau sudah dipindahkan
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/">
                        <Button className="bg-brand-primary hover:bg-brand-accent text-white gap-2">
                            <Home className="h-4 w-4" />
                            Kembali ke Beranda
                        </Button>
                    </Link>
                    <Link href="/produk">
                        <Button variant="outline" className="border-brand-primary text-brand-primary gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            Lihat Produk
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
