import { FadeIn } from '@/components/animations/FadeIn'
import ProductGallery from '@/components/public/ProductGallery'
import ProductInfo from '@/components/public/ProductInfo'
import ProductCard from '@/components/public/ProductCard'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export const revalidate = 600 // 10 menit — hemat Vercel Origin Transfer (admin update tetap instant via revalidateTag)

interface PageProps {
    params: Promise<{ slug: string }>
}

import { generatePageMetadata } from '@/lib/metadata'
import { getProductSchema, getBreadcrumbSchema } from '@/lib/structured-data'
import { JsonLd } from '@/components/public/JsonLd'
import { MetaViewContent } from '@/components/analytics/MetaViewContent'
import { getCachedProductBySlug, getCachedRelatedProducts } from '@/lib/cached-queries'

export async function generateStaticParams() {
    const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true },
    })
    return products.map((product) => ({
        slug: product.slug,
    }))
}

export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params
    // Pakai cached query — tidak double query ke DB
    const product = await getCachedProductBySlug(slug)

    if (!product) return { title: 'Produk Tidak Ditemukan - Roxy Store' }

    return generatePageMetadata({
        title: product.title,
        description: product.description.slice(0, 155),
        image: product.image,
        path: `/produk/${slug}`,
        type: 'article',
    })
}

export default async function ProductDetailPage({ params }: PageProps) {
    const { slug } = await params

    // Pakai cached query — sama dengan generateMetadata, tidak double hit DB
    const product = await getCachedProductBySlug(slug)

    if (!product) notFound()

    const relatedProducts = await getCachedRelatedProducts(product.categoryId, product.id)

    return (
        <div className="container mx-auto px-4 py-4 md:py-8">
            {/* JSON-LD Structured Data */}
            <JsonLd data={getProductSchema(product as Parameters<typeof getProductSchema>[0])} />
            <JsonLd data={getBreadcrumbSchema([
                { name: 'Beranda', url: '/' },
                { name: 'Produk', url: '/produk' },
                { name: product.category.name, url: `/kategori/${product.category.slug}` },
                ...(product.subcategory ? [{ name: product.subcategory.name, url: `/produk?kategori=${product.category.slug}&subkategori=${product.subcategory.slug}` }] : []),
                { name: product.title, url: `/produk/${product.slug}` }
            ])} />

            {/* Meta Pixel: ViewContent event */}
            <MetaViewContent
                productId={product.id}
                productName={product.title}
                price={product.price}
                category={product.category.name}
            />

            {/* Breadcrumb — compact on mobile */}
            <Breadcrumb className="mb-4 md:mb-6 text-xs md:text-sm">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Beranda</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/produk">Produk</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/kategori/${product.category.slug}`}>
                            {product.category.name}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    {product.subcategory && (
                        <>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href={`/produk?kategori=${product.category.slug}&subkategori=${product.subcategory.slug}`}>
                                    {product.subcategory.name}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </>
                    )}
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage className="line-clamp-1 max-w-[150px] md:max-w-none">
                            {product.title}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Main Content — gap disesuaikan mobile/desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-6 lg:gap-12 items-start">
                <FadeIn direction="left" className="w-full max-w-[450px] mx-auto lg:mx-0">
                    <ProductGallery product={product as unknown as import('@/types').ProductType} />
                </FadeIn>
                <FadeIn direction="right">
                    <ProductInfo product={product as unknown as import('@/types').ProductType} />
                </FadeIn>
            </div>

            {/* Produk Serupa */}
            {relatedProducts.length > 0 && (
                <section className="mt-12 md:mt-16">
                    <FadeIn>
                        <h2 className="text-xl md:text-2xl font-bold text-brand-text dark:text-dark-text mb-4 md:mb-6">
                            ✨ Produk Serupa di {product.category.name}
                        </h2>
                    </FadeIn>
                    <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 md:gap-4">
                        {relatedProducts.map((p) => (
                            <StaggerItem key={p.id}>
                                <ProductCard product={p as unknown as import('@/types').ProductType} />
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </section>
            )}
        </div>
    )
}
