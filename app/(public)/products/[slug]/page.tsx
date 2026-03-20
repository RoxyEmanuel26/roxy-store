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

export const revalidate = 120

interface PageProps {
    params: Promise<{ slug: string }>
}

import { generatePageMetadata } from '@/lib/metadata'
import { getProductSchema, getBreadcrumbSchema } from '@/lib/structured-data'
import { JsonLd } from '@/components/public/JsonLd'

export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params
    const product = await prisma.product.findUnique({
        where: { slug },
        select: { title: true, description: true, image: true },
    })

    if (!product) return { title: 'Produk Tidak Ditemukan - Roxy Lay' }

    return generatePageMetadata({
        title: product.title,
        description: product.description.slice(0, 155),
        image: product.image,
        path: `/products/${slug}`,
        type: 'website', // using 'website' to prevent type issues
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
            image: true,
            images: true,
            shopeeUrl: true,
            tokopediaUrl: true,
            badge: true,
            viewCount: true,
            shopeeClicks: true,
            tokopediaClicks: true,
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
            image: true,
            badge: true,
            category: { select: { name: true, slug: true } }
        },
        take: 4,
        orderBy: { viewCount: 'desc' },
    })

    return (
        <div className="container mx-auto px-4 py-8">
            <JsonLd data={getProductSchema(product as any)} />
            <JsonLd data={getBreadcrumbSchema([
                { name: 'Beranda', url: '/' },
                { name: 'Produk', url: '/products' },
                { name: product.category.name, url: `/category/${product.category.slug}` },
                { name: product.title, url: `/products/${product.slug}` }
            ])} />

            {/* Breadcrumb */}
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Beranda</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/products">Produk</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/category/${product.category.slug}`}>
                            {product.category.name}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{product.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <FadeIn direction="left">
                    <ProductGallery images={[product.image, ...(product.images || [])]} />
                </FadeIn>
                <FadeIn direction="right">
                    <ProductInfo product={product as any} />
                </FadeIn>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section className="mt-16">
                    <FadeIn>
                        <h2 className="text-2xl font-bold text-brand-text dark:text-dark-text mb-6">
                            Produk Lainnya di {product.category.name}
                        </h2>
                    </FadeIn>
                    <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {relatedProducts.map((p: any) => (
                            <StaggerItem key={p.id}>
                                <ProductCard product={p} />
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </section>
            )}
        </div>
    )
}
