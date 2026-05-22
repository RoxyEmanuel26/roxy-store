'use client'

import { useState, useMemo } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { Search, X, BarChart3, ListFilter } from 'lucide-react'

interface CategoryStat {
    name: string
    products: { viewCount: number; shopeeClicks: number }[]
}

// Custom Premium Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-brand-border/60 text-xs text-brand-text dark:text-dark-text">
                <p className="font-bold text-gray-800 dark:text-white mb-2 max-w-[200px] break-words">
                    📁 {label}
                </p>
                <div className="space-y-1.5 font-medium">
                    <div className="flex items-center justify-between gap-6">
                        <span className="flex items-center gap-1.5 text-gray-500 dark:text-dark-muted">
                            <span className="w-2.5 h-2.5 rounded bg-brand-primary"></span>
                            Views:
                        </span>
                        <span className="font-bold text-brand-primary">
                            {payload[0].value.toLocaleString('id-ID')}
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                        <span className="flex items-center gap-1.5 text-gray-500 dark:text-dark-muted">
                            <span className="w-2.5 h-2.5 rounded bg-[#EE4D2D]"></span>
                            Klik Shopee:
                        </span>
                        <span className="font-bold text-[#EE4D2D]">
                            {payload[1].value.toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>
            </div>
        )
    }
    return null
}

