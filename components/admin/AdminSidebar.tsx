'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
    LayoutDashboard,
    Package,
    Tag,
    Settings,
    BarChart3,
    LogOut,
    ChevronDown,
    Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface MenuItem {
    href: string
    label: string
    icon: React.ElementType
    subItems?: { href: string; label: string }[]
}

const menuItems: MenuItem[] = [
    {
        href: '/admin/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
    },
    {
        href: '/admin/products',
        label: 'Produk',
        icon: Package,
        subItems: [
            { href: '/admin/products', label: 'Semua Produk' },
            { href: '/admin/products/new', label: 'Tambah Produk' },
        ],
    },
    {
        href: '/admin/categories',
        label: 'Kategori',
        icon: Tag,
    },
    {
        href: '/admin/settings',
        label: 'Pengaturan',
        icon: Settings,
    },
    {
        href: '/admin/analytics',
        label: 'Analitik',
        icon: BarChart3,
    },
]

interface AdminSidebarProps {
    userName?: string
    onClose?: () => void
}

export default function AdminSidebar({ userName = 'Admin', onClose }: AdminSidebarProps) {
    const pathname = usePathname()
    const [openMenu, setOpenMenu] = useState<string | null>(null)

    const isActive = (href: string) => {
        if (href === '/admin/products') {
            return pathname === '/admin/products'
        }
        return pathname.startsWith(href)
    }

    const isGroupActive = (item: MenuItem) => {
        if (item.subItems) {
            return item.subItems.some((sub) => pathname === sub.href || pathname.startsWith(sub.href + '/'))
        }
        return isActive(item.href)
    }

    const handleLogout = async () => {
        await signOut({ redirectTo: '/admin/login' })
    }

    return (
        <div className="flex h-full w-[260px] flex-col bg-gradient-to-b from-brand-primary to-brand-secondary dark:from-dark-surface dark:to-dark-bg">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white">Roxy Store</h1>
                    <p className="text-xs text-white/60">Admin Panel</p>
                </div>
            </div>

            {/* Menu Navigasi */}
            <ScrollArea className="flex-1 px-3 py-4">
                <nav className="space-y-1">
                    {menuItems.map((item) => (
                        <div key={item.href}>
                            {item.subItems ? (
                                <>
                                    <button
                                        onClick={() =>
                                            setOpenMenu(openMenu === item.href ? null : item.href)
                                        }
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/80 transition-all hover:bg-white/10',
                                            isGroupActive(item) && 'bg-white/20 text-white border-l-[3px] border-white'
                                        )}
                                    >
                                        <item.icon className="h-5 w-5 shrink-0" />
                                        <span className="flex-1 text-left">{item.label}</span>
                                        <ChevronDown
                                            className={cn(
                                                'h-4 w-4 transition-transform',
                                                (openMenu === item.href || isGroupActive(item)) &&
                                                'rotate-180'
                                            )}
                                        />
                                    </button>
                                    {(openMenu === item.href || isGroupActive(item)) && (
                                        <div className="ml-8 mt-1 space-y-1">
                                            {item.subItems.map((sub) => (
                                                <Link
                                                    key={sub.href}
                                                    href={sub.href}
                                                    onClick={onClose}
                                                    className={cn(
                                                        'block rounded-md px-3 py-2 text-sm text-white/60 transition-all hover:bg-white/10 hover:text-white',
                                                        pathname === sub.href &&
                                                        'bg-white/15 text-white font-medium'
                                                    )}
                                                >
                                                    {sub.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Link
                                    href={item.href}
                                    onClick={onClose}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/80 transition-all hover:bg-white/10',
                                        isGroupActive(item) && 'bg-white/20 text-white border-l-[3px] border-white'
                                    )}
                                >
                                    <item.icon className="h-5 w-5 shrink-0" />
                                    <span>{item.label}</span>
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>
            </ScrollArea>

            {/* Footer Sidebar */}
            <div className="border-t border-white/10 px-4 py-4 bg-black/10">
                <div className="mb-2 px-2">
                    <p className="text-sm font-medium text-white truncate">{userName}</p>
                    <p className="text-xs text-white/50">Administrator</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-white/70 transition-all hover:bg-white/10 hover:text-white"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Keluar</span>
                </button>
            </div>
        </div>
    )
}
