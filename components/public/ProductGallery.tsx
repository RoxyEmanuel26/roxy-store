'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
import { useWishlist } from '@/hooks/useWishlist'
import { showToast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { ProductType } from '@/types'

interface ProductGalleryProps {
    product: ProductType
}

export default function ProductGallery({ product }: ProductGalleryProps) {
    const images = [product.image, ...(product.images || [])]
    const filteredImages = images.filter(Boolean)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [touchStart, setTouchStart] = useState(0)
    const thumbContainerRef = useRef<HTMLDivElement>(null)

    const { toggleWishlist, isInWishlist, mounted } = useWishlist()
    const isWishlisted = mounted ? isInWishlist(product.id) : false

    const goTo = (dir: 'prev' | 'next') => {
        if (dir === 'prev') setSelectedIndex((i) => (i > 0 ? i - 1 : filteredImages.length - 1))
        else setSelectedIndex((i) => (i < filteredImages.length - 1 ? i + 1 : 0))
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientX)
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        const diff = touchStart - e.changedTouches[0].clientX
        if (Math.abs(diff) > 50) {
            if (diff > 0 && selectedIndex < filteredImages.length - 1) {
                setSelectedIndex((prev) => prev + 1)
            } else if (diff < 0 && selectedIndex > 0) {
                setSelectedIndex((prev) => prev - 1)
            }
        }
    }



    const getShareUrl = () => {
        return typeof window !== 'undefined'
            ? `${window.location.origin}/produk/${product.slug}`
            : ''
    }

    const handleShareFacebook = () => {
        const url = encodeURIComponent(getShareUrl())
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
    }

    const handleShareX = () => {
        const url = encodeURIComponent(getShareUrl())
        const text = encodeURIComponent(`Lihat produk menarik di Roxy Store: ${product.title}`)
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank')
    }

    const handleSharePinterest = () => {
        const url = encodeURIComponent(getShareUrl())
        const text = encodeURIComponent(product.title)
        const media = encodeURIComponent(product.image)
        window.open(`https://pinterest.com/pin/create/button/?url=${url}&description=${text}&media=${media}`, '_blank')
    }

    const handleShareMessenger = () => {
        const url = encodeURIComponent(getShareUrl())
        window.open(`https://www.facebook.com/dialog/send?app_id=291494419107518&link=${url}&redirect_uri=${url}`, '_blank')
    }

    const handleToggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const added = toggleWishlist(product.id)
        if (added) {
            showToast.wishlistAdded(product.title)
        } else {
            showToast.wishlistRemoved()
        }
    }

    if (filteredImages.length === 0) {
        return (
            <div className="aspect-square rounded-2xl bg-brand-surface dark:bg-dark-surface flex items-center justify-center">
                <p className="text-brand-muted">Tidak ada gambar</p>
            </div>
        )
    }

    return (
        <>
            {/* Main Image with Zoom — fixed aspect ratio to prevent CLS */}
            <div
                className="relative rounded-2xl overflow-hidden bg-brand-surface dark:bg-dark-surface shadow-sm border border-brand-border/30 dark:border-dark-border/30"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <Zoom>
                    <div className="relative aspect-square w-full">
                        <Image
                            src={filteredImages[selectedIndex]}
                            alt="Foto produk"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                            priority={selectedIndex === 0}
                            loading={selectedIndex === 0 ? 'eager' : 'lazy'}
                            referrerPolicy="no-referrer"
                        />
                    </div>
                </Zoom>

                {/* Navigation arrows */}
                {filteredImages.length > 1 && (
                    <>
                        <button
                            onClick={() => goTo('prev')}
                            aria-label="Gambar sebelumnya"
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/70 dark:bg-dark-surface/70 hover:bg-white dark:hover:bg-dark-surface text-brand-text dark:text-dark-text rounded-full shadow-md z-10 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => goTo('next')}
                            aria-label="Gambar berikutnya"
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/70 dark:bg-dark-surface/70 hover:bg-white dark:hover:bg-dark-surface text-brand-text dark:text-dark-text rounded-full shadow-md z-10 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </>
                )}

                {/* Image counter badge */}
                {filteredImages.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full z-10 select-none">
                        {selectedIndex + 1} / {filteredImages.length}
                    </div>
                )}
            </div>

            {/* Thumbnails — horizontal scroll with chevrons */}
            {filteredImages.length > 1 && (
                <div className="relative mt-3 group/thumb">
                    {/* Left Scroll Button */}
                    <button
                        onClick={() => {
                            const container = thumbContainerRef.current
                            if (container) container.scrollBy({ left: -80, behavior: 'smooth' })
                        }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-12 bg-black/35 hover:bg-black/55 text-white flex items-center justify-center rounded-r opacity-0 group-hover/thumb:opacity-100 transition-opacity z-10 select-none cursor-pointer"
                        aria-label="Scroll thumbnails left"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div
                        ref={thumbContainerRef}
                        id="thumb-container"
                        className="flex gap-2 overflow-x-auto pb-1 scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {filteredImages.map((img, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedIndex(index)}
                                aria-label={`Lihat gambar ${index + 1}`}
                                className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-none ${selectedIndex === index
                                        ? 'border-red-600 dark:border-red-500 ring-2 ring-red-600/10'
                                        : 'border-transparent opacity-65 hover:opacity-100'
                                    }`}
                            >
                                <Image
                                    src={img}
                                    alt=""
                                    fill
                                    sizes="64px"
                                    className="object-cover"
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                />
                            </button>
                        ))}
                    </div>

                    {/* Right Scroll Button */}
                    <button
                        onClick={() => {
                            const container = thumbContainerRef.current
                            if (container) container.scrollBy({ left: 80, behavior: 'smooth' })
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-12 bg-black/35 hover:bg-black/55 text-white flex items-center justify-center rounded-l opacity-0 group-hover/thumb:opacity-100 transition-opacity z-10 select-none cursor-pointer"
                        aria-label="Scroll thumbnails right"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Share and Wishlist/Favorite Bar — Matches Shopee Style Exactly */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-6 py-4 border-t border-brand-border/30 dark:border-dark-border/30 text-sm select-none">
                {/* Share Section */}
                <div className="flex items-center gap-2.5">
                    <span className="text-brand-muted dark:text-dark-muted font-medium">Share:</span>
                    <div className="flex items-center gap-2">
                        {/* Messenger */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleShareMessenger}
                            className="w-7 h-7 rounded-full bg-[#0084FF] flex items-center justify-center shadow-sm hover:shadow transition-shadow cursor-pointer"
                            title="Bagikan ke Messenger"
                        >
                            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                                <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.914 1.448 5.518 3.7 7.205V22l3.39-1.859c.928.257 1.91.397 2.91.397 5.523 0 10-4.145 10-9.28C22 6.145 17.523 2 12 2zm1.266 11.925l-2.531-2.707-4.947 2.707 5.437-5.77 2.593 2.707 4.885-2.707-5.437 5.77z"/>
                            </svg>
                        </motion.button>

                        {/* Facebook */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleShareFacebook}
                            className="w-7 h-7 rounded-full bg-[#1877F2] flex items-center justify-center shadow-sm hover:shadow transition-shadow cursor-pointer"
                            title="Bagikan ke Facebook"
                        >
                            <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </motion.button>

                        {/* Pinterest */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleSharePinterest}
                            className="w-7 h-7 rounded-full bg-[#BD081C] flex items-center justify-center shadow-sm hover:shadow transition-shadow cursor-pointer"
                            title="Bagikan ke Pinterest"
                        >
                            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.41 7.61 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.966 1.406-5.966s-.359-.72-.359-1.781c0-1.663.967-2.909 2.17-2.909 1.023 0 1.517.769 1.517 1.691 0 1.03-.655 2.57-1.07 4.004-.285 1.196.6 2.17 1.78 2.17 2.137 0 3.782-2.254 3.782-5.503 0-2.877-2.068-4.888-5.02-4.888-3.417 0-5.424 2.564-5.424 5.215 0 1.03.398 2.137.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.164 0 7.397 2.967 7.397 6.93 0 4.136-2.607 7.464-6.22 7.464-1.215 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C11.17 23.945 11.583 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12.017 0z"/>
                            </svg>
                        </motion.button>

                        {/* Twitter/X */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleShareX}
                            className="w-7 h-7 rounded-full bg-black dark:bg-dark-surface dark:border dark:border-dark-border flex items-center justify-center shadow-sm hover:shadow transition-shadow cursor-pointer"
                            title="Bagikan ke X"
                        >
                            <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                        </motion.button>
                    </div>
                </div>

                {/* Divider Line */}
                <div className="w-[1px] h-5 bg-brand-border dark:bg-dark-border" />

                {/* Favorite Section */}
                <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={handleToggleWishlist}
                    className="flex items-center gap-2 group cursor-pointer hover:opacity-90 select-none"
                >
                    <Heart
                        className={cn(
                            "h-6 w-6 text-red-500 transition-colors duration-200",
                            isWishlisted ? "fill-red-500 text-red-500" : "text-red-500"
                        )}
                    />
                    <span className="text-brand-text dark:text-dark-text font-medium group-hover:underline">
                        Favorit
                    </span>
                </motion.button>
            </div>
        </>
    )
}
