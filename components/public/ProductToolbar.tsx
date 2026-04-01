'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback, useTransition } from 'react'
import { Search, SlidersHorizontal, X, Flame, Star, TrendingDown, TrendingUp, Clock, ArrowUpDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import FilterSidebar from './FilterSidebar'

const SORT_OPTIONS = [
    { value: 'terbaru', label: 'Terbaru', icon: Clock },
    { value: 'terlaris', label: 'Terlaris', icon: Flame },
    { value: 'rating-tertinggi', label: 'Rating Tertinggi', icon: Star },
    { value: 'harga-terendah', label: 'Harga Terendah', icon: TrendingDown },
    { value: 'harga-tertinggi', label: 'Harga Tertinggi', icon: TrendingUp },
]

interface ProductToolbarProps {
    currentSort?: string
    currentQuery?: string
    total?: number
    activeFilters?: number
    // For mobile filter sheet
    categories: { id: string; name: string; slug: string; _count?: { products: number } }[]
    currentCategory?: string
    currentBadge?: string
    priceRange: { min: number; max: number }
    currentMinPrice?: number
    currentMaxPrice?: number
}

export default function ProductToolbar({
    currentSort,
    currentQuery,
    total,
    activeFilters = 0,
    categories,
    currentCategory,
    currentBadge,
    priceRange,
    currentMinPrice,
    currentMaxPrice,
}: ProductToolbarProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [query, setQuery] = useState(currentQuery || '')
    const [isPending, startTransition] = useTransition()
    const [mobileOpen, setMobileOpen] = useState(false)

    const updateParam = useCallback(
        (key: string, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString())
            if (value) params.set(key, value)
            else params.delete(key)
            params.delete('page')
            startTransition(() => {
                router.push(`/produk?${params.toString()}`)
            })
        },
        [router, searchParams]
    )

    useEffect(() => {
        setQuery(currentQuery || '')
    }, [currentQuery])

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateParam('q', query || null)
    }

    const activeSort = currentSort || 'terbaru'
    const activeSortOption = SORT_OPTIONS.find(s => s.value === activeSort) || SORT_OPTIONS[0]

    return (
        <div className="space-y-3 mb-2">
            {/* Row 1: Search + Filter + Sort toggle (mobile) */}
            <div className="flex items-center gap-2 md:gap-3">
                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari produk..."
                        className="pl-10 h-10 bg-brand-surface/50 dark:bg-dark-surface/50 border-brand-border/30 dark:border-dark-border/30"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => { setQuery(''); updateParam('q', null) }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            <X className="h-3.5 w-3.5 text-brand-muted hover:text-brand-text" />
                        </button>
                    )}
                </form>

                {/* Mobile filter drawer button */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="lg:hidden flex-shrink-0 h-10 gap-1.5 border-brand-border/30 dark:border-dark-border/30"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            <span className="hidden sm:inline">Filter</span>
                            {activeFilters > 0 && (
                                <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-brand-primary">
                                    {activeFilters}
                                </Badge>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[85vw] max-w-sm overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle className="text-brand-text dark:text-dark-text">Filter Produk</SheetTitle>
                        </SheetHeader>
                        <div className="pt-4">
                            <FilterSidebar
                                categories={categories}
                                currentCategory={currentCategory}
                                currentBadge={currentBadge}
                                priceRange={priceRange}
                                currentMinPrice={currentMinPrice}
                                currentMaxPrice={currentMaxPrice}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Row 2: Sort pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-brand-secondary/30 -mx-1 px-1">
                <ArrowUpDown className="h-3.5 w-3.5 text-brand-muted flex-shrink-0" />
                {SORT_OPTIONS.map((option) => {
                    const isActive = activeSort === option.value
                    const Icon = option.icon
                    return (
                        <button
                            key={option.value}
                            onClick={() => updateParam('sort', option.value)}
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap 
                                transition-colors duration-150 flex-shrink-0
                                ${isActive
                                    ? 'bg-brand-primary text-white shadow-sm shadow-brand-primary/20'
                                    : 'bg-brand-surface/80 dark:bg-dark-surface/80 text-brand-muted dark:text-dark-muted hover:bg-brand-surface dark:hover:bg-dark-surface hover:text-brand-text dark:hover:text-dark-text'
                                }
                            `}
                        >
                            <Icon className="h-3 w-3" />
                            {option.label}
                        </button>
                    )
                })}
            </div>

            {/* Active category quick-filter chips */}
            {currentCategory && (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-brand-muted">Filter aktif:</span>
                    <Badge
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                        onClick={() => {
                            const params = new URLSearchParams(searchParams.toString())
                            params.delete('kategori')
                            params.delete('category')
                            startTransition(() => {
                                router.push(`/produk?${params.toString()}`)
                            })
                        }}
                    >
                        {categories.find(c => c.slug === currentCategory)?.name || currentCategory}
                        <X className="h-3 w-3" />
                    </Badge>
                </div>
            )}

            {/* Loading indicator */}
            {isPending && (
                <div className="h-0.5 bg-brand-surface dark:bg-dark-surface rounded-full overflow-hidden">
                    <div className="h-full bg-brand-primary rounded-full animate-progress-indeterminate" />
                </div>
            )}
        </div>
    )
}
