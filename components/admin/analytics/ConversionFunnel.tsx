interface FunnelProps {
    views: number
    shopeeClicks: number
    tokopediaClicks: number
    waClicks: number
}

export function ConversionFunnel({ views, shopeeClicks, tokopediaClicks, waClicks }: FunnelProps) {
    const totalClicks = shopeeClicks + tokopediaClicks + waClicks
    const viewToClick = views > 0 ? ((totalClicks / views) * 100).toFixed(1) : '0'
    const viewToShopee = views > 0 ? ((shopeeClicks / views) * 100).toFixed(1) : '0'
    const viewToTokopedia = views > 0 ? ((tokopediaClicks / views) * 100).toFixed(1) : '0'

    return (
        <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-brand-border">
            <h3 className="font-bold text-lg mb-2">Funnel Konversi (All Time)</h3>
            <p className="text-sm text-brand-muted mb-6">
                Perjalanan pengunjung dari melihat produk hingga klik marketplace atau kontak.
            </p>

            <div className="flex flex-col gap-3">
                {/* Step 1 - Views */}
                <div className="w-full relative py-3 px-4 rounded-xl font-bold flex justify-between bg-brand-primary text-white shadow-sm overflow-hidden z-10">
                    <span>Produk Dilihat</span>
                    <span>{views.toLocaleString('id-ID')} views</span>
                </div>

                {/* Step 2 - Shopee */}
                <div className="flex justify-center w-full">
                    <div
                        className="relative py-2 px-4 rounded-lg font-bold flex justify-between bg-[#EE4D2D] text-white shadow-sm overflow-hidden"
                        style={{ width: `max(${viewToShopee}%, 30%)` }}
                    >
                        <span className="truncate">🛒 Shopee</span>
                        <span>{shopeeClicks.toLocaleString('id-ID')}</span>
                    </div>
                </div>

                {/* Step 3 - Tokopedia */}
                <div className="flex justify-center w-full">
                    <div
                        className="relative py-2 px-4 rounded-lg font-bold flex justify-between bg-[#42B549] text-white shadow-sm overflow-hidden"
                        style={{ width: `max(${viewToTokopedia}%, 30%)` }}
                    >
                        <span className="truncate">🟢 Tokopedia</span>
                        <span>{tokopediaClicks.toLocaleString('id-ID')}</span>
                    </div>
                </div>

                {/* Step 4 - WhatsApp */}
                <div className="flex justify-center w-full">
                    <div className="w-1/4 min-w-[120px] relative py-2 px-4 rounded-lg font-bold flex justify-between bg-[#25D366] text-white shadow-sm">
                        <span>💬 WA</span>
                        <span>{waClicks.toLocaleString('id-ID')}</span>
                    </div>
                </div>
            </div >

            <div className="mt-8 p-4 bg-brand-surface dark:bg-dark-bg rounded-xl border border-brand-border">
                <p className="text-sm text-brand-text dark:text-dark-text">
                    📊 <strong>Tingkat Konversi Keseluruhan:</strong> {viewToClick}% pengunjung mengklik
                    setidaknya satu tombol beli/kontak.
                </p>
                <p className="text-sm text-brand-muted mt-2 leading-relaxed">
                    💡 <strong>Tips:</strong> Konversi yang baik untuk toko aksesori handmade: 2-5%. Jika di bawah ini, pertimbangkan untuk meningkatkan kualitas foto produk.
                </p>
            </div>
        </div >
    )
}
