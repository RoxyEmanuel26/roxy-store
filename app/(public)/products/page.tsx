import { Suspense } from 'react'
import Link from 'next/link'
import { Search as SearchIcon, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import FilterSidebar from '@/components/public/FilterSidebar'
import ProductToolbar from '@/components/public/ProductToolbar'
import ProductListClient from '@/components/public/ProductListClient'
import { FadeIn } from '@/components/animations/FadeIn'

export const revalidate = 30

import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'

const ITEMS_PER_PAGE = 12

interface PageProps {
    searchParams: Promise<Record<string, string | undefined>>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
    const params = await searchParams
    const category = params.kategori || params.category || ''
    const sort = params.sort || ''

    const parts = ['Koleksi Produk']
    if (category) parts.push(`Kategori ${category.charAt(0).toUpperCase() + category.slice(1)}`)

    const sortLabels: Record<string, string> = {
        terlaris: 'Terlaris',
        'rating-tertinggi': 'Rating Tertinggi',
        'harga-terendah': 'Harga Terendah',
        'harga-tertinggi': 'Harga Tertinggi',
        terbaru: 'Terbaru',
    }
    if (sort && sortLabels[sort]) parts.push(sortLabels[sort])

    return generatePageMetadata({
        title: parts.join(' - '),
        description: `Jelajahi ${category ? `produk ${category}` : 'semua produk'} di Roxy Store. Temukan produk terbaik dengan harga terjangkau.`,
        path: '/products',
    })
}

export default async function ProductsPage({ searchParams }: PageProps) {
    const params = await searchParams

    // Support both Indonesian and English query params
    const q = params.q || ''
    const category = params.kategori || params.category || ''
    const badge = params.badge || ''
    const minPrice = params.minPrice ? Number(params.minPrice) : undefined
    const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined
    const sort = params.sort || 'terbaru'

    // Build where clause
    const where: Record<string, unknown> = { isActive: true }
    if (q) where.title = { contains: q, mode: 'insensitive' }
    if (category) where.category = { slug: category }
    if (badge) where.badge = badge
    if (minPrice || maxPrice) {
        const priceFilter: Record<string, number> = {}
        if (minPrice) priceFilter.gte = minPrice
        if (maxPrice) priceFilter.lte = maxPrice
        where.price = priceFilter
    }

    const orderByMap: Record<string, Record<string, string>> = {
        terbaru: { createdAt: 'desc' },
        newest: { createdAt: 'desc' },
        terlaris: { shopeeSold: 'desc' },
        'rating-tertinggi': { shopeeRating: 'desc' },
        'harga-terendah': { price: 'asc' },
        'price-asc': { price: 'asc' },
        'harga-tertinggi': { price: 'desc' },
        'price-desc': { price: 'desc' },
        popular: { viewCount: 'desc' },
    }
    const orderBy = orderByMap[sort] || orderByMap.terbaru

    const [products, total, allCategories, priceAgg] = await Promise.all([
        prisma.product.findMany({
            where,
            select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                originalPrice: true,
                image: true,
                badge: true,
                viewCount: true,
                shopeeRating: true,
                shopeeSold: true,
                category: { select: { name: true, slug: true } }
            },
            orderBy,
            take: ITEMS_PER_PAGE,
        }),
        prisma.product.count({ where }),
        prisma.category.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                slug: true,
                _count: { select: { products: { where: { isActive: true } } } }
            }
        }),
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

    // Build search params for infinite scroll client — use SEO-friendly params
    const clientSearchParams: Record<string, string> = {}
    if (q) clientSearchParams.q = q
    if (category) clientSearchParams.kategori = category
    if (badge) clientSearchParams.badge = badge
    if (minPrice) clientSearchParams.minPrice = String(minPrice)
    if (maxPrice) clientSearchParams.maxPrice = String(maxPrice)
    if (sort) clientSearchParams.sort = sort

    // Active filter count
    const activeFilters = [category, badge, minPrice, maxPrice].filter(Boolean).length

    return (
        <div className="container mx-auto px-4 py-6 md:py-8">
            {/* Header */}
            <FadeIn>
                <div className="mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-brand-text dark:text-dark-text">
                        {category
                            ? allCategories.find(c => c.slug === category)?.name || 'Produk'
                            : 'Semua Produk'}
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5">
                        <Package className="h-4 w-4 text-brand-muted dark:text-dark-muted" />
                        <p className="text-sm text-brand-muted dark:text-dark-muted">
                            <span className="font-semibold text-brand-text dark:text-dark-text">{total}</span> produk ditemukan
                            {q && <> untuk &ldquo;<span className="font-medium text-brand-primary">{q}</span>&rdquo;</>}
                        </p>
                    </div>
                </div>
            </FadeIn>

            <div className="flex gap-8">
                {/* Sidebar Filter (desktop only) */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                    <div className="sticky top-24">
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
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <Suspense>
                        <ProductToolbar
                            currentSort={sort}
                            currentQuery={q}
                            total={total}
                            activeFilters={activeFilters}
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
                            initialProducts={products as unknown as import('@/types').ProductType[]}
                            initialTotal={total}
                            searchParams={clientSearchParams}
                            limit={ITEMS_PER_PAGE}
                        />
                    ) : (
                        <FadeIn>
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 rounded-full bg-brand-surface dark:bg-dark-surface flex items-center justify-center mb-4">
                                    <SearchIcon className="h-10 w-10 text-brand-muted/40" />
                                </div>
                                <h3 className="text-lg font-semibold text-brand-text dark:text-dark-text">
                                    Produk tidak ditemukan
                                </h3>
                                <p className="text-sm text-brand-muted dark:text-dark-muted mt-1 max-w-sm">
                                    Coba ubah filter atau kata kunci pencarian untuk menemukan produk yang Anda cari
                                </p>
                                <Link href="/products">
                                    <Button variant="outline" className="mt-4 border-brand-primary text-brand-primary transition-none">
                                        Lihat Semua Produk
                                    </Button>
                                </Link>
                            </div>
                        </FadeIn>
                    )}
                </div>
            </div>
        </div>
    )
}
