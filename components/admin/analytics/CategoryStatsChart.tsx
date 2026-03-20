'use client'

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'

interface CategoryStat {
    name: string
    products: { viewCount: number; shopeeClicks: number; tokopediaClicks: number }[]
}

export function CategoryStatsChart({ categories }: { categories: CategoryStat[] }) {
    const categoryData = categories
        .map((cat) => ({
            name: cat.name,
            views: cat.products.reduce((sum, p) => sum + p.viewCount, 0),
            klikShopee: cat.products.reduce((sum, p) => sum + p.shopeeClicks, 0),
            klikTokopedia: cat.products.reduce((sum, p) => sum + p.tokopediaClicks, 0),
        }))
        .sort((a, b) => b.views - a.views)

    return (
        <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-brand-border">
            <h3 className="font-bold text-lg mb-6">Performa per Kategori</h3>

            <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#FFD6E7" />
                        <XAxis type="number" tick={{ fill: '#6B6B8A', fontSize: 12 }} />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={100}
                            tick={{ fill: '#6B6B8A', fontSize: 11 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #FFD6E7',
                                borderRadius: '12px',
                            }}
                        />
                        <Bar dataKey="views" name="Views" fill="#FF6B9D" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="klikShopee" name="Klik Shopee" fill="#EE4D2D" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="klikTokopedia" name="Klik Tokopedia" fill="#42B549" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
