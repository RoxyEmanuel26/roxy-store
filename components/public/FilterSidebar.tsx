'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { RotateCcw } from 'lucide-react'

interface FilterSidebarProps {
    categories: { id: string; name: string; slug: string }[]
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

    const updateParams = useCallback(
        (key: string, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString())
            if (value) {
                params.set(key, value)
            } else {
                params.delete(key)
            }
            params.delete('page') // reset pagination
            router.push(`/products?${params.toString()}`)
        },
        [router, searchParams]
    )

    const handleReset = () => {
        router.push('/products')
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
        router.push(`/products?${params.toString()}`)
    }, [priceRange.min, priceRange.max, router, searchParams])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-brand-text dark:text-dark-text">Filter</h3>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-brand-muted">
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                </Button>
            </div>

            <Separator />

            {/* Categories */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-brand-text dark:text-dark-text">Kategori</h4>
                {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                            checked={currentCategory === cat.slug}
                            onCheckedChange={(checked) =>
                                updateParams('category', checked ? cat.slug : null)
                            }
                        />
                        <span className="text-sm text-brand-muted dark:text-dark-muted">{cat.name}</span>
                    </label>
                ))}
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
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-brand-text dark:text-dark-text">Badge</h4>
                {[
                    { value: 'NEW', label: 'Produk Baru (NEW)' },
                    { value: 'HOT', label: 'Produk Populer (HOT)' },
                    { value: 'BEST SELLER', label: 'Terlaris (BEST SELLER)' },
                ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                            checked={currentBadge === opt.value}
                            onCheckedChange={(checked) =>
                                updateParams('badge', checked ? opt.value : null)
                            }
                        />
                        <span className="text-sm text-brand-muted dark:text-dark-muted">{opt.label}</span>
                    </label>
                ))}
            </div>
        </div>
    )
}
