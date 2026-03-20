import { prisma } from '@/lib/prisma'
import { Package, Tag, ShoppingBag, Store, Eye, MessageCircle } from 'lucide-react'
import StatsCard from '@/components/admin/StatsCard'
import { ActivityFeed } from '@/components/admin/analytics/ActivityFeed'
import { formatRupiah } from '@/lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

export default async function AdminDashboardPage() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
        totalProducts,
        totalCategories,
        topProducts,
        todayEvents,
        latestProducts,
    ] = await Promise.all([
        prisma.product.count({ where: { isActive: true } }),
        prisma.category.count(),
        prisma.product.findMany({
            where: { isActive: true },
            orderBy: { viewCount: 'desc' },
            take: 5,
            include: { category: true },
        }),
        prisma.analytics.groupBy({
            by: ['eventType'],
            where: { createdAt: { gte: today } },
            _count: true,
        }),
        prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { category: true },
        }),
    ])

    // Format today events
    const todayStats: Record<string, number> = {
        view: 0,
        shopee_click: 0,
        tokopedia_click: 0,
        wa_click: 0,
    }
    for (const event of todayEvents) {
        todayStats[event.eventType] = event._count
    }

    const todayFormatted = format(new Date(), 'EEEE, d MMMM yyyy', { locale: id })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-brand-text dark:text-dark-text">
                    Dashboard
                </h1>
                <p className="text-sm text-brand-muted dark:text-dark-muted mt-1">
                    {todayFormatted}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Produk Aktif"
                    value={totalProducts}
                    icon={Package}
                    color="pink"
                    description="Produk yang tampil di website"
                />
                <StatsCard
                    title="Total Kategori"
                    value={totalCategories}
                    icon={Tag}
                    color="purple"
                    description="Kategori produk aktif"
                />
                <StatsCard
                    title="Klik Shopee Hari Ini"
                    value={todayStats.shopee_click}
                    icon={ShoppingBag}
                    color="orange"
                />
                <StatsCard
                    title="Klik Tokopedia Hari Ini"
                    value={todayStats.tokopedia_click}
                    icon={Store}
                    color="green"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Produk Terpopuler */}
                    <div className="rounded-xl border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-brand-text dark:text-dark-text">
                                Produk Terpopuler
                            </h2>
                        </div>
                        {topProducts.length === 0 ? (
                            <p className="text-sm text-brand-muted dark:text-dark-muted py-8 text-center">
                                Belum ada data produk.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {topProducts.map((product, i) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center gap-4 rounded-lg p-3 hover:bg-brand-surface/50 dark:hover:bg-dark-surface/50 transition-colors"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary font-bold text-sm shrink-0">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-brand-text dark:text-dark-text truncate">
                                                {product.title}
                                            </p>
                                            <p className="text-xs text-brand-muted dark:text-dark-muted">
                                                {product.category.name}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-brand-muted dark:text-dark-muted">
                                            <Eye className="h-3.5 w-3.5" />
                                            {product.viewCount}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Aktivitas Hari Ini */}
                    <div className="rounded-xl border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface p-6">
                        <h2 className="text-lg font-semibold text-brand-text dark:text-dark-text mb-4">
                            Aktivitas Hari Ini
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {todayStats.view}
                                </p>
                                <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1 flex items-center gap-1">
                                    <Eye className="h-3.5 w-3.5" /> Total Views
                                </p>
                            </div>
                            <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-4">
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                    {todayStats.shopee_click}
                                </p>
                                <p className="text-sm text-orange-600/70 dark:text-orange-400/70 mt-1 flex items-center gap-1">
                                    <ShoppingBag className="h-3.5 w-3.5" /> Klik Shopee
                                </p>
                            </div>
                            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {todayStats.tokopedia_click}
                                </p>
                                <p className="text-sm text-green-600/70 dark:text-green-400/70 mt-1 flex items-center gap-1">
                                    <Store className="h-3.5 w-3.5" /> Klik Tokopedia
                                </p>
                            </div>
                            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4">
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {todayStats.wa_click}
                                </p>
                                <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70 mt-1 flex items-center gap-1">
                                    <MessageCircle className="h-3.5 w-3.5" /> Klik WhatsApp
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Activity Feed */}
                <div className="lg:col-span-1">
                    <ActivityFeed />
                </div>
            </div>

            {/* Produk Terbaru Ditambahkan */}
            <div className="rounded-xl border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-brand-text dark:text-dark-text">
                        Produk Terbaru Ditambahkan
                    </h2>
                </div>
                {latestProducts.length === 0 ? (
                    <p className="text-sm text-brand-muted dark:text-dark-muted py-8 text-center">
                        Belum ada produk. Tambahkan produk pertama Anda.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-brand-border dark:border-dark-border text-left">
                                    <th className="pb-3 font-medium text-brand-muted dark:text-dark-muted">Produk</th>
                                    <th className="pb-3 font-medium text-brand-muted dark:text-dark-muted">Harga</th>
                                    <th className="pb-3 font-medium text-brand-muted dark:text-dark-muted">Status</th>
                                    <th className="pb-3 font-medium text-brand-muted dark:text-dark-muted">Tanggal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {latestProducts.map((product) => (
                                    <tr key={product.id} className="border-b border-brand-border/50 dark:border-dark-border/50 last:border-0">
                                        <td className="py-3">
                                            <span className="font-medium text-brand-text dark:text-dark-text">
                                                {product.title}
                                            </span>
                                        </td>
                                        <td className="py-3 text-brand-text dark:text-dark-text">
                                            {formatRupiah(product.price)}
                                        </td>
                                        <td className="py-3">
                                            <Badge
                                                variant={product.isActive ? 'default' : 'secondary'}
                                                className={
                                                    product.isActive
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100'
                                                }
                                            >
                                                {product.isActive ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="py-3 text-brand-muted dark:text-dark-muted">
                                            {format(new Date(product.createdAt), 'd MMM yyyy', { locale: id })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
