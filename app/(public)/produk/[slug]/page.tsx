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

export const revalidate = 60

interface PageProps {
    params: Promise<{ slug: string }>
}

import { generatePageMetadata } from '@/lib/metadata'
import { getProductSchema, getBreadcrumbSchema } from '@/lib/structured-data'
import { JsonLd } from '@/components/public/JsonLd'
import { MetaViewContent } from '@/components/analytics/MetaViewContent'

export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params
    const product = await prisma.product.findUnique({
        where: { slug },
        select: { title: true, description: true, image: true },
    })

    if (!product) return { title: 'Produk Tidak Ditemukan - Roxy Store' }

    return generatePageMetadata({
        title: product.title,
        description: product.description.slice(0, 155),
        image: product.image,
        path: `/produk/${slug}`,
        type: 'website',
    })
}

export default async function ProductDetailPage({ params }: PageProps) {
    const { slug } = await params

    const product = await prisma.product.findUnique({
        where: { slug, isActive: true },
        select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            price: true,
            originalPrice: true,
            image: true,
            images: true,
            shopeeUrl: true,
            shopeeRating: true,
            shopeeSold: true,
            badge: true,
            viewCount: true,
            shopeeClicks: true,
            categoryId: true,
            category: { select: { id: true, name: true, slug: true } }
        }
    })

    if (!product) notFound()

    const relatedProducts = await prisma.product.findMany({
        where: {
            categoryId: product.categoryId,
            isActive: true,
            NOT: { id: product.id },
        },
        select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            originalPrice: true,
            image: true,
            badge: true,
            shopeeRating: true,
            shopeeSold: true,
            category: { select: { name: true, slug: true } }
        },
        take: 4,
        orderBy: { viewCount: 'desc' },
    })

    return (
        <div className="container mx-auto px-4 py-4 md:py-8">
            {/* JSON-LD Structured Data */}
            <JsonLd data={getProductSchema(product as Parameters<typeof getProductSchema>[0])} />
            <JsonLd data={getBreadcrumbSchema([
                { name: 'Beranda', url: '/' },
                { name: 'Produk', url: '/produk' },
                { name: product.category.name, url: `/kategori/${product.category.slug}` },
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
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage className="line-clamp-1 max-w-[150px] md:max-w-none">
                            {product.title}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Main Content — gap disesuaikan mobile/desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
                <FadeIn direction="left">
                    <ProductGallery images={[product.image, ...(product.images || [])]} />
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
                    <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
