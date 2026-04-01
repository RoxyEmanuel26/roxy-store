'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

interface ProductGalleryProps {
    images: string[]
}

export default function ProductGallery({ images }: ProductGalleryProps) {
    const filteredImages = images.filter(Boolean)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [touchStart, setTouchStart] = useState(0)

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
                className="relative rounded-2xl overflow-hidden bg-brand-surface dark:bg-dark-surface"
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
                        />
                    </div>
                </Zoom>

                {/* Navigation arrows */}
                {filteredImages.length > 1 && (
                    <>
                        <Button
                            onClick={() => goTo('prev')}
                            variant="ghost"
                            size="icon"
                            aria-label="Gambar sebelumnya"
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/60 dark:bg-dark-surface/60 hover:bg-white dark:hover:bg-dark-surface rounded-full shadow-md z-10 transition-none"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                            onClick={() => goTo('next')}
                            variant="ghost"
                            size="icon"
                            aria-label="Gambar berikutnya"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/60 dark:bg-dark-surface/60 hover:bg-white dark:hover:bg-dark-surface rounded-full shadow-md z-10 transition-none"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </>
                )}

                {/* Image counter badge */}
                {filteredImages.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
                        {selectedIndex + 1} / {filteredImages.length}
                    </div>
                )}
            </div>

            {/* Thumbnails — horizontal scroll */}
            {filteredImages.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-brand-secondary">
                    {filteredImages.map((img, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedIndex(index)}
                            aria-label={`Lihat gambar ${index + 1}`}
                            className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-none ${selectedIndex === index
                                    ? 'border-brand-primary'
                                    : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                        >
                            <Image
                                src={img}
                                alt=""
                                fill
                                sizes="64px"
                                className="object-cover"
                                loading="lazy"
                            />
                        </button>
                    ))}
                </div>
            )}
        </>
    )
}
