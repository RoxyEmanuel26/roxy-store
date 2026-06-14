import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSiteSettings } from '@/lib/site-settings'
import ProductCard from '@/components/public/ProductCard'
import { RecentlyViewed } from '@/components/public/RecentlyViewed'
import CategoryCarousel from '@/components/public/CategoryCarousel'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer'
import HomeCarousel from '@/components/public/HomeCarousel'

import { generatePageMetadata } from '@/lib/metadata'
import { getOrganizationSchema, getWebsiteSchema, getItemListSchema } from '@/lib/structured-data'
import { JsonLd } from '@/components/public/JsonLd'

import {
    getCachedCategories,
    getCachedFeaturedProducts,
    getCachedNewProducts,
    getCachedProductCount
} from '@/lib/cached-queries'

export const revalidate = 600 // 10 menit — hemat Vercel Origin Transfer (admin update tetap instant via revalidateTag)

export const metadata = generatePageMetadata({
    title: 'Beranda',
    description: 'Roxy Store — Rekomendasi produk terlaris & terpercaya di Shopee 2026. Temukan produk skincare, fashion, elektronik, rumah tangga, dan lainnya yang sudah dikurasi berdasarkan rating & ulasan terbaik.',
    path: '/',
})

export default async function HomePage() {
    const [settings, featuredProducts, newProducts, categories, totalProducts] =
        await Promise.all([
            getSiteSettings(),
            getCachedFeaturedProducts(),
            getCachedNewProducts(),
            getCachedCategories(),
            getCachedProductCount(),
        ])

    return (
        <>
            <JsonLd data={getOrganizationSchema(settings as any)} />
            <JsonLd data={getWebsiteSchema()} />
            {featuredProducts.length > 0 && (
                <JsonLd data={getItemListSchema(featuredProducts as Parameters<typeof getItemListSchema>[0])} />
            )}

            {/* === BANNER HOME CAROUSEL === */}
            {settings.home_banners && settings.home_banners.length > 0 && (
                <section className="pt-6 pb-2 bg-brand-surface dark:bg-dark-bg">
                    <div className="container mx-auto px-4">
                        <HomeCarousel banners={settings.home_banners} />
                    </div>
                </section>
            )}

            {/* === SECTION 5: NEW PRODUCTS (Moved to top) === */}
            <section className="py-8 bg-brand-surface dark:bg-dark-bg">
                <div className="container mx-auto px-4">
                    <FadeIn>
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-brand-text dark:text-dark-text">Baru Masuk 🆕</h2>
                                <p className="text-sm md:text-base text-brand-muted dark:text-dark-muted mt-1">Produk terbaru yang baru saja dikurasi untuk kamu</p>
                            </div>
                            <Link href="/produk?sort=newest">
                                <Button variant="outline" className="border-brand-primary text-brand-primary hidden sm:flex transition-none">
                                    Lihat Semua <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </FadeIn>
                    {newProducts.length > 0 ? (
                        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 md:gap-4">
                            {newProducts.map((product) => (
                                <StaggerItem key={product.id}>
                                    <ProductCard product={product as any} />
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    ) : (
                        <p className="text-center text-brand-muted py-8">Belum ada produk terbaru</p>
                    )}
                </div>
            </section>


            {/* === SECTION 3: CATEGORIES === */}
            {categories.length > 0 && (
                <section className="py-8 bg-brand-surface dark:bg-dark-bg">
                    <div className="container mx-auto px-4">
                        <FadeIn>
                            <CategoryCarousel categories={categories as any} />
                        </FadeIn>
                    </div>
                </section>
            )}

            {/* === SECTION 4: FEATURED PRODUCTS === */}
            <section className="py-16 bg-brand-surface dark:bg-dark-surface">
                <div className="container mx-auto px-4">
                    <FadeIn>
                        <div className="flex justify-between items-end mb-10">
                            <div>
                                <h2 className="text-3xl font-bold text-brand-text dark:text-dark-text">Produk Pilihan ⭐</h2>
                                <p className="text-brand-muted dark:text-dark-muted mt-1">Dikurasi berdasarkan rating tertinggi & paling banyak terjual di Shopee</p>
                            </div>
                            <Link href="/produk">
                                <Button variant="outline" className="border-brand-primary text-brand-primary hidden sm:flex transition-none">
                                    Lihat Semua <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </FadeIn>
                    {featuredProducts.length > 0 ? (
                        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 md:gap-4">
                            {featuredProducts.map((product, index) => (
                                <StaggerItem key={product.id}>
                                    <ProductCard product={product as any} priority={index < 4} />
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    ) : (
                        <p className="text-center text-brand-muted py-8">Belum ada produk unggulan</p>
                    )}
                    <div className="text-center mt-6 sm:hidden">
                        <Link href="/produk">
                            <Button variant="outline" className="border-brand-primary text-brand-primary transition-none">
                                Lihat Semua Produk <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>


            {/* === SECTION 6: RECENTLY VIEWED === */}
            <RecentlyViewed />

            {/* === SECTION 7: VALUE PROPOSITION BANNER === */}
            <section className="py-12 bg-gradient-to-br from-brand-primary/5 via-brand-surface to-brand-secondary/10 dark:from-dark-surface dark:via-dark-bg dark:to-dark-surface">
                <div className="container mx-auto px-4">
                    <FadeIn>
                        <div className="text-center max-w-2xl mx-auto mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold text-brand-text dark:text-dark-text">
                                Kenapa Belanja Lewat Roxy Store? 🤔
                            </h2>
                            <p className="text-brand-muted dark:text-dark-muted mt-2">
                                Hemat waktu riset, langsung dapat produk terbaik
                            </p>
                        </div>
                    </FadeIn>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FadeIn delay={0}>
                            <div className="text-center p-6 bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-brand-border/30 dark:border-dark-border">
                                <span className="text-4xl mb-3 block">🔍</span>
                                <h3 className="font-bold text-brand-text dark:text-dark-text mb-2">Sudah Dikurasi</h3>
                                <p className="text-sm text-brand-muted dark:text-dark-muted">Setiap produk diseleksi berdasarkan rating ≥4.0, ulasan asli, dan jumlah terjual di Shopee</p>
                            </div>
                        </FadeIn>
                        <FadeIn delay={0.1}>
                            <div className="text-center p-6 bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-brand-border/30 dark:border-dark-border">
                                <span className="text-4xl mb-3 block">💰</span>
                                <h3 className="font-bold text-brand-text dark:text-dark-text mb-2">Harga Sama dengan Shopee</h3>
                                <p className="text-sm text-brand-muted dark:text-dark-muted">Kami hanya merekomendasikan, bukan menjual. Harga & promo sama persis dengan Shopee</p>
                            </div>
                        </FadeIn>
                        <FadeIn delay={0.2}>
                            <div className="text-center p-6 bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-brand-border/30 dark:border-dark-border">
                                <span className="text-4xl mb-3 block">⚡</span>
                                <h3 className="font-bold text-brand-text dark:text-dark-text mb-2">Hemat Waktu Riset</h3>
                                <p className="text-sm text-brand-muted dark:text-dark-muted">Nggak perlu scroll Shopee berjam-jam. Cukup buka Roxy Store dan temukan yang terbaik</p>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* === SECTION 2: STATS === */}
            <section className="py-8 bg-brand-primary dark:bg-dark-surface">
                <div className="container mx-auto px-4">
                    <h2 className="sr-only">Statistik Roxy Store</h2>
                    <div className="grid grid-cols-3 gap-4 text-center text-white dark:text-dark-text">
                        <FadeIn delay={0}>
                            <div>
                                <p className="text-2xl font-bold">{totalProducts}+</p>
                                <p className="text-sm opacity-80">Produk Terkurasi</p>
                            </div>
                        </FadeIn>
                        <FadeIn delay={0.1}>
                            <div>
                                <p className="text-2xl font-bold">{categories.length}+</p>
                                <p className="text-sm opacity-80">Kategori Lengkap</p>
                            </div>
                        </FadeIn>
                        <FadeIn delay={0.2}>
                            <div>
                                <p className="text-2xl font-bold">⭐ 4.0+</p>
                                <p className="text-sm opacity-80">Rating Minimum</p>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

        </>
    )
}
