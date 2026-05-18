'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer'
import CategoryCard from './CategoryCard'

interface CategoryCarouselProps {
    categories: any[]
}

export default function CategoryCarousel({ categories }: CategoryCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [showLeftArrow, setShowLeftArrow] = useState(false)
    const [showRightArrow, setShowRightArrow] = useState(true)

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
            setShowLeftArrow(scrollLeft > 0)
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5) // 5px tolerance
        }
    }

    useEffect(() => {
        checkScroll()
        window.addEventListener('resize', checkScroll)
        // Check once after images might have loaded
        setTimeout(checkScroll, 500)
        return () => window.removeEventListener('resize', checkScroll)
    }, [])

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const clientWidth = scrollContainerRef.current.clientWidth
            const scrollAmount = direction === 'left' ? -clientWidth / 2 : clientWidth / 2
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
            setTimeout(checkScroll, 300)
        }
    }

    return (
        <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-sm shadow-sm relative group overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
                <h2 className="text-base font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Kategori
                </h2>
            </div>
            <div className="relative">
                <div 
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    className="overflow-x-auto scrollbar-hide scroll-smooth relative z-0"
                >
                    <StaggerContainer className="grid grid-rows-2 grid-flow-col auto-cols-max min-w-full bg-gray-50 dark:bg-dark-bg">
                        {categories.map((category) => (
                            <StaggerItem key={category.id}>
                                <CategoryCard category={category} />
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>

                {/* Left Arrow - Hanya muncul saat di-hover pada desktop dan jika bisa di-scroll ke kiri */}
                {showLeftArrow && (
                    <button 
                        onClick={() => scroll('left')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-dark-surface shadow-[0_0_10px_rgba(0,0,0,0.15)] rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-brand-primary hover:scale-110 transition-all z-10 opacity-0 group-hover:opacity-100 hidden md:flex"
                    >
                        <ChevronLeft className="w-6 h-6 -ml-0.5" />
                    </button>
                )}

                {/* Right Arrow - Hanya muncul saat di-hover pada desktop dan jika bisa di-scroll ke kanan */}
                {showRightArrow && (
                    <button 
                        onClick={() => scroll('right')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-dark-surface shadow-[0_0_10px_rgba(0,0,0,0.15)] rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-brand-primary hover:scale-110 transition-all z-10 opacity-0 group-hover:opacity-100 hidden md:flex"
                    >
                        <ChevronRight className="w-6 h-6 -mr-0.5" />
                    </button>
                )}
            </div>
        </div>
    )
}
