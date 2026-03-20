'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DarkModeToggle } from '@/components/public/DarkModeToggle'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { getInitials } from '@/lib/utils'

interface AdminHeaderProps {
    userName?: string
    userEmail?: string
}

const breadcrumbMap: Record<string, string> = {
    '/admin/dashboard': 'Dashboard',
    '/admin/products': 'Produk / Semua Produk',
    '/admin/products/new': 'Produk / Tambah Produk',
    '/admin/categories': 'Kategori',
    '/admin/settings': 'Pengaturan',
    '/admin/analytics': 'Analitik',
}

export default function AdminHeader({
    userName = 'Admin',
    userEmail = 'admin@roxystore.com',
}: AdminHeaderProps) {
    const pathname = usePathname()
    const [sheetOpen, setSheetOpen] = useState(false)

    // Determine breadcrumb text
    let breadcrumb = breadcrumbMap[pathname] || 'Admin'
    if (pathname.match(/\/admin\/products\/[^/]+\/edit/)) {
        breadcrumb = 'Produk / Edit Produk'
    }

    const handleLogout = async () => {
        await signOut({ redirectTo: '/admin/login' })
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface px-4 md:px-6 shadow-sm">
            {/* LEFT: Hamburger (mobile) + Breadcrumb */}
            <div className="flex items-center gap-3">
                {/* Mobile hamburger */}
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[260px] p-0">
                        <AdminSidebar
                            userName={userName}
                            onClose={() => setSheetOpen(false)}
                        />
                    </SheetContent>
                </Sheet>

                {/* Breadcrumb */}
                <h2 className="text-lg font-semibold text-brand-text dark:text-dark-text">
                    {breadcrumb}
                </h2>
            </div>

            {/* RIGHT: Dark mode + Avatar + Dropdown */}
            <div className="flex items-center gap-2">
                <DarkModeToggle />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-brand-primary text-white text-sm font-medium">
                                    {getInitials(userName)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <div className="px-3 py-2">
                            <p className="text-sm font-medium">{userName}</p>
                            <p className="text-xs text-brand-muted dark:text-dark-muted">
                                {userEmail}
                            </p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Keluar</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