export function CategoryStatsChart({ categories }: { categories: CategoryStat[] }) {
    const [viewMode, setViewMode] = useState<'top10' | 'top20' | 'all'>('top10')
    const [searchQuery, setSearchQuery] = useState('')

    // 1. Process Raw Categories to Sorted Array
    const allCategoryData = useMemo(() => {
        return categories
            .map((cat) => ({
                name: cat.name,
                views: cat.products.reduce((sum, p) => sum + p.viewCount, 0),
                klikShopee: cat.products.reduce((sum, p) => sum + p.shopeeClicks, 0),
            }))
            .sort((a, b) => b.views - a.views)
    }, [categories])

    // 2. Filter & Consolidate Data Based on Mode and Search Query
    const displayData = useMemo(() => {
        // If there's an active search query, bypass consolidation and search directly
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            return allCategoryData.filter(c => c.name.toLowerCase().includes(q))
        }

        // Consolidation Logic
        if (viewMode === 'top10' && allCategoryData.length > 10) {
            const top = allCategoryData.slice(0, 9)
            const remaining = allCategoryData.slice(9)
            const otherViews = remaining.reduce((sum, c) => sum + c.views, 0)
            const otherClicks = remaining.reduce((sum, c) => sum + c.klikShopee, 0)
            
            return [
                ...top,
                { name: 'Kategori Lainnya', views: otherViews, klikShopee: otherClicks }
            ]
        }

        if (viewMode === 'top20' && allCategoryData.length > 20) {
            const top = allCategoryData.slice(0, 19)
            const remaining = allCategoryData.slice(19)
            const otherViews = remaining.reduce((sum, c) => sum + c.views, 0)
            const otherClicks = remaining.reduce((sum, c) => sum + c.klikShopee, 0)
            
            return [
                ...top,
                { name: 'Kategori Lainnya', views: otherViews, klikShopee: otherClicks }
            ]
        }

        return allCategoryData
    }, [allCategoryData, viewMode, searchQuery])

    // 3. Dynamic Height Calculation to prevent overlapping labels
    const dynamicHeight = useMemo(() => {
        const itemHeight = 48 // px per category bar row
        return Math.max(300, displayData.length * itemHeight)
    }, [displayData])

    // 4. Tick label Formatter (Truncates long names for clean visual bounds)
    const formatYAxisTick = (tick: string) => {
        if (tick.length > 14) {
            return `${tick.substring(0, 12)}...`
        }
        return tick
    }

    return (
        <div className="bg-white/70 dark:bg-dark-surface/70 backdrop-blur-md rounded-2xl p-6 shadow-md border border-brand-border/60 transition-all duration-300 flex flex-col h-full">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="font-bold text-lg text-brand-text dark:text-dark-text flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-brand-primary" />
                        Performa per Kategori
                    </h3>
                    <p className="text-xs text-brand-muted dark:text-dark-muted mt-0.5">
                        Tinjauan performa produk berdasarkan kelompok kategori
                    </p>
                </div>

                {/* Search & Filter Controls */}
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative w-full sm:w-48">
                        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-brand-muted dark:text-dark-muted" />
                        <input
                            type="text"
                            placeholder="Cari kategori..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg border border-brand-border/60 bg-white/50 dark:bg-dark-bg/40 focus:outline-none focus:ring-1 focus:ring-brand-primary/50 focus:border-brand-primary dark:text-dark-text"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-2 text-brand-muted hover:text-brand-text"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* View Limit Selector */}
                    {!searchQuery && (
                        <div className="flex bg-brand-surface dark:bg-dark-bg p-0.5 rounded-lg border border-brand-border/40 text-[10px] font-semibold">
                            {[
                                { id: 'top10', label: 'Top 10' },
                                { id: 'top20', label: 'Top 20' },
                                { id: 'all', label: 'Semua' }
                            ].map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => setViewMode(option.id as any)}
                                    className={`px-2.5 py-1.5 rounded-md transition-all duration-150 ${
                                        viewMode === option.id 
                                            ? 'bg-white dark:bg-dark-surface text-brand-primary shadow-sm' 
                                            : 'text-brand-muted dark:text-dark-muted hover:text-brand-text'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chart Area */}
            {displayData.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-sm text-brand-muted dark:text-dark-muted">
                        Tidak ada data kategori yang cocok.
                    </p>
                </div>
            ) : (
                <div className="flex-1 w-full overflow-y-auto max-h-[440px] pr-2 custom-scrollbar border border-brand-border/20 rounded-xl bg-white/30 dark:bg-dark-bg/20 p-2.5">
                    <div style={{ height: `${dynamicHeight}px` }} className="relative w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={displayData} layout="vertical" margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                                {/* Premium Linear Gradients */}
                                <defs>
                                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#FF8E8F" />
                                        <stop offset="100%" stopColor="#FF6B9D" />
                                    </linearGradient>
                                    <linearGradient id="shopeeGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#FF7A5A" />
                                        <stop offset="100%" stopColor="#EE4D2D" />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid strokeDasharray="3 3" stroke="#FFD6E7" opacity={0.15} />
                                
                                <XAxis 
                                    type="number" 
                                    tick={{ fill: '#6B6B8A', fontSize: 10, fontWeight: 500 }}
                                    axisLine={{ stroke: '#FFD6E7', opacity: 0.2 }}
                                    tickLine={false}
                                />
                                
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={105}
                                    tickFormatter={formatYAxisTick}
                                    tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 600 }}
                                    axisLine={{ stroke: '#FFD6E7', opacity: 0.2 }}
                                    tickLine={false}
                                />
                                
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: 'rgba(255, 107, 157, 0.05)', radius: 6 }}
                                />
                                
                                <Bar 
                                    dataKey="views" 
                                    name="Views" 
                                    fill="url(#viewsGradient)" 
                                    radius={[0, 6, 6, 0]} 
                                    barSize={12}
                                />
                                
                                <Bar 
                                    dataKey="klikShopee" 
                                    name="Klik Shopee" 
                                    fill="url(#shopeeGradient)" 
                                    radius={[0, 6, 6, 0]} 
                                    barSize={12}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Informational Footer */}
            <div className="mt-4 pt-3 border-t border-brand-border/40 text-[10px] text-brand-muted dark:text-dark-muted flex justify-between items-center">
                <span>Total Kategori Terbaca: {allCategoryData.length}</span>
                {allCategoryData.length > displayData.length && !searchQuery && (
                    <span className="font-semibold text-brand-primary">
                        * Kategori lainnya digabungkan ke &quot;Lainnya&quot;
                    </span>
                )}
            </div>
        </div>
    )
}
