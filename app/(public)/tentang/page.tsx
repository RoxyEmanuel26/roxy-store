import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getSiteSettings } from '@/lib/site-settings'

import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
    title: 'Tentang Kami',
    description: 'Kenali lebih dekat Roxy Store, tempat mencari barang berkualitas dan terpercaya.',
    path: '/about',
})

export default async function AboutPage() {
    const settings = await getSiteSettings()

    return (
        <>
            {/* Hero */}
            <section className="relative py-20 bg-gradient-to-br from-brand-primary/5 via-brand-surface to-brand-secondary/10 dark:from-dark-surface dark:via-dark-bg dark:to-dark-surface">
                <div className="container mx-auto px-4 text-center">
                    <span className="inline-flex items-center gap-2 bg-brand-primary/10 text-brand-primary text-sm font-medium px-4 py-2 rounded-full mb-4">
                        ✨ Tentang Kami
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-brand-text dark:text-dark-text">
                        Tentang Roxy Store
                    </h1>
                    <p className="text-brand-muted dark:text-dark-muted mt-4 max-w-2xl mx-auto text-lg">
                        {settings.tagline}
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="py-16 bg-white dark:bg-dark-bg">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="prose dark:prose-invert prose-brand max-w-none text-brand-text dark:text-dark-text leading-relaxed whitespace-pre-wrap">
                        {settings.about_text || 'Roxy Store adalah tempat mencari barang berkualitas dan terpercaya.'}
                    </div>
                </div>
            </section>

            {/* Why Us */}
            <section className="py-16 bg-brand-surface dark:bg-dark-surface">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-brand-text dark:text-dark-text mb-4">Nilai Kami</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                        {[
                            { icon: '✨', title: 'Produk Terpercaya', desc: 'Setiap produk diolah oleh perusahaan terpercaya' },
                            { icon: '💝', title: 'Kualitas Premium', desc: 'Material terbaik dipilih untuk kenyamanan dan ketahanan maksimal' },
                            { icon: '🚀', title: 'Pengiriman Cepat', desc: 'Tersedia di Shopee untuk kemudahan berbelanja' },
                        ].map((item) => (
                            <div key={item.title} className="flex flex-col items-center p-6 bg-white dark:bg-dark-bg rounded-2xl shadow-sm">
                                <span className="text-5xl mb-4">{item.icon}</span>
                                <h3 className="font-bold text-lg mb-2 text-brand-text dark:text-dark-text">{item.title}</h3>
                                <p className="text-brand-muted dark:text-dark-muted text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-white dark:bg-dark-bg">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold text-brand-text dark:text-dark-text mb-6">Mulai Belanja Sekarang</h2>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/produk">
                            <Button size="lg" className="bg-brand-primary hover:bg-brand-accent text-white px-8">
                                Lihat Koleksi Produk Kami
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </>
    )
}
