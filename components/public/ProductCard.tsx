'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, TrendingUp } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { WishlistButton } from './WishlistButton'
import { Button } from '@/components/ui/button'
import type { ProductType } from '@/types'

interface ProductCardProps {
    product: ProductType
    priority?: boolean
}

const badgeColors: Record<string, string> = {
    NEW: 'bg-blue-500 text-white',
    HOT: 'bg-red-500 text-white',
    'BEST SELLER': 'bg-amber-500 text-white',
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
    const hasDiscount = product.originalPrice && product.originalPrice > product.price
    const discountPercent = hasDiscount
        ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
        : 0

    return (
        <Link href={`/produk/${product.slug}`} className="group block h-full">
            <motion.div
                whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(255,107,157,0.15)' }}
                transition={{ duration: 0.2 }}
                className="relative bg-white dark:bg-dark-surface rounded-2xl overflow-hidden shadow-sm cursor-pointer flex flex-col h-full border border-brand-border/50 dark:border-dark-border"
            >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden flex-shrink-0">
                    <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        priority={priority}
                    />

                    {/* Badge */}
                    {product.badge && (
                        <motion.span
                            whileHover={{ rotate: [-1, 1, -1, 0], scale: 1.05 }}
                            transition={{ duration: 0.3 }}
                            className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full ${badgeColors[product.badge] || 'bg-gray-500 text-white'}`}
                        >
                            {product.badge}
                        </motion.span>
                    )}

                    {/* Discount badge */}
                    {hasDiscount && (
                        <span className="absolute top-2 right-10 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                            -{discountPercent}%
                        </span>
                    )}

                    {/* Wishlist Button */}
                    <WishlistButton product={product} variant="card" />
                </div>

                {/* Info — flex-1 pushes button to bottom */}
                <div className="flex flex-col flex-1 p-3">
                    <span className="text-xs text-brand-primary dark:text-dark-primary font-medium truncate">
                        {product.category?.name}
                    </span>

                    <h3 className="font-semibold text-sm mt-1 text-brand-text dark:text-dark-text line-clamp-2 leading-tight min-h-[2.5rem]">
                        {product.title}
                    </h3>

                    {/* Price block */}
                    <div className="mt-2">
                        <p className="text-brand-primary dark:text-dark-primary font-bold text-base">
                            {formatRupiah(product.price)}
                        </p>
                        {hasDiscount && (
                            <p className="text-xs text-brand-muted dark:text-dark-muted line-through">
                                {formatRupiah(product.originalPrice!)}
                            </p>
                        )}
                    </div>

                    {/* Rating + Sold row */}
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-brand-muted dark:text-dark-muted">
                        {product.shopeeRating != null && product.shopeeRating > 0 && (
                            <span className="flex items-center gap-0.5">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {product.shopeeRating.toFixed(1)}
                            </span>
                        )}
                        {product.shopeeSold != null && product.shopeeSold > 0 && (
                            <span className="flex items-center gap-0.5">
                                <TrendingUp className="h-3 w-3" />
                                {product.shopeeSold >= 1000
                                    ? `${(product.shopeeSold / 1000).toFixed(1)}rb`
                                    : product.shopeeSold}
                            </span>
                        )}
                        {(!product.shopeeRating || product.shopeeRating === 0) && (!product.shopeeSold || product.shopeeSold === 0) && (
                            <span>👁 {product.viewCount} dilihat</span>
                        )}
                    </div>

                    {/* Spacer — pushes button to bottom */}
                    <div className="flex-1" />

                    <Button className="w-full mt-3 h-8 text-xs bg-brand-primary hover:bg-brand-accent text-white transition-none">
                        Lihat Detail
                    </Button>
                </div>
            </motion.div>
        </Link>
    )
}
