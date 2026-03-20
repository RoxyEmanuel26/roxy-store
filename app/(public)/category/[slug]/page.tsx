import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import ProductCard from '@/components/public/ProductCard'
import ProductToolbar from '@/components/public/ProductToolbar'
import { Button } from '@/components/ui/button'
import { Search as SearchIcon } from 'lucide-react'

export const revalidate = 30
const ITEMS_PER_PAGE = 12

interface PageProps {
    params: Promise<{ slug: string }>
    searchParams: Promise<Record<string, string | undefined>>
}

import { generatePageMetadata } from '@/lib/metadata'

export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params
    const category = await prisma.category.findUnique({ where: { slug } })
    if (!category) return { title: 'Kategori Tidak Ditemukan - Roxy Lay' }
    return generatePageMetadata({
        title: category.name,
        description: category.description || `Koleksi produk kategori ${category.name} dari Roxy Lay. Temukan produk favoritmu sekarang!`,
        path: `/category/${slug}`,
    })
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
    const { slug } = await params
    const sp = await searchParams

    const category = await prisma.category.findUnique({ where: { slug } })
    if (!category) notFound()

    const sort = sp.sort || 'newest'
    const page = Math.max(1, Number(sp.page) || 1)
    const q = sp.q || ''
    const badge = sp.badge || ''
    const minPrice = sp.minPrice ? Number(sp.minPrice) : undefined
    const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined

    const where: any = { isActive: true, categoryId: category.id }
    if (q) where.title = { contains: q, mode: 'insensitive' }
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

    const [products, total, priceAgg] = await Promise.all([
        prisma.product.findMany({
            where,
            include: { category: true },
            orderBy: orderByMap[sort] || orderByMap.newest,
            skip: (page - 1) * ITEMS_PER_PAGE,
            take: ITEMS_PER_PAGE,
        }),
        prisma.product.count({ where }),
        prisma.product.aggregate({
            _min: { price: true },
            _max: { price: true },
            where: { isActive: true, categoryId: category.id },
        }),
    ])

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

    return (
        <div className="container mx-auto px-4 py-8">
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/">Beranda</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink href="/products">Produk</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>{category.name}</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-brand-text dark:text-dark-text">{category.name}</h1>
                {category.description && (
                    <p className="text-brand-muted dark:text-dark-muted mt-2">{category.description}</p>
                )}
                <p className="text-brand-muted dark:text-dark-muted mt-1">{total} produk ditemukan</p>
            </div>

            <Suspense>
                <ProductToolbar
                    currentSort={sort}
                    currentQuery={q}
                    categories={[]}
                    currentCategory=""
                    currentBadge={badge}
                    priceRange={{ min: priceAgg._min.price || 0, max: priceAgg._max.price || 1000000 }}
                    currentMinPrice={minPrice}
                    currentMaxPrice={maxPrice}
                />
            </Suspense>

            {products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                    {products.map((product: any) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <SearchIcon className="h-16 w-16 text-brand-muted/40 mb-4" />
                    <h3 className="text-lg font-semibold text-brand-text dark:text-dark-text">Produk tidak ditemukan</h3>
                    <p className="text-sm text-brand-muted mt-1">Belum ada produk di kategori ini</p>
                    <Link href="/products">
                        <Button variant="outline" className="mt-4 border-brand-primary text-brand-primary">Lihat Semua Produk</Button>
                    </Link>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    {page > 1 && (
                        <Link href={`/category/${slug}?${new URLSearchParams({ ...sp, page: String(page - 1) } as any).toString()}`}>
                            <Button variant="outline" size="sm">Sebelumnya</Button>
                        </Link>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => Math.abs(p - page) < 3 || p === 1 || p === totalPages)
                        .map((p, idx, arr) => (
                            <span key={p}>
                                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-brand-muted">…</span>}
                                <Link href={`/category/${slug}?${new URLSearchParams({ ...sp, page: String(p) } as any).toString()}`}>
                                    <Button variant={p === page ? 'default' : 'outline'} size="sm" className={p === page ? 'bg-brand-primary text-white' : ''}>
                                        {p}
                                    </Button>
                                </Link>
                            </span>
                        ))}
                    {page < totalPages && (
                        <Link href={`/category/${slug}?${new URLSearchParams({ ...sp, page: String(page + 1) } as any).toString()}`}>
                            <Button variant="outline" size="sm">Berikutnya</Button>
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
