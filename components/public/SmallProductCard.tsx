'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { WishlistButton } from './WishlistButton'
import type { ProductType } from '@/types'

interface SmallProductCardProps {
    product: ProductType
}

const badgeColors: Record<string, string> = {
    NEW: 'bg-blue-500 text-white',
    HOT: 'bg-red-500 text-white',
    'BEST SELLER': 'bg-amber-400 text-white',
}

export default function SmallProductCard({ product }: SmallProductCardProps) {
    return (
        <Link href={`/products/${product.slug}`} className="group block h-full">
            <motion.div
                whileHover={{ y: -3, boxShadow: '0 12px 28px rgba(255,107,157,0.18)' }}
                transition={{ duration: 0.18 }}
                className="bg-white dark:bg-dark-surface rounded-xl overflow-hidden shadow-sm flex flex-col h-full border border-brand-border/50 dark:border-dark-border cursor-pointer"
            >
                {/* Image — portrait ratio 3:4 */}
                <div className="relative w-full overflow-hidden flex-shrink-0" style={{ aspectRatio: '3/4' }}>
                    <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    {/* Badge */}
                    {product.badge && (
                        <span className={`absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badgeColors[product.badge] || 'bg-gray-500 text-white'}`}>
                            {product.badge}
                        </span>
                    )}
                    {/* Wishlist */}
                    <WishlistButton product={product} variant="card" />
                </div>

                {/* Konten */}
                <div className="px-2.5 pt-2 pb-2.5 min-w-0">
                    {/* Kategori */}
                    <span className="text-[10px] text-brand-primary dark:text-dark-primary font-semibold uppercase tracking-wide truncate leading-none block">
                        {product.category?.name}
                    </span>

                    {/* Judul — 2 baris max */}
                    <div className="mt-1 overflow-hidden" style={{ height: '2.4rem' }}>
                        <h3 className="font-semibold text-[12px] leading-5 text-brand-text dark:text-dark-text line-clamp-2">
                            {product.title}
                        </h3>
                    </div>

                    {/* Harga */}
                    <p className="text-brand-primary dark:text-dark-primary font-bold text-[13px] mt-1.5 leading-none">
                        {formatRupiah(product.price)}
                    </p>

                    {/* View count */}
                    <p className="flex items-center gap-1 text-[10px] text-brand-muted dark:text-dark-muted mt-1">
                        <Eye className="w-2.5 h-2.5 flex-shrink-0" />
                        {product.viewCount ?? 0} dilihat
                    </p>
                </div>
            </motion.div>
        </Link>
    )
}
