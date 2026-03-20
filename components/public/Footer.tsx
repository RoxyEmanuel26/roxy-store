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
    const waUrl = `https://wa.me/${settings.wa_number}?text=${encodeURIComponent('Halo Roxy Lay, saya ingin bertanya tentang produk 😊')}`

    return (
        <footer className="bg-brand-surface dark:bg-dark-surface border-t border-brand-border dark:border-dark-border mt-auto">
            {/* Main Footer */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Column 1: Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            {settings.logo_url ? (
                                <Image src={settings.logo_url} alt="Roxy Lay" width={120} height={40} className="h-8 w-auto" />
                            ) : (
                                <>
                                    <Sparkles className="h-5 w-5 text-brand-primary" />
                                    <span className="text-xl font-bold text-brand-primary">Roxy Lay</span>
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
                            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center hover:bg-green-500/20 transition-colors">
                                <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.638-1.467A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.592-5.929-1.622l-.42-.248-2.747.869.882-2.681-.276-.437A9.77 9.77 0 012.182 12 9.818 9.818 0 0112 2.182 9.818 9.818 0 0121.818 12 9.818 9.818 0 0112 21.818z" /></svg>
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Navigation */}
                    <div>
                        <h4 className="font-semibold text-brand-text dark:text-dark-text mb-4">Halaman</h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'Beranda', href: '/' },
                                { label: 'Semua Produk', href: '/products' },
                                { label: 'Tentang Kami', href: '/about' },
                                { label: 'Kontak & WA', href: '/contact' },
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
                        <h4 className="font-semibold text-brand-text dark:text-dark-text mb-4">Hubungi Kami</h4>
                        <p className="text-sm text-brand-muted dark:text-dark-muted mb-4">
                            Ada pertanyaan tentang produk?
                        </p>
                        <a href={waUrl} target="_blank" rel="noopener noreferrer">
                            <Button className="bg-[#25D366] hover:bg-[#1fba57] text-white w-full sm:w-auto">
                                💬 Chat via WhatsApp
                            </Button>
                        </a>
                        {settings.wa_number && (
                            <p className="text-xs text-brand-muted dark:text-dark-muted mt-3">
                                {formatWaNumber(settings.wa_number)}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-brand-border dark:border-dark-border py-4">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-brand-muted dark:text-dark-muted">
                    <p>© 2026 Roxy Lay. All rights reserved.</p>
                    <p>Transaksi dilakukan di Shopee & Tokopedia</p>
                </div>
            </div>
        </footer>
    )
}
