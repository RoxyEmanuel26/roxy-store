'use client'

import { Eye, ShoppingBag, MessageCircle, ArrowDown, Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'

interface FunnelProps {
    views: number
    shopeeClicks: number
    waClicks: number
}

export function ConversionFunnel({ views, shopeeClicks, waClicks }: FunnelProps) {
    const totalClicks = shopeeClicks + waClicks
    
    // Core conversion rates
    const viewToClick = views > 0 ? (totalClicks / views) * 100 : 0
    const viewToShopee = views > 0 ? (shopeeClicks / views) * 100 : 0
    const viewToWa = views > 0 ? (waClicks / views) * 100 : 0

    // Click shares
    const shopeeShare = totalClicks > 0 ? (shopeeClicks / totalClicks) * 100 : 0
    const waShare = totalClicks > 0 ? (waClicks / totalClicks) * 100 : 0

    // Drop-off rate (views that did not lead to any click)
    const dropOffRate = 100 - viewToClick

    // Get dynamic advice based on conversion rate
    const getInsight = (rate: number) => {
        if (views === 0) {
            return {
                title: 'Belum Ada Data Lalu Lintas',
                desc: 'Belum ada lalu lintas data yang terekam. Promosikan toko online Anda di media sosial atau forum untuk mendatangkan pengunjung pertama!',
                icon: AlertCircle,
                colorClass: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30'
            }
        }
        if (rate < 1.5) {
            return {
                title: 'Tingkat Konversi Membutuhkan Perhatian',
                desc: `Tingkat konversi Anda rendah (${rate.toFixed(1)}%). Pengunjung menelusuri katalog produk Anda tetapi sangat jarang melakukan tindakan pembelian. Coba tingkatkan kualitas gambar produk, tulis deskripsi yang memicu urgensi, atau tawarkan promo harga yang lebih kompetitif.`,
                icon: AlertCircle,
                colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
            }
        }
        if (rate >= 1.5 && rate < 5.0) {
            return {
                title: 'Performa Konversi Sehat',
                desc: `Tingkat konversi Anda stabil di angka ${rate.toFixed(1)}%, yang setara dengan rata-rata industri toko retail online (2% - 5%). Teruskan kinerja bagus ini dan coba pertimbangkan penambahan tag promo "Diskon" atau "Terlaris" pada produk andalan Anda.`,
                icon: CheckCircle2,
                colorClass: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
            }
        }
        return {
            title: 'Tingkat Konversi Luar Biasa!',
            desc: `Luar biasa! Konversi toko Anda sangat tinggi di angka ${rate.toFixed(1)}% (jauh di atas rata-rata industri). Ini berarti pengunjung memiliki minat beli yang masif terhadap produk Anda. Pastikan ketersediaan stok selalu terjaga agar tidak melewatkan kesempatan emas ini!`,
            icon: Sparkles,
            colorClass: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30'
        }
    }

    const insight = getInsight(viewToClick)
    const InsightIcon = insight.icon

    return (
        <div className="bg-white/70 dark:bg-dark-surface/70 backdrop-blur-md rounded-2xl p-6 shadow-md border border-brand-border/60 transition-all duration-300">
            {/* Title section */}
            <div className="mb-8">
                <h3 className="font-bold text-lg text-brand-text dark:text-dark-text flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-brand-primary" />
                    Funnel Konversi Keseluruhan
                </h3>
                <p className="text-xs text-brand-muted dark:text-dark-muted mt-0.5">
                    Visualisasi perjalanan pengunjung dari menelusuri katalog hingga tindakan checkout/kontak
                </p>
            </div>

            {/* Funnel Pipeline Visualizer */}
            <div className="max-w-2xl mx-auto flex flex-col items-center">
                
                {/* STAGE 1: Views (Product Catalog) */}
                <div className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md hover:scale-[1.005] duration-300">
                    {/* Background faint mesh pattern */}
                    <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-4 translate-x-4">
                        <Eye className="w-40 h-40" />
                    </div>
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                                Tahap 1
                            </span>
                            <h4 className="font-bold text-base mt-1 flex items-center gap-2">
                                <Eye className="w-4.5 h-4.5" />
                                Katalog Produk Dilihat
                            </h4>
                            <p className="text-xs text-pink-100 mt-0.5 font-medium">
                                Jumlah total halaman produk yang dikunjungi pelanggan
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <span className="font-mono font-black text-2xl tracking-tight block">
                                {views.toLocaleString('id-ID')}
                            </span>
                            <span className="text-xs text-pink-100 font-bold bg-white/10 px-2 py-0.5 rounded mt-0.5 inline-block">
                                100.0% Pengunjung
                            </span>
                        </div>
                    </div>
                </div>

                {/* DROP-OFF CONNECTOR 1 */}
                <div className="flex flex-col items-center my-3 relative py-1 w-full max-w-md">
                    <div className="h-8 w-0.5 bg-dashed border-l border-brand-border dark:border-dark-border flex items-center justify-center">
                        <ArrowDown className="w-4 h-4 text-brand-muted dark:text-dark-muted mt-8 absolute" />
                    </div>
                    
                    {/* Drop-off & Conversion Stats Pills */}
                    <div className="flex gap-2 z-10 my-1 text-[10px] font-bold select-none">
                        <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30 px-2.5 py-1 rounded-full shadow-sm">
                            ⚡ Konversi: {viewToClick.toFixed(1)}%
                        </span>
                        {views > 0 && (
                            <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30 px-2.5 py-1 rounded-full shadow-sm">
                                🔻 Drop-off: {dropOffRate.toFixed(1)}%
                            </span>
                        )}
                    </div>
                </div>

                {/* STAGE 2: Clicks (Interested Interactivity) */}
                <div 
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md hover:scale-[1.005] duration-300"
                    style={{ width: views > 0 ? `max(${Math.min(100, Math.max(40, viewToClick * 5.5))}%, 70%)` : '100%' }}
                >
                    <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-4 translate-x-4">
                        <Sparkles className="w-40 h-40" />
                    </div>
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                                Tahap 2
                            </span>
                            <h4 className="font-bold text-base mt-1 flex items-center gap-2">
                                <Sparkles className="w-4.5 h-4.5" />
                                Tindakan & Minat Beli
                            </h4>
                            <p className="text-xs text-violet-100 mt-0.5 font-medium">
                                Pengunjung yang berinteraksi menekan tombol checkout/tanya
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <span className="font-mono font-black text-2xl tracking-tight block">
                                {totalClicks.toLocaleString('id-ID')}
                            </span>
                            <span className="text-xs text-violet-100 font-bold bg-white/10 px-2 py-0.5 rounded mt-0.5 inline-block">
                                {viewToClick.toFixed(1)}% Tingkat Klik
                            </span>
                        </div>
                    </div>
                </div>

                {/* BREAKDOWN BRANCHING AREA */}
                {totalClicks > 0 && (
                    <div className="w-full my-4 flex flex-col items-center">
                        <div className="flex justify-between items-center w-3/4 h-6 border-x border-t border-dashed border-brand-border dark:border-dark-border rounded-t-xl relative">
                            {/* Branching down arrows */}
                            <ArrowDown className="w-3.5 h-3.5 text-brand-muted dark:text-dark-muted absolute -bottom-3 left-0 -translate-x-1/2" />
                            <ArrowDown className="w-3.5 h-3.5 text-brand-muted dark:text-dark-muted absolute -bottom-3 right-0 translate-x-1/2" />
                            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-dark-surface px-3 py-0.5 rounded-full border border-brand-border/40 text-[9px] font-bold uppercase tracking-wider text-brand-muted dark:text-dark-muted">
                                Pembagian Saluran
                            </div>
                        </div>
                    </div>
                )}

                {/* STAGE 3: Channel Breakdown */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    {/* Shopee Channel */}
                    <div className="bg-orange-50/60 dark:bg-orange-950/10 border border-orange-200/50 dark:border-orange-900/20 rounded-2xl p-4.5 hover:shadow-sm transition-all duration-300">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <span className="bg-[#EE4D2D]/10 text-[#EE4D2D] p-2 rounded-xl">
                                    <ShoppingBag className="w-4 h-4" />
                                </span>
                                <div>
                                    <h5 className="font-bold text-xs text-gray-800 dark:text-white">🛒 Shopee Checkout</h5>
                                    <p className="text-[10px] text-brand-muted dark:text-dark-muted mt-0.5 font-medium">Marketplace Checkout</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="font-mono font-bold text-base text-gray-800 dark:text-white block">
                                    {shopeeClicks.toLocaleString('id-ID')}
                                </span>
                                <span className="text-[9px] font-bold text-[#EE4D2D] bg-[#EE4D2D]/10 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                    {viewToShopee.toFixed(1)}% Konv.
                                </span>
                            </div>
                        </div>
                        
                        {/* Horizontal Progress Bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold text-brand-muted">
                                <span>Pangsa Klik</span>
                                <span>{shopeeShare.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-orange-100 dark:bg-orange-950/40 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-[#EE4D2D] rounded-full transition-all duration-500" 
                                    style={{ width: `${shopeeShare}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp Channel */}
                    <div className="bg-emerald-50/60 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/20 rounded-2xl p-4.5 hover:shadow-sm transition-all duration-300">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <span className="bg-[#25D366]/10 text-[#25D366] p-2 rounded-xl">
                                    <MessageCircle className="w-4 h-4" />
                                </span>
                                <div>
                                    <h5 className="font-bold text-xs text-gray-800 dark:text-white">💬 Tanya WhatsApp</h5>
                                    <p className="text-[10px] text-brand-muted dark:text-dark-muted mt-0.5 font-medium">Customer Consultation</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="font-mono font-bold text-base text-gray-800 dark:text-white block">
                                    {waClicks.toLocaleString('id-ID')}
                                </span>
                                <span className="text-[9px] font-bold text-[#25D366] bg-[#25D366]/10 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                    {viewToWa.toFixed(1)}% Konv.
                                </span>
                            </div>
                        </div>

                        {/* Horizontal Progress Bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold text-brand-muted">
                                <span>Pangsa Klik</span>
                                <span>{waShare.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-emerald-100 dark:bg-emerald-950/40 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-[#25D366] rounded-full transition-all duration-500" 
                                    style={{ width: `${waShare}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Premium Smart Insight Box */}
            <div className={`mt-8 p-5 border rounded-2xl flex flex-col md:flex-row gap-4 items-start transition-all duration-300 ${insight.colorClass}`}>
                <div className="p-3 bg-white dark:bg-dark-surface rounded-xl shadow-sm shrink-0">
                    <InsightIcon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                    <h4 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-1.5">
                        Analisis Corong Konversi
                        <span className="text-[10px] font-bold bg-white/40 dark:bg-dark-surface/60 px-2 py-0.5 rounded-full border border-black/5">
                            Konversi Utama: {viewToClick.toFixed(2)}%
                        </span>
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                        {insight.desc}
                    </p>
                    <p className="text-[10px] text-brand-muted dark:text-dark-muted pt-1 leading-relaxed">
                        💡 <strong>Tips Roxy Store:</strong> Konversi yang ideal berkisar antara 2% - 5%. Untuk meningkatkan konversi Shopee, pastikan nama produk di toko Anda sama persis dengan kata kunci terlaris di Shopee agar memicu psikologi kesamaan pada pembeli.
                    </p>
                </div>
            </div>
        </div>
    )
}
