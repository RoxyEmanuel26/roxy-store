'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import ProductCard from '@/components/public/ProductCard'
import { InfiniteScrollTrigger } from '@/components/public/InfiniteScrollTrigger'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer'
import type { ProductType } from '@/types'

interface ProductListClientProps {
    initialProducts: ProductType[]
    initialTotal: number
    searchParams: Record<string, string>
    limit?: number
}

export default function ProductListClient({
    initialProducts,
    initialTotal,
    searchParams,
    limit = 12,
}: ProductListClientProps) {
    // Serialize searchParams to a stable key — when this changes, we know the query changed
    const searchKey = useMemo(() => JSON.stringify(searchParams), [searchParams])

    const [products, setProducts] = useState<ProductType[]>(initialProducts)
    const [page, setPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [hasMore, setHasMore] = useState(initialProducts.length < initialTotal)

    // Reset when search params change (use searchKey for reliable detection)
    useEffect(() => {
        setProducts(initialProducts)
        setPage(1)
        setHasMore(initialProducts.length < initialTotal)
    }, [searchKey, initialProducts, initialTotal])

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return

        setIsLoading(true)
        const nextPage = page + 1

        const params = new URLSearchParams({
            ...searchParams,
            page: String(nextPage),
            limit: String(limit),
        })

        try {
            const res = await fetch(`/api/products/list?${params}`)
            const data = await res.json()

            setProducts((prev) => [...prev, ...data.products])
            setPage(nextPage)
            setHasMore(products.length + data.products.length < data.total)
        } finally {
            setIsLoading(false)
        }
    }, [page, isLoading, hasMore, searchParams, products.length, limit])

    if (products.length === 0) return null

    // Split: initial products get stagger animation, loaded products render directly
    const initialCount = initialProducts.length

    return (
        <>
            <StaggerContainer
                key={searchKey}
                className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 min-h-[50vh]"
            >
                {products.slice(0, initialCount).map((product) => (
                    <StaggerItem key={product.id}>
                        <ProductCard product={product} />
                    </StaggerItem>
                ))}

                {/* Dynamically loaded products — render directly without stagger animation */}
                {products.slice(initialCount).map((product) => (
                    <div key={product.id}>
                        <ProductCard product={product} />
                    </div>
                ))}
            </StaggerContainer>

            <InfiniteScrollTrigger
                onIntersect={loadMore}
                isLoading={isLoading}
                hasMore={hasMore}
            />
        </>
    )
}
