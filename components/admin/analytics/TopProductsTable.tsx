import Image from 'next/image'
import Link from 'next/link'
import { Eye } from 'lucide-react'

interface TopProduct {
    id: string
    title: string
    image: string
    viewCount: number
    shopeeClicks: number
    tokopediaClicks: number
    category: { name: string }
}

export function TopProductsTable({ products }: { products: TopProduct[] }) {
    const getRankBadge = (index: number) => {
        switch (index) {
            case 0:
                return <span className="text-xl">🥇</span>
            case 1:
                return <span className="text-xl">🥈</span>
            case 2:
                return <span className="text-xl">🥉</span>
            default:
                return <span className="text-brand-muted font-bold px-2">#{index + 1}</span>
        }
    }

    return (
        <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-brand-border">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Top 10 Produk Populer</h3>
                <Link
                    href="/admin/products"
                    className="text-sm text-brand-primary hover:text-brand-accent font-medium hover:underline"
                >
                    Lihat semua produk
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-brand-muted uppercase bg-brand-surface dark:bg-dark-bg">
                        <tr>
                            <th className="px-4 py-3 rounded-l-lg">Rank</th>
                            <th className="px-4 py-3">Produk</th>
                            <th className="px-4 py-3">Views</th>
                            <th className="px-4 py-3">Shopee</th>
                            <th className="px-4 py-3">Tokpedia</th>
                            <th className="px-4 py-3 rounded-r-lg">Total Klik</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p, i) => (
                            <tr key={p.id} className="border-b border-brand-border last:border-0 hover:bg-brand-surface/30">
                                <td className="px-4 py-3 text-center">{getRankBadge(i)}</td>
                                <td className="px-4 py-3 font-medium flex items-center gap-3">
                                    <div className="w-10 h-10 rounded overflow-hidden relative border border-brand-border flex-shrink-0">
                                        <Image
                                            src={p.image || '/placeholder.png'}
                                            alt={p.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-brand-text dark:text-dark-text whitespace-nowrap">{p.title}</h4>
                                        <p className="text-xs text-brand-muted">{p.category?.name}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1 text-brand-muted">
                                        <Eye className="w-4 h-4" />
                                        <span>{p.viewCount}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 font-semibold text-[#EE4D2D]">{p.shopeeClicks}</td>
                                <td className="px-4 py-3 font-semibold text-[#42B549]">{p.tokopediaClicks}</td>
                                <td className="px-4 py-3 font-bold">
                                    {p.shopeeClicks + p.tokopediaClicks}
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-6 text-brand-muted">
                                    Belum ada data produk
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
