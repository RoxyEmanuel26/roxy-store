'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Eye, ShoppingCart, Store } from 'lucide-react'
import { motion } from 'framer-motion'
import { Separator } from '@/components/ui/separator'
import { formatRupiah } from '@/lib/utils'
import { WishlistButton } from './WishlistButton'
import { ShareButton } from './ShareButton'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import type { ProductType } from '@/types'
import {
    trackProductView,
    trackShopeeClick,
    trackTokopediaClick
} from '@/lib/analytics-events'

const badgeColors: Record<string, string> = {
    NEW: 'bg-blue-500 text-white',
    HOT: 'bg-red-500 text-white',
    'BEST SELLER': 'bg-yellow-500 text-white',
}

interface ProductInfoProps {
    product: ProductType
}

export default function ProductInfo({ product }: ProductInfoProps) {
    const { addProduct } = useRecentlyViewed()

    // Track view + add to recently viewed
    useEffect(() => {
        addProduct(product.id)

        // Track in GA4
        trackProductView(
            product.id,
            product.title,
            product.category?.name || 'Uncategorized',
            product.price
        )

        // Increment database viewCount
        fetch(`/api/products/${product.id}/view`, { method: 'POST' }).catch(console.error)
    }, [product.id]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleShopeeClick = () => {
        window.open(product.shopeeUrl, '_blank')
        trackShopeeClick(product.id, product.title, product.price)
    }

    const handleTokopediaClick = () => {
        window.open(product.tokopediaUrl, '_blank')
        trackTokopediaClick(product.id, product.title, product.price)
    }

    return (
        <div className="space-y-4">
            {/* Badge */}
            {product.badge && (
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${badgeColors[product.badge] || 'bg-gray-500 text-white'}`}>
                    {product.badge}
                </span>
            )}

            {/* Category */}
            <Link href={`/category/${product.category?.slug}`}>
                <span className="text-sm text-brand-primary hover:underline font-medium">
                    {product.category?.name}
                </span>
            </Link>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-brand-text dark:text-dark-text leading-tight">
                {product.title}
            </h1>

            {/* Price */}
            <p className="text-3xl font-bold text-brand-primary dark:text-dark-primary">
                {formatRupiah(product.price)}
            </p>

            {/* View Count */}
            <p className="text-sm text-brand-muted dark:text-dark-muted flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {product.viewCount} orang melihat produk ini
            </p>

            <Separator />

            {/* Description */}
            <div className="text-brand-muted dark:text-dark-muted leading-relaxed whitespace-pre-wrap text-sm">
                {product.description}
            </div>

            <Separator />

            {/* Buy Buttons */}
            {product.shopeeUrl && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleShopeeClick}
                    className="w-full h-14 text-base font-bold bg-[#EE4D2D] hover:bg-[#D63E20] text-white rounded-xl shadow-lg shadow-[#EE4D2D]/30 flex items-center justify-center gap-2 transition-none"
                >
                    <ShoppingCart className="h-5 w-5" />
                    🛒 Beli di Shopee
                </motion.button>
            )}

            {product.tokopediaUrl && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleTokopediaClick}
                    className="w-full h-14 text-base font-bold bg-[#42B549] hover:bg-[#389B3F] text-white rounded-xl shadow-lg shadow-[#42B549]/30 flex items-center justify-center gap-2 transition-none"
                >
                    <Store className="h-5 w-5" />
                    🟢 Beli di Tokopedia
                </motion.button>
            )}

            {/* Share / Wishlist */}
            <div className="flex gap-3">
                <WishlistButton product={product} variant="detail" className="flex-1" />
                <ShareButton product={product} className="flex-1" />
            </div>

            {/* Purchase Info */}
            {(product.shopeeUrl || product.tokopediaUrl) && (
                <div className="p-4 bg-brand-surface dark:bg-dark-surface rounded-xl">
                    <p className="text-sm text-brand-muted dark:text-dark-muted">
                        💡 <strong>Info Pembelian:</strong> Klik tombol di atas untuk membeli melalui{' '}
                        {[
                            product.shopeeUrl && 'Shopee',
                            product.tokopediaUrl && 'Tokopedia',
                        ].filter(Boolean).join(' atau ')}.
                        Transaksi dilakukan di platform marketplace pilihan Anda.
                    </p>
                </div>
            )}
        </div>
    )
}
