import { Suspense } from 'react'
import Link from 'next/link'
import { Search as SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import FilterSidebar from '@/components/public/FilterSidebar'
import ProductToolbar from '@/components/public/ProductToolbar'
import ProductListClient from '@/components/public/ProductListClient'

export const revalidate = 30

import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
    title: 'Koleksi Produk',
    description: 'Jelajahi semua koleksi produk dan aksesori dari Roxy Lay. Temukan gantungan kunci, beads bracelet, dan lainnya.',
    path: '/products',
})

const ITEMS_PER_PAGE = 12

interface PageProps {
    searchParams: Promise<Record<string, string | undefined>>
}

export default async function ProductsPage({ searchParams }: PageProps) {
    const params = await searchParams
    const q = params.q || ''
    const category = params.category || ''
    const badge = params.badge || ''
    const minPrice = params.minPrice ? Number(params.minPrice) : undefined
    const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined
    const sort = params.sort || 'newest'

    // Build where clause
    const where: any = { isActive: true }
    if (q) where.title = { contains: q, mode: 'insensitive' }
    if (category) where.category = { slug: category }
    if (badge) where.badge = badge
    if (minPrice || maxPrice) {
        where.price = {}
        if (minPrice) where.price.gte = minPrice
        if (maxPrice) where.price.lte = maxPrice
    }

    const orderByMap: Record<string, any> = {
        newest: { createdAt: 'desc' },
        'price-asc': { price: 'asc' },
        'price-desc': { price: 'desc' },
        popular: { viewCount: 'desc' },
    }
    const orderBy = orderByMap[sort] || orderByMap.newest

    const [products, total, allCategories, priceAgg] = await Promise.all([
        prisma.product.findMany({
            where,
            select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                image: true,
                badge: true,
                category: { select: { name: true, slug: true } }
            },
            orderBy,
            take: ITEMS_PER_PAGE,
        }),
        prisma.product.count({ where }),
        prisma.category.findMany({ orderBy: { name: 'asc' } }),
        prisma.product.aggregate({
            _min: { price: true },
            _max: { price: true },
            where: { isActive: true },
        }),
    ])

    const priceRange = {
        min: priceAgg._min.price || 0,
        max: priceAgg._max.price || 1000000,
    }

    // Build search params for infinite scroll client
    const clientSearchParams: Record<string, string> = {}
    if (q) clientSearchParams.q = q
    if (category) clientSearchParams.category = category
    if (badge) clientSearchParams.badge = badge
    if (minPrice) clientSearchParams.minPrice = String(minPrice)
    if (maxPrice) clientSearchParams.maxPrice = String(maxPrice)
    if (sort) clientSearchParams.sort = sort

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-brand-text dark:text-dark-text">Semua Produk</h1>
                <p className="text-brand-muted dark:text-dark-muted mt-1">{total} produk ditemukan</p>
            </div>

            <div className="flex gap-8">
                {/* Sidebar Filter (desktop) */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                    <Suspense>
                        <FilterSidebar
                            categories={allCategories}
                            currentCategory={category}
                            currentBadge={badge}
                            priceRange={priceRange}
                            currentMinPrice={minPrice}
                            currentMaxPrice={maxPrice}
                        />
                    </Suspense>
                </aside>

                {/* Main Content */}
                <div className="flex-1">
                    <Suspense>
                        <ProductToolbar
                            currentSort={sort}
                            currentQuery={q}
                            categories={allCategories}
                            currentCategory={category}
                            currentBadge={badge}
                            priceRange={priceRange}
                            currentMinPrice={minPrice}
                            currentMaxPrice={maxPrice}
                        />
                    </Suspense>

                    {/* Products Grid with Infinite Scroll */}
                    {products.length > 0 ? (
                        <ProductListClient
                            initialProducts={products as any}
                            initialTotal={total}
                            searchParams={clientSearchParams}
                            limit={ITEMS_PER_PAGE}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <SearchIcon className="h-16 w-16 text-brand-muted/40 mb-4" />
                            <h3 className="text-lg font-semibold text-brand-text dark:text-dark-text">
                                Produk tidak ditemukan
                            </h3>
                            <p className="text-sm text-brand-muted dark:text-dark-muted mt-1">
                                Coba ubah filter atau kata kunci pencarian
                            </p>
                            <Link href="/products">
                                <Button variant="outline" className="mt-4 border-brand-primary text-brand-primary transition-none">
                                    Lihat Semua Produk
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
