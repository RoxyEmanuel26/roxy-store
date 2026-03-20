'use client'

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-surface dark:bg-dark-bg px-4">
            <div className="text-center max-w-md">
                <div className="text-8xl mb-6">📡</div>
                <h1 className="text-2xl font-bold text-brand-text dark:text-dark-text mb-3">
                    Kamu Sedang Offline
                </h1>
                <p className="text-brand-muted dark:text-dark-muted mb-8 leading-relaxed">
                    Koneksi internetmu terputus. Periksa koneksi WiFi atau data selulermu, lalu coba lagi.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-brand-primary hover:bg-brand-accent text-white font-semibold px-6 py-3 rounded-xl"
                >
                    🔄 Coba Lagi
                </button>
                <p className="text-xs text-brand-muted mt-6">
                    Halaman dan produk yang pernah kamu kunjungi mungkin masih bisa diakses
                </p>
            </div>
        </div>
    )
}
