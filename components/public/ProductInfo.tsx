'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, TrendingUp, Star, ShieldCheck } from 'lucide-react'
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

        // Increment database viewCount and record event only if not viewed in the last 24 hours
        let shouldTrackView = true
        const COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 hours

        try {
            const viewedString = localStorage.getItem('roxy_viewed_products')
            const viewed: Record<string, number> = viewedString ? JSON.parse(viewedString) : {}
            const now = Date.now()

            // Clean up expired entries (older than 24 hours) to prevent localStorage bloating
            const cleaned: Record<string, number> = {}
            let hasExpired = false
            for (const [id, timestamp] of Object.entries(viewed)) {
                if (now - timestamp < COOLDOWN_MS) {
                    cleaned[id] = timestamp
                } else {
                    hasExpired = true
                }
            }

            if (cleaned[product.id]) {
                shouldTrackView = false
            } else {
                cleaned[product.id] = now
            }

            // Save updated state (only write back if something changed: either an expired item was cleaned or a new item was added)
            if (!cleaned[product.id] || hasExpired || shouldTrackView) {
                localStorage.setItem('roxy_viewed_products', JSON.stringify(cleaned))
            }
        } catch (error) {
            console.error('Error reading/writing localStorage for view tracking:', error)
            // Fallback: If localStorage is blocked/fails, default to letting the track run so analytics doesn't break
            shouldTrackView = true
        }

        if (shouldTrackView) {
            // Increment database viewCount
            fetch(`/api/products/${product.id}/view`, { method: 'POST' }).catch(console.error)

            // Record 'view' event in database analytics
            fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: 'view',
                    productId: product.id,
                }),
            }).catch(() => {})
        }
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

        // Record 'shopee_click' event in database analytics
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventType: 'shopee_click',
                productId: product.id,
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
                {/* Badge & Category */}
                {(product.badge || product.category) && (
                    <div className="flex flex-wrap items-center gap-2.5">
                        {product.badge && (
                            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${badgeColors[product.badge] || 'bg-gray-500 text-white'}`}>
                                {product.badge}
                            </span>
                        )}

                        {product.category && (
                            <Link href={`/kategori/${product.category.slug}`}>
                                <span className="text-sm text-brand-primary hover:underline font-medium">
                                    {product.category.name}
                                </span>
                            </Link>
                        )}
                    </div>
                )}

                {/* Title */}
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-brand-text dark:text-dark-text leading-tight">
                    {product.title}
                </h1>

                {/* ★ Premium Stats Bar */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-50/80 via-white to-orange-50/60 dark:from-amber-950/20 dark:via-dark-surface/60 dark:to-orange-950/15 border border-amber-200/50 dark:border-amber-800/30">
                    {/* Sold Count */}
                    {(product.shopeeSoldStr || (product.shopeeSold != null && product.shopeeSold > 0)) && (
                        <>
                            <div className="flex items-center gap-1.5 text-xs text-brand-muted dark:text-dark-muted">
                                <TrendingUp className="h-4 w-4 text-brand-primary dark:text-dark-primary" />
                                <span className="font-semibold text-brand-text dark:text-dark-text">
                                    {product.shopeeSoldStr || (product.shopeeSold != null && product.shopeeSold >= 1000
                                        ? `${(product.shopeeSold / 1000).toFixed(1).replace('.0', '')}rb`
                                        : product.shopeeSold)} Terjual
                                </span>
                            </div>
                            <span className="hidden sm:block w-1 h-1 rounded-full bg-brand-muted/40 dark:bg-dark-muted/40" />
                        </>
                    )}

                    {/* View Count — always show */}
                    <div className="flex items-center gap-1.5 text-xs text-brand-muted dark:text-dark-muted">
                        <span className="font-medium">{product.viewCount} dilihat</span>
                    </div>

                    {/* Shopee Rating */}
                    {product.shopeeRating && product.shopeeRating > 0 && (
                        <>
                            <span className="hidden sm:block w-1 h-1 rounded-full bg-brand-muted/40 dark:bg-dark-muted/40" />
                            <div className="flex items-center gap-1 text-xs">
                                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                                <span className="font-semibold text-brand-text dark:text-dark-text">{product.shopeeRating.toFixed(1)}</span>
                                <span className="text-brand-muted dark:text-dark-muted">di Shopee</span>
                            </div>
                        </>
                    )}
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
                            Lihat Harga di Shopee
                        </motion.button>
                    )}
                </div>



                {/* Purchase Info */}
                {product.shopeeUrl && (
                    <div className="p-4 bg-brand-surface dark:bg-dark-surface rounded-xl space-y-2">
                        <div className="flex items-start gap-2">
                            <ShieldCheck className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-brand-muted dark:text-dark-muted">
                                <strong>Transaksi Aman:</strong> Klik tombol di atas untuk melihat dan membeli melalui Shopee. Pembayaran & pengiriman sepenuhnya dilindungi oleh Shopee Guarantee.
                            </p>
                        </div>
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
                                Cek Harga Shopee
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
