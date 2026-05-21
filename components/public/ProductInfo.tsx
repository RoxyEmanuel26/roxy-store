'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Eye, ShoppingCart, Star, Store, TrendingUp } from 'lucide-react'
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
} from '@/lib/analytics-events'
import { trackLead, trackViewContent } from '@/lib/facebook-pixel'

const badgeColors: Record<string, string> = {
    NEW: 'bg-blue-500 text-white',
    HOT: 'bg-red-500 text-white',
    'BEST SELLER': 'bg-amber-500 text-white',
}

interface ProductInfoProps {
    product: ProductType
}

function PremiumStar({ fillPercent }: { fillPercent: number }) {
    const id = `star-grad-${Math.random().toString(36).substr(2, 9)}`;
    return (
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id={id}>
                    <stop offset={`${fillPercent * 100}%`} stopColor="#F59E0B" />
                    <stop offset={`${fillPercent * 100}%`} stopColor="#E5E7EB" />
                </linearGradient>
                <linearGradient id={`${id}-dark`}>
                    <stop offset={`${fillPercent * 100}%`} stopColor="#F59E0B" />
                    <stop offset={`${fillPercent * 100}%`} stopColor="#4B5563" />
                </linearGradient>
            </defs>
            <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" className="block dark:hidden" fill={`url(#${id})`} stroke="#D1D5DB" strokeWidth="0.5" />
            <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" className="hidden dark:block" fill={`url(#${id}-dark)`} stroke="#374151" strokeWidth="0.5" />
        </svg>
    );
}

function PremiumStarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => {
                const fillPercent = Math.max(0, Math.min(1, rating - i))
                return <PremiumStar key={i} fillPercent={fillPercent} />
            })}
        </div>
    )
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

        // Meta Pixel: ViewContent
        const viewContentData = {
            content_name: product.title,
            content_ids: [product.id],
            content_type: 'product',
            value: product.price,
            currency: 'IDR',
        }
        trackViewContent(viewContentData)

        // Server-side CAPI for ViewContent
        const viewEventId = `view_${product.id}_${Date.now()}`
        fetch('/api/meta-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventName: 'ViewContent',
                eventId: viewEventId,
                sourceUrl: window.location.href,
                customData: viewContentData,
            }),
        }).catch(() => {})

        // Increment database viewCount
        fetch(`/api/products/${product.id}/view`, { method: 'POST' }).catch(console.error)
    }, [product.id]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleShopeeClick = () => {
        window.open(product.shopeeUrl, '_blank')
        trackShopeeClick(product.id, product.title, product.price)

        // Meta Pixel: Lead event (affiliate click)
        const eventId = `lead_${product.id}_${Date.now()}`
        const leadData = {
            content_name: product.title,
            content_ids: [product.id],
            value: product.price,
            currency: 'IDR',
        }
        trackLead(leadData)

        // Server-side CAPI
        fetch('/api/meta-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventName: 'Lead',
                eventId,
                sourceUrl: window.location.href,
                customData: leadData,
            }),
        }).catch(() => {})
    }

    const hasDiscount = product.originalPrice && product.originalPrice > product.price
    const discountPercent = hasDiscount
        ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
        : 0

    return (
        <>
            <div className="space-y-4 pb-24 lg:pb-0">
                {/* Badge */}
                {product.badge && (
                    <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${badgeColors[product.badge] || 'bg-gray-500 text-white'}`}>
                        {product.badge}
                    </span>
                )}

                {/* Category */}
                <Link href={`/kategori/${product.category?.slug}`}>
                    <span className="text-sm text-brand-primary hover:underline font-medium">
                        {product.category?.name}
                    </span>
                </Link>

                {/* Title */}
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-brand-text dark:text-dark-text leading-tight">
                    {product.title}
                </h1>

                {/* Rating + Sold Count row */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-brand-muted dark:text-dark-muted">
                    <PremiumStarRating rating={product.shopeeRating ?? 0} />
                    <span>
                        ({product.shopeeRating != null ? product.shopeeRating.toFixed(1) : '0.0'} bintang 5, {product.shopeeRatingCountStr || '0'} penilaian, {product.shopeeSoldStr || '0'} Terjual, {product.viewCount} dilihat)
                    </span>
                </div>

                {/* Price block */}
                <div className="bg-brand-surface/50 dark:bg-dark-surface/50 rounded-xl p-4 space-y-1">
                    <div className="flex items-baseline gap-3">
                        <p className="text-3xl font-bold text-brand-primary dark:text-dark-primary">
                            {formatRupiah(product.price)}
                        </p>
                        {hasDiscount && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                                -{discountPercent}%
                            </span>
                        )}
                    </div>
                    {hasDiscount && (
                        <p className="text-sm text-brand-muted dark:text-dark-muted line-through">
                            {formatRupiah(product.originalPrice!)}
                        </p>
                    )}
                </div>

                <Separator />

                {/* Description */}
                <div className="text-brand-muted dark:text-dark-muted leading-relaxed whitespace-pre-wrap text-sm">
                    {product.description}
                </div>

                <Separator />

                <div className="hidden lg:block space-y-3">
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
                </div>

                {/* Share / Wishlist */}
                <div className="flex gap-3">
                    <WishlistButton product={product} variant="detail" className="flex-1" />
                    <ShareButton product={product} className="flex-1" />
                </div>

                {/* Purchase Info */}
                {product.shopeeUrl && (
                    <div className="p-4 bg-brand-surface dark:bg-dark-surface rounded-xl">
                        <p className="text-sm text-brand-muted dark:text-dark-muted">
                            💡 <strong>Info Pembelian:</strong> Klik tombol di atas untuk membeli melalui Shopee. Transaksi dilakukan di platform marketplace tersebut.
                        </p>
                    </div>
                )}
            </div>

            {/* ===== STICKY MOBILE CTA — above the fold di bottom ===== */}
            <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 dark:bg-dark-bg/95 backdrop-blur-md border-t border-brand-border/30 dark:border-dark-border/30 px-4 py-3 safe-area-bottom">
                <div className="flex items-center gap-3 max-w-lg mx-auto">
                    {/* Price mini */}
                    <div className="flex-shrink-0">
                        <p className="text-lg font-bold text-brand-primary dark:text-dark-primary leading-tight">
                            {formatRupiah(product.price)}
                        </p>
                        {hasDiscount && (
                            <p className="text-xs text-brand-muted dark:text-dark-muted line-through">
                                {formatRupiah(product.originalPrice!)}
                            </p>
                        )}
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex-1 flex gap-2">
                        {product.shopeeUrl && (
                            <button
                                onClick={handleShopeeClick}
                                className="flex-1 h-12 text-sm font-bold bg-[#EE4D2D] active:bg-[#D63E20] text-white rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-[#EE4D2D]/20"
                            >
                                <ShoppingCart className="h-4 w-4" />
                                Beli Shopee
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
