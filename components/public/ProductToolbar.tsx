'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import FilterSidebar from './FilterSidebar'

interface ProductToolbarProps {
    currentSort?: string
    currentQuery?: string
    // For mobile filter sheet
    categories: { id: string; name: string; slug: string }[]
    currentCategory?: string
    currentBadge?: string
    priceRange: { min: number; max: number }
    currentMinPrice?: number
    currentMaxPrice?: number
}

export default function ProductToolbar({
    currentSort,
    currentQuery,
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

    const updateParam = useCallback(
        (key: string, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString())
            if (value) params.set(key, value)
            else params.delete(key)
            params.delete('page')
            router.push(`/products?${params.toString()}`)
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

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari nama produk..."
                    className="pl-10"
                />
            </form>

            <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Sort */}
                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                    <span className="text-sm text-brand-muted hidden sm:inline whitespace-nowrap">Urutkan:</span>
                    <Select value={currentSort || 'newest'} onValueChange={(v) => updateParam('sort', v)}>
                        <SelectTrigger className="w-full sm:w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Terbaru</SelectItem>
                            <SelectItem value="price-asc">Harga Terendah</SelectItem>
                            <SelectItem value="price-desc">Harga Tertinggi</SelectItem>
                            <SelectItem value="popular">Paling Populer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Mobile filter button */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="lg:hidden flex-shrink-0">
                            <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-80 overflow-y-auto">
                        <div className="pt-6">
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
        </div>
    )
}
