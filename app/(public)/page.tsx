import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { getSiteSettings } from '@/lib/site-settings'
import ProductCard from '@/components/public/ProductCard'
import CategoryCard from '@/components/public/CategoryCard'
import { RecentlyViewed } from '@/components/public/RecentlyViewed'
import { FadeIn } from '@/components/animations/FadeIn'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer'
import HeroCTA from './HeroCTA'

import { generatePageMetadata } from '@/lib/metadata'
import { getOrganizationSchema, getWebsiteSchema } from '@/lib/structured-data'
import { JsonLd } from '@/components/public/JsonLd'

import {
    getCachedCategories,
    getCachedFeaturedProducts,
    getCachedNewProducts,
    getCachedProductCount
} from '@/lib/cached-queries'

export const revalidate = 60

export const metadata = generatePageMetadata({
    title: 'Beranda',
    description: 'Selamat datang di Roxy Store! Temukan koleksi aksesori wanita colorful: gantungan kunci lucu, beads bracelet, beads HP, kalung, dan anting. Tersedia di Shopee dan Tokopedia.',
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

            {/* === SECTION 1: HERO === */}
            <section className="relative min-h-[500px] md:min-h-[600px] flex items-center overflow-hidden bg-gradient-to-br from-brand-surface via-white to-brand-secondary/20 dark:from-dark-surface dark:via-dark-bg dark:to-dark-surface">
                <div className="absolute top-10 left-10 w-72 h-72 bg-brand-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-1/3 w-96 h-96 bg-brand-secondary/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 right-10 w-48 h-48 bg-brand-accent/10 rounded-full blur-2xl" />

                <div className="container mx-auto px-4 py-20 relative z-10">
                    <div className="max-w-2xl">
                        <FadeIn delay={0}>
                            <span className="inline-flex items-center gap-2 bg-brand-primary/10 text-brand-primary text-sm font-medium px-4 py-2 rounded-full mb-6">
                                ✨ Toko Aksesori Wanita
                            </span>
                        </FadeIn>

                        <FadeIn delay={0.1}>
                            <h1 className="text-4xl md:text-6xl font-bold text-brand-text dark:text-dark-text leading-tight mb-4">
                                {settings.hero_title || 'Koleksi Aksesori Wanita Terbaik'}
                            </h1>
                        </FadeIn>

                        <FadeIn delay={0.2}>
                            <p className="text-lg text-brand-muted dark:text-dark-muted mb-8 leading-relaxed">
                                {settings.hero_subtitle || 'Temukan aksesori favoritmu dengan kualitas premium'}
                            </p>
                        </FadeIn>

                        <FadeIn delay={0.3}>
                            <HeroCTA waNumber={settings.wa_number} />
                        </FadeIn>
                    </div>
                </div>

                {settings.hero_image && (
                    <div
                        className="absolute right-0 top-0 w-1/2 h-full hidden md:block"
                        style={{
                            WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)',
                            maskImage: 'linear-gradient(to right, transparent, black 30%)'
                        }}
                    >
                        <Image src={settings.hero_image} alt="Hero" fill className="object-cover opacity-80" />
                    </div>
                )}
            </section>

            {/* === SECTION 2: STATS === */}
            <section className="py-8 bg-brand-primary dark:bg-dark-surface">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-3 gap-4 text-center text-white dark:text-dark-text">
                        <FadeIn delay={0}>
                            <div>
                                <p className="text-2xl font-bold">{totalProducts}+</p>
                                <p className="text-sm opacity-80">Produk Tersedia</p>
                            </div>
                        </FadeIn>
                        <FadeIn delay={0.1}>
                            <div>
                                <p className="text-2xl font-bold">{categories.length}+</p>
                                <p className="text-sm opacity-80">Kategori</p>
                            </div>
                        </FadeIn>
                        <FadeIn delay={0.2}>
                            <div>
                                <p className="text-2xl font-bold">100%</p>
                                <p className="text-sm opacity-80">Handmade</p>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* === SECTION 3: CATEGORIES === */}
            {categories.length > 0 && (
                <section className="py-16 bg-white dark:bg-dark-bg">
                    <div className="container mx-auto px-4">
                        <FadeIn>
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold text-brand-text dark:text-dark-text">
                                    Belanja Berdasarkan Kategori
                                </h2>
                                <p className="text-brand-muted dark:text-dark-muted mt-2">Temukan aksesori favoritmu</p>
                            </div>
                        </FadeIn>
                        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {categories.map((category: any) => (
                                <StaggerItem key={category.id}>
                                    <CategoryCard category={category} />
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    </div>
                </section>
            )}

            {/* === SECTION 4: FEATURED PRODUCTS === */}
            <section className="py-16 bg-brand-surface dark:bg-dark-surface">
                <div className="container mx-auto px-4">
                    <FadeIn>
                        <div className="flex justify-between items-end mb-10">
                            <div>
                                <h2 className="text-3xl font-bold text-brand-text dark:text-dark-text">Produk Pilihan</h2>
                                <p className="text-brand-muted dark:text-dark-muted mt-1">Produk terpopuler dari koleksi kami</p>
                            </div>
                            <Link href="/products">
                                <Button variant="outline" className="border-brand-primary text-brand-primary hidden sm:flex transition-none">
                                    Lihat Semua <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </FadeIn>
                    {featuredProducts.length > 0 ? (
                        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {featuredProducts.map((product: any, index: number) => (
                                <StaggerItem key={product.id}>
                                    <ProductCard product={product} priority={index < 4} />
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    ) : (
                        <p className="text-center text-brand-muted py-8">Belum ada produk unggulan</p>
                    )}
                    <div className="text-center mt-6 sm:hidden">
                        <Link href="/products">
                            <Button variant="outline" className="border-brand-primary text-brand-primary transition-none">
                                Lihat Semua Produk <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* === SECTION 5: NEW PRODUCTS === */}
            <section className="py-16 bg-white dark:bg-dark-bg">
                <div className="container mx-auto px-4">
                    <FadeIn>
                        <div className="flex justify-between items-end mb-10">
                            <div>
                                <h2 className="text-3xl font-bold text-brand-text dark:text-dark-text">Baru Masuk 🆕</h2>
                                <p className="text-brand-muted dark:text-dark-muted mt-1">Koleksi terbaru yang baru saja hadir</p>
                            </div>
                            <Link href="/products?sort=newest">
                                <Button variant="outline" className="border-brand-primary text-brand-primary hidden sm:flex transition-none">
                                    Lihat Semua <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </FadeIn>
                    {newProducts.length > 0 ? (
                        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {newProducts.map((product: any) => (
                                <StaggerItem key={product.id}>
                                    <ProductCard product={product} />
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    ) : (
                        <p className="text-center text-brand-muted py-8">Belum ada produk terbaru</p>
                    )}
                </div>
            </section>

            {/* === SECTION 6: RECENTLY VIEWED === */}
            <RecentlyViewed />

            {/* === SECTION 7: WHY Roxy STORE === */}
            <section className="py-16 bg-brand-primary/5 dark:bg-dark-surface">
                <div className="container mx-auto px-4 text-center">
                    <FadeIn>
                        <h2 className="text-3xl font-bold text-brand-text dark:text-dark-text mb-4">Kenapa Pilih Roxy Store?</h2>
                    </FadeIn>
                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                        {[
                            { icon: '✨', title: 'Produk Terpercaya', desc: 'Setiap produk diolah oleh perusahaan terpercaya' },
                            { icon: '💝', title: 'Kualitas Premium', desc: 'Material terbaik dipilih untuk kenyamanan dan ketahanan maksimal' },
                            { icon: '🚀', title: 'Pengiriman Cepat', desc: 'Tersedia di Shopee dan Tokopedia untuk kemudahan berbelanja' },
                        ].map((item) => (
                            <StaggerItem key={item.title}>
                                <div className="flex flex-col items-center p-6 bg-white dark:bg-dark-bg rounded-2xl shadow-sm">
                                    <span className="text-5xl mb-4">{item.icon}</span>
                                    <h3 className="font-bold text-lg mb-2 text-brand-text dark:text-dark-text">{item.title}</h3>
                                    <p className="text-brand-muted dark:text-dark-muted text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* === SECTION 8: CTA BANNER === */}
            <section className="py-16 bg-brand-primary dark:bg-dark-primary">
                <div className="container mx-auto px-4 text-center text-white">
                    <FadeIn>
                        <h2 className="text-3xl font-bold mb-4">Tertarik dengan Produk Kami?</h2>
                        <p className="opacity-90 mb-8 text-lg">
                            Kunjungi toko kami di Shopee dan Tokopedia untuk pembelian yang mudah dan aman
                        </p>
                        <a href={`https://wa.me/${settings.wa_number}?text=${encodeURIComponent('Halo Roxy Store!')}`} target="_blank" rel="noopener noreferrer">
                            <Button size="lg" className="bg-white text-brand-primary hover:bg-brand-surface font-semibold transition-none">
                                💬 Chat via WhatsApp
                            </Button>
                        </a>
                    </FadeIn>
                </div>
            </section>
        </>
    )
}
