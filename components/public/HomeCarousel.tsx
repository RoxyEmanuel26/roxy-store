'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HomeCarouselProps {
    banners: string[]
}

export default function HomeCarousel({ banners }: HomeCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const touchStartX = useRef<number | null>(null)

    const nextSlide = () => {
        if (banners.length <= 1) return
        setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1))
    }

    const prevSlide = () => {
        if (banners.length <= 1) return
        setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1))
    }

    // Auto-play timer
    useEffect(() => {
        if (banners.length <= 1 || isHovered) {
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
            return
        }

        timerRef.current = setInterval(nextSlide, 4000)

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
    }, [currentIndex, isHovered, banners.length])

    if (!banners || banners.length === 0) return null

    const isSingle = banners.length === 1

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return
        const touchEndX = e.changedTouches[0].clientX
        const diff = touchStartX.current - touchEndX
        
        // Swipe threshold: 50px
        if (diff > 50) {
            nextSlide()
        } else if (diff < -50) {
            prevSlide()
        }
        touchStartX.current = null
    }

    return (
        <div 
            className="w-full relative group overflow-hidden rounded-xl border border-gray-200/80 dark:border-dark-border shadow-sm bg-gray-50 dark:bg-dark-surface select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Sliding Track */}
            <div className="relative w-full aspect-[2.5/1] sm:aspect-[2.8/1] md:aspect-[3.6/1] overflow-hidden">
                <div 
                    className="flex h-full transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {banners.map((url, idx) => (
                        <div key={`${url}-${idx}`} className="w-full h-full shrink-0 relative">
                            {/* Next.js unoptimized img is highly robust for dynamic cloud URLs */}
                            <img
                                src={url}
                                alt={`Banner Promosi ${idx + 1}`}
                                className="w-full h-full object-cover select-none pointer-events-none"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Arrows - Show on hover on Desktop, always show simple tap zones on mobile if preferred, but circular arrows shown nicely */}
            {!isSingle && (
                <>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            prevSlide()
                        }}
                        className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/90 dark:bg-dark-surface/90 hover:bg-white dark:hover:bg-dark-surface shadow-md rounded-full flex items-center justify-center text-gray-700 dark:text-gray-200 hover:scale-105 transition-all z-10 md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Previous Slide"
                    >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 -ml-0.5 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            nextSlide()
                        }}
                        className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/90 dark:bg-dark-surface/90 hover:bg-white dark:hover:bg-dark-surface shadow-md rounded-full flex items-center justify-center text-gray-700 dark:text-gray-200 hover:scale-105 transition-all z-10 md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Next Slide"
                    >
                        <ChevronRight className="w-5 h-5 md:w-6 md:h-6 -mr-0.5 text-gray-500 dark:text-gray-400" />
                    </button>
                </>
            )}

            {/* Indicator Dots - Tokopedia style bottom-left dots */}
            {!isSingle && (
                <div className="absolute bottom-3 md:bottom-4 left-5 md:left-6 flex items-center gap-1.5 z-10 bg-black/10 px-2 py-1 rounded-full backdrop-blur-[2px]">
                    {banners.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${
                                currentIndex === idx 
                                    ? 'w-4 md:w-6 bg-brand-primary' 
                                    : 'w-1.5 md:w-2 bg-white/60 hover:bg-white/90 dark:bg-dark-muted/60 dark:hover:bg-dark-muted/90'
                            }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
