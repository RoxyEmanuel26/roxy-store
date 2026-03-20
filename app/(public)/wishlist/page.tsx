'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWishlist } from '@/hooks/useWishlist'
import ProductCard from '@/components/public/ProductCard'
import SkeletonCard from '@/components/public/SkeletonCard'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer'
import type { ProductType } from '@/types'

export default function WishlistPage() {
    const { wishlistIds, clearWishlist, mounted } = useWishlist()
    const [products, setProducts] = useState<ProductType[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!mounted) return

        if (wishlistIds.length === 0) {
            setProducts([])
            setLoading(false)
            return
        }

        setLoading(true)
        fetch('/api/products/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: wishlistIds }),
        })
            .then((r) => r.json())
            .then((data) => {
                // Preserve wishlist order
                const sorted = wishlistIds
                    .map((id) => data.find((p: any) => p.id === id))
                    .filter(Boolean) as ProductType[]
                setProducts(sorted)
            })
            .catch(() => setProducts([]))
            .finally(() => setLoading(false))
    }, [wishlistIds, mounted])

    if (!mounted || loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="h-8 w-48 bg-brand-surface dark:bg-dark-surface rounded animate-pulse mb-2" />
                    <div className="h-4 w-32 bg-brand-surface dark:bg-dark-surface rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <FadeIn>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-brand-text dark:text-dark-text">Produk Favoritku 💕</h1>
                        <p className="text-brand-muted dark:text-dark-muted mt-1">{products.length} produk tersimpan</p>
                    </div>
                    {products.length > 0 && (
                        <Button variant="outline" size="sm" onClick={clearWishlist} className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 transition-none">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Hapus Semua
                        </Button>
                    )}
                </div>
            </FadeIn>

            {products.length > 0 ? (
                <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                        <StaggerItem key={product.id}>
                            <ProductCard product={product} />
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            ) : (
                <FadeIn>
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Heart className="h-20 w-20 text-brand-muted/30 mb-6" />
                        <h3 className="text-xl font-semibold text-brand-text dark:text-dark-text">Belum ada produk favorit</h3>
                        <p className="text-sm text-brand-muted dark:text-dark-muted mt-2">
                            Tekan ikon ❤️ pada produk untuk menyimpan
                        </p>
                        <Link href="/products">
                            <Button className="mt-6 bg-brand-primary hover:bg-brand-accent text-white transition-none">Jelajahi Produk</Button>
                        </Link>
                    </div>
                </FadeIn>
            )}
        </div>
    )
}
