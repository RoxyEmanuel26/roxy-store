'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Search, Heart, Menu, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DarkModeToggle } from '@/components/public/DarkModeToggle'
import dynamic from 'next/dynamic'
const SearchOverlay = dynamic(() => import('@/components/public/SearchOverlay').then(mod => mod.SearchOverlay), { ssr: false })
import { useWishlist } from '@/hooks/useWishlist'
import type { SiteSettingsType } from '@/types'

const navLinks = [
    { label: 'Beranda', href: '/' },
    { label: 'Produk', href: '/products' },
    { label: 'Tentang Kami', href: '/about' },
    { label: 'Kontak', href: '/contact' },
]

interface HeaderProps {
    settings: SiteSettingsType
}

export function Header({ settings }: HeaderProps) {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const { wishlistCount, mounted } = useWishlist()

    // Close mobile drawer on route change
    useEffect(() => { setMobileOpen(false) }, [pathname])

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-dark-surface/90 backdrop-blur-md border-b border-brand-border dark:border-dark-border shadow-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    {/* LEFT: Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        {settings.logo_url ? (
                            <Image src={settings.logo_url} alt="Roxy Lay" width={120} height={40} className="h-8 w-auto" />
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5 text-brand-primary" />
                                <span className="text-xl font-bold text-brand-primary">Roxy Lay</span>
                            </>
                        )}
                    </Link>

                    {/* CENTER: Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`text-sm font-medium pb-1 ${isActive
                                        ? 'text-brand-primary font-semibold border-b-2 border-brand-primary'
                                        : 'text-brand-text dark:text-dark-text hover:text-brand-primary'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* RIGHT: Icons */}
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} aria-label="Cari" className="transition-none">
                            <Search className="h-5 w-5" />
                        </Button>

                        <Link href="/wishlist">
                            <Button variant="ghost" size="icon" className="relative transition-none" aria-label="Wishlist">
                                <Heart className="h-5 w-5" />
                                {mounted && wishlistCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                                        {wishlistCount}
                                    </span>
                                )}
                            </Button>
                        </Link>

                        <DarkModeToggle />

                        {/* Mobile hamburger */}
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden transition-none" aria-label="Menu">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-72 bg-white dark:bg-dark-surface p-6">
                                <div className="flex items-center gap-2 mb-8">
                                    <Sparkles className="h-5 w-5 text-brand-primary" />
                                    <span className="text-xl font-bold text-brand-primary">Roxy Lay</span>
                                </div>
                                <nav className="flex flex-col gap-2">
                                    {navLinks.map((link) => {
                                        const isActive = pathname === link.href
                                        return (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                className={`px-4 py-3 rounded-lg text-sm font-medium ${isActive
                                                    ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                                                    : 'text-brand-text dark:text-dark-text hover:bg-brand-surface dark:hover:bg-dark-bg'
                                                    }`}
                                            >
                                                {link.label}
                                            </Link>
                                        )
                                    })}
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>

            {/* Search Overlay */}
            <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
    )
}
