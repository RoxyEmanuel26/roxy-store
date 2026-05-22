'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { RotateCcw, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface FilterSidebarProps {
    categories: {
        id: string
        name: string
        slug: string
        subcategories?: {
            id: string
            name: string
            slug: string
            _count?: { products: number }
        }[]
        _count?: { products: number }
    }[]
    currentCategory?: string
    currentSubcategory?: string
    currentBadge?: string
    priceRange: { min: number; max: number }
    currentMinPrice?: number
    currentMaxPrice?: number
}

export default function FilterSidebar({
    categories,
    currentCategory,
    currentSubcategory,
    currentBadge,
    priceRange,
    currentMinPrice,
    currentMaxPrice,
}: FilterSidebarProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [isExpanded, setIsExpanded] = useState(() => {
        if (!currentCategory) return false
        const selectedIndex = categories.findIndex((cat) => cat.slug === currentCategory)
        return selectedIndex >= 5
    })

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

    const handleSubcategoryChange = (subSlug: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('subcategory')
        params.delete('subkategori')
        if (subSlug) {
            params.set('subkategori', subSlug)
        }
        params.delete('page')
        startTransition(() => {
            router.push(`/produk?${params.toString()}`)
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

    const hasActiveFilters = currentCategory || currentSubcategory || currentBadge || currentMinPrice || currentMaxPrice

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
            {currentCategory ? (
                <div className="space-y-3.5">
                    {/* Semua Kategori Back Button */}
                    <button
                        type="button"
                        onClick={() => {
                            const params = new URLSearchParams(searchParams.toString())
                            params.delete('category')
                            params.delete('kategori')
                            params.delete('subcategory')
                            params.delete('subkategori')
                            params.delete('page')
                            startTransition(() => {
                                router.push(`/produk?${params.toString()}`)
                            })
                        }}
                        className="flex items-center gap-2 text-sm font-semibold text-brand-text dark:text-dark-text hover:text-brand-primary dark:hover:text-dark-primary transition-colors py-1.5 w-full text-left group"
                    >
                        <span className="w-5 h-5 rounded bg-brand-surface dark:bg-dark-surface flex items-center justify-center text-brand-muted group-hover:text-brand-primary transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </span>
                        <span>Semua Kategori</span>
                    </button>

                    <Separator className="opacity-50" />

                    {/* Selected Category Header */}
                    <div className="flex items-center gap-1.5 text-brand-primary dark:text-dark-primary font-bold text-sm py-1">
                        <span className="text-[10px] text-brand-primary">▶</span>
                        <span>{categories.find(c => c.slug === currentCategory)?.name || currentCategory}</span>
                    </div>

                    {/* Subcategories list */}
                    <div className="space-y-1.5 pl-3 border-l border-brand-border/30 dark:border-dark-border/30 ml-1.5">
                        {categories.find(c => c.slug === currentCategory)?.subcategories?.map((sub) => {
                            const isActive = currentSubcategory === sub.slug
                            return (
                                <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => handleSubcategoryChange(isActive ? null : sub.slug)}
                                    className={`flex items-center justify-between w-full text-left text-xs py-1.5 transition-colors ${
                                        isActive
                                            ? 'font-semibold text-brand-primary dark:text-dark-primary'
                                            : 'text-brand-muted hover:text-brand-text dark:text-dark-muted dark:hover:text-dark-text'
                                    }`}
                                >
                                    <span className="truncate pr-2">{sub.name}</span>
                                    {sub._count?.products !== undefined && (
                                        <span className="text-[10px] text-brand-muted/50 dark:text-dark-muted/50 tabular-nums">
                                            ({sub._count.products})
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                        {(!categories.find(c => c.slug === currentCategory)?.subcategories || 
                          categories.find(c => c.slug === currentCategory)?.subcategories?.length === 0) && (
                            <span className="text-xs text-brand-muted/50 dark:text-dark-muted/50 italic pl-1">
                                Tidak ada sub-kategori
                            </span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-2.5">
                    <h4 className="text-sm font-medium text-brand-text dark:text-dark-text">Kategori</h4>
                    <div className="space-y-2">
                        {(isExpanded ? categories : categories.slice(0, 5)).map((cat) => (
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

                        {categories.length > 5 && (
                            <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex items-center gap-2 text-sm font-medium text-brand-primary dark:text-dark-primary hover:text-brand-primary/80 dark:hover:text-dark-primary/80 transition-colors py-1 px-2 -mx-2 rounded-lg hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10 w-full text-left"
                            >
                                <span className="flex-1">
                                    {isExpanded ? 'Sembunyikan' : 'Lainnya'}
                                </span>
                                {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}

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
