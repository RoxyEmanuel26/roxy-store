import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SiteSettingsType } from '@/types'

function formatWaNumber(wa: string): string {
    if (!wa || wa.length < 10) return wa
    const clean = wa.replace(/^62/, '+62 ')
    return clean.replace(/(\+62 )(\d{3})(\d{4})(\d+)/, '$1$2-$3-$4')
}

interface FooterProps {
    settings: SiteSettingsType
}

export function Footer({ settings }: FooterProps) {
    // Cast settings any if necessary to get telegram_channel_url and affiliate_disclaimer
    const s = settings as any
    const telegramUrl = s.telegram_channel_url || '#'

    return (

        <footer className="bg-brand-surface dark:bg-dark-surface border-t border-brand-border dark:border-dark-border mt-auto">
            {/* Main Footer */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Column 1: Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            {settings.logo_url ? (
                                <Image src={settings.logo_url} alt="Roxy Store" width={120} height={40} className="h-8 w-auto" />
                            ) : (
                                <>
                                    <Sparkles className="h-5 w-5 text-brand-primary" />
                                    <span className="text-xl font-bold text-brand-primary">Roxy Store</span>
                                </>
                            )}
                        </div>
                        {settings.tagline && (
                            <p className="text-sm text-brand-muted dark:text-dark-muted">{settings.tagline}</p>
                        )}
                        {settings.about_text && (
                            <p className="text-sm text-brand-muted dark:text-dark-muted leading-relaxed">
                                {settings.about_text.slice(0, 100)}{settings.about_text.length > 100 ? '...' : ''}
                            </p>
                        )}
                        {/* Social Icons */}
                        <div className="flex items-center gap-3 pt-2">
                            <a href={`https://instagram.com/`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center hover:bg-brand-primary/20 transition-colors">
                                <Instagram className="h-4 w-4 text-brand-primary" />
                            </a>
                            {telegramUrl !== '#' && (
                                <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors">
                                    <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Column 2: Navigation */}
                    <div>
                        <h4 className="font-semibold text-brand-text dark:text-dark-text mb-4">Halaman</h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'Beranda', href: '/' },
                                { label: 'Semua Produk', href: '/produk' },
                                { label: 'Tentang Kami', href: '/tentang' },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm text-brand-muted dark:text-dark-muted hover:text-brand-primary transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Contact */}
                    <div>
                        <h4 className="font-semibold text-brand-text dark:text-dark-text mb-4">Promo & Info</h4>
                        <p className="text-sm text-brand-muted dark:text-dark-muted mb-4">
                            Dapatkan update diskon dan flash sale setiap hari di channel Telegram kami!
                        </p>
                        <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                            <Button className="bg-[#0088cc] hover:bg-[#0077b3] text-white w-full sm:w-auto">
                                📣 Gabung Channel Telegram
                            </Button>
                        </a>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-brand-border dark:border-dark-border py-6 bg-brand-bg dark:bg-dark-bg">
                <div className="container mx-auto px-4">
                    {s.affiliate_disclaimer && (
                        <p className="text-xs text-brand-muted dark:text-dark-muted text-center mb-6 max-w-4xl mx-auto italic">
                            💡 {s.affiliate_disclaimer}
                        </p>
                    )}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-brand-muted dark:text-dark-muted">
                        <p>© 2026 Roxy Store. All rights reserved.</p>
                        <p>Website Rekomendasi Produk Terlaris Shopee</p>
                    </div>
                </div>
            </div>
        </footer>
    )
}
