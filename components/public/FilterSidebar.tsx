'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { RotateCcw, Loader2 } from 'lucide-react'

interface FilterSidebarProps {
    categories: { id: string; name: string; slug: string; _count?: { products: number } }[]
    currentCategory?: string
    currentBadge?: string
    priceRange: { min: number; max: number }
    currentMinPrice?: number
    currentMaxPrice?: number
}

export default function FilterSidebar({
    categories,
    currentCategory,
    currentBadge,
    priceRange,
    currentMinPrice,
    currentMaxPrice,
}: FilterSidebarProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const updateParams = useCallback(
        (key: string, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString())
            if (value) {
                params.set(key, value)
            } else {
                params.delete(key)
            }
            params.delete('page') // reset pagination
            startTransition(() => {
                router.push(`/produk?${params.toString()}`)
            })
        },
        [router, searchParams]
    )

    const handleCategoryChange = (slug: string, checked: boolean) => {
        // Use SEO-friendly 'kategori' param
        const params = new URLSearchParams(searchParams.toString())
        // Remove both possible param names
        params.delete('category')
        params.delete('kategori')
        if (checked) {
            params.set('kategori', slug)
        }
        params.delete('page')
        startTransition(() => {
            router.push(`/produk?${params.toString()}`)
        })
    }

    const handleReset = () => {
        startTransition(() => {
            router.push('/produk')
        })
    }

    const [localPrice, setLocalPrice] = useState([
        currentMinPrice || priceRange.min,
        currentMaxPrice || priceRange.max
    ])

    // Sync local state when url params change (e.g. hitting reset)
    useEffect(() => {
        setLocalPrice([
            currentMinPrice || priceRange.min,
            currentMaxPrice || priceRange.max
        ])
    }, [currentMinPrice, currentMaxPrice, priceRange.min, priceRange.max])

    const handlePriceCommit = useCallback((values: number[]) => {
        const params = new URLSearchParams(searchParams.toString())
        let [min, max] = values

        // Ensure min doesn't exceed max visually
        if (min > max) {
            min = max
            setLocalPrice([min, max])
        }

        if (min > priceRange.min) params.set('minPrice', String(min))
        else params.delete('minPrice')

        if (max < priceRange.max) params.set('maxPrice', String(max))
        else params.delete('maxPrice')

        params.delete('page')
        startTransition(() => {
            router.push(`/produk?${params.toString()}`)
        })
    }, [priceRange.min, priceRange.max, router, searchParams])

    const hasActiveFilters = currentCategory || currentBadge || currentMinPrice || currentMaxPrice

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-brand-text dark:text-dark-text">Filter</h3>
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-primary" />}
                </div>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-brand-muted hover:text-red-500">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset
                    </Button>
                )}
            </div>

            <Separator />

            {/* Categories */}
            <div className="space-y-2.5">
                <h4 className="text-sm font-medium text-brand-text dark:text-dark-text">Kategori</h4>
                <div className="space-y-2">
                    {categories.map((cat) => (
                        <label
                            key={cat.id}
                            className={`flex items-center gap-2.5 cursor-pointer group rounded-lg px-2 py-1.5 -mx-2 transition-colors ${
                                currentCategory === cat.slug
                                    ? 'bg-brand-primary/5 dark:bg-brand-primary/10'
                                    : 'hover:bg-brand-surface/50 dark:hover:bg-dark-surface/50'
                            }`}
                        >
                            <Checkbox
                                checked={currentCategory === cat.slug}
                                onCheckedChange={(checked) =>
                                    handleCategoryChange(cat.slug, checked === true)
                                }
                            />
                            <span className={`text-sm flex-1 ${
                                currentCategory === cat.slug
                                    ? 'font-medium text-brand-primary dark:text-dark-primary'
                                    : 'text-brand-muted dark:text-dark-muted group-hover:text-brand-text dark:group-hover:text-dark-text'
                            }`}>
                                {cat.name}
                            </span>
                            {cat._count && (
                                <span className="text-xs text-brand-muted/60 dark:text-dark-muted/60 tabular-nums">
                                    {cat._count.products}
                                </span>
                            )}
                        </label>
                    ))}
                </div>
            </div>

            <Separator />

            {/* Price Range */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-brand-text dark:text-dark-text">Rentang Harga</h4>
                <Slider
                    min={priceRange.min}
                    max={priceRange.max}
                    step={5000}
                    value={localPrice}
                    onValueChange={setLocalPrice}
                    onValueCommit={handlePriceCommit}
                    className="mt-6 mb-4"
                />
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-brand-muted">Rp</span>
                        <Input
                            type="number"
                            className="h-8 pl-7 pr-2 text-xs font-medium"
                            value={localPrice[0]}
                            onChange={(e) => setLocalPrice([parseInt(e.target.value) || 0, localPrice[1]])}
                            onBlur={() => handlePriceCommit(localPrice)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePriceCommit(localPrice)}
                        />
                    </div>
                    <span className="text-brand-muted text-xs">-</span>
                    <div className="flex-1 relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-brand-muted">Rp</span>
                        <Input
                            type="number"
                            className="h-8 pl-7 pr-2 text-xs font-medium"
                            value={localPrice[1]}
                            onChange={(e) => setLocalPrice([localPrice[0], parseInt(e.target.value) || 0])}
                            onBlur={() => handlePriceCommit(localPrice)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePriceCommit(localPrice)}
                        />
                    </div>
                </div>
            </div>

            <Separator />

            {/* Badge */}
            <div className="space-y-2.5">
                <h4 className="text-sm font-medium text-brand-text dark:text-dark-text">Label Produk</h4>
                <div className="space-y-2">
                    {[
                        { value: 'NEW', label: 'Produk Baru', color: 'bg-blue-500' },
                        { value: 'HOT', label: 'Produk Populer', color: 'bg-red-500' },
                        { value: 'BEST SELLER', label: 'Terlaris', color: 'bg-amber-500' },
                    ].map((opt) => (
                        <label
                            key={opt.value}
                            className={`flex items-center gap-2.5 cursor-pointer group rounded-lg px-2 py-1.5 -mx-2 transition-colors ${
                                currentBadge === opt.value
                                    ? 'bg-brand-primary/5 dark:bg-brand-primary/10'
                                    : 'hover:bg-brand-surface/50 dark:hover:bg-dark-surface/50'
                            }`}
                        >
                            <Checkbox
                                checked={currentBadge === opt.value}
                                onCheckedChange={(checked) =>
                                    updateParams('badge', checked ? opt.value : null)
                                }
                            />
                            <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                            <span className={`text-sm ${
                                currentBadge === opt.value
                                    ? 'font-medium text-brand-primary dark:text-dark-primary'
                                    : 'text-brand-muted dark:text-dark-muted'
                            }`}>
                                {opt.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    )
}
