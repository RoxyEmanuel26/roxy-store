'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
    Loader2, 
    Download, 
    Share2, 
    Layers, 
    Tag, 
    ExternalLink, 
    FileSpreadsheet,
    Info,
    AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Category {
    id: string
    name: string
    slug: string
    _count?: { products: number }
}

interface Subcategory {
    id: string
    name: string
    slug: string
    categoryId: string
    category: { id: string; name: string; slug: string }
    _count?: { products: number }
}

interface PinterestRow {
    Title: string
    'Media URL': string
    'Pinterest board': string
    Thumbnail: string
    Description: string
    Link: string
    'Publish date': string
    Keywords: string
}

interface SkippedProduct {
    id: string
    title: string
    reason: string
}

interface PreviewData {
    totalProducts: number
    totalRows: number
    batchSize: number
    totalPages: number
    currentBatch: number
    skippedCount: number
    skippedProducts?: SkippedProduct[]
    rowsCount: number
    previewRows: PinterestRow[]
}

export default function PinterestExportPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [subcategories, setSubcategories] = useState<Subcategory[]>([])
    
    // Filters
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('all')
    const [selectedBatch, setSelectedBatch] = useState<number>(1)
    
    // Data & Loaders
    const [previewData, setPreviewData] = useState<PreviewData | null>(null)
    const [loadingMetadata, setLoadingMetadata] = useState(true)
    const [loadingPreview, setLoadingPreview] = useState(false)
    const [downloading, setDownloading] = useState(false)
    
    // Toggle for detailed skipped list
    const [showSkippedList, setShowSkippedList] = useState(true)

    // Fetch initial categories & subcategories
    const fetchMetadata = useCallback(async () => {
        setLoadingMetadata(true)
        try {
            const [catRes, subRes] = await Promise.all([
                fetch('/api/admin/categories'),
                fetch('/api/admin/subcategories')
            ])

            if (catRes.ok && subRes.ok) {
                const cats = await catRes.json()
                const subs = await subRes.json()
                setCategories(cats)
                setSubcategories(subs)
            } else {
                toast.error('Gagal mengambil kategori atau subkategori')
            }
        } catch (error) {
            console.error('Error fetching metadata:', error)
            toast.error('Terjadi kesalahan koneksi')
        } finally {
            setLoadingMetadata(false)
        }
    }, [])

    useEffect(() => {
        fetchMetadata()
    }, [fetchMetadata])

    // Filter subcategories locally based on selected category
    const filteredSubcategories = subcategories.filter(
        sub => selectedCategoryId === 'all' || sub.categoryId === selectedCategoryId
    )

    // Fetch preview and count info
    const fetchPreview = useCallback(async () => {
        setLoadingPreview(true)
        try {
            const params = new URLSearchParams({
                categoryId: selectedCategoryId,
                subcategoryId: selectedSubcategoryId,
                batch: selectedBatch.toString()
            })
            const res = await fetch(`/api/admin/pinterest?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                setPreviewData(data)
            } else {
                toast.error('Gagal memuat pratinjau data')
            }
        } catch (error) {
            console.error('Error fetching preview:', error)
            toast.error('Koneksi gagal memuat pratinjau')
        } finally {
            setLoadingPreview(false)
        }
    }, [selectedCategoryId, selectedSubcategoryId, selectedBatch])

    useEffect(() => {
        fetchPreview()
    }, [fetchPreview])

    // [FIX Bug #1] Trigger CSV download — single download via invisible anchor
    const handleDownloadCsv = async () => {
        setDownloading(true)
        try {
            const params = new URLSearchParams({
                categoryId: selectedCategoryId,
                subcategoryId: selectedSubcategoryId,
                batch: selectedBatch.toString(),
                format: 'csv'
            })
            
            const res = await fetch(`/api/admin/pinterest?${params.toString()}`)
            if (!res.ok) {
                toast.error('Gagal mengunduh file CSV')
                return
            }
            
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `pinterest-export-batch-${selectedBatch}.csv`
            document.body.appendChild(a)
            a.click()
            
            // Cleanup
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            
            toast.success(`Berhasil mengunduh Pinterest CSV Batch ${selectedBatch}!`)
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Terjadi kesalahan saat mengunduh CSV')
        } finally {
            setDownloading(false)
        }
    }

    if (loadingMetadata) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                    <p className="text-sm text-brand-muted dark:text-dark-muted">
                        Memuat data kategori...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto px-4 md:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-brand-text dark:text-dark-text flex items-center gap-2">
                        <Share2 className="h-6 w-6 text-brand-primary" />
                        Pinterest Bulk Export CSV
                    </h1>
                    <p className="text-sm text-brand-muted dark:text-dark-muted mt-1 leading-relaxed max-w-2xl">
                        Ekspor produk website Anda menjadi file CSV bulk-upload Pinterest. Foto produk akan dipecah secara otomatis menjadi baris Pin terpisah dengan tautan dan judul unik untuk menghindari deteksi duplikasi Pinterest.
                    </p>
                </div>
            </div>

            {/* Panduan Singkat */}
            <div className="bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-blue-50/50 dark:from-slate-900/50 dark:to-slate-900/30 border border-blue-100 dark:border-slate-800 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                    <span className="font-bold text-blue-800 dark:text-blue-400">💡 Aturan Duplikasi & URL Unik Pinterest:</span>
                    <ul className="list-disc ml-4 mt-1 space-y-1">
                        <li>Setiap baris di CSV merepresentasikan satu Pin. Jika produk memiliki 3 foto, akan dihasilkan 3 baris Pin.</li>
                        <li>Agar Pinterest tidak memblokir unggahan massal karena judul & link duplikat, gambar kedua dan seterusnya akan memiliki judul berakhiran nomor urut (contoh: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">Produk A - 2</code>) dan link Shopee yang disisipkan parameter pembeda (contoh: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">.../?utm_source=pinterest&utm_content=pin2</code>).</li>
                        <li>Pinterest board akan secara otomatis diisi dengan nama <strong>Sub-kategori</strong> produk Anda (atau Kategori Utama sebagai cadangan).</li>
                        <li>Semua link akan otomatis ditambahkan <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">utm_source=pinterest</code> untuk pelacakan analytics.</li>
                        <li>Produk tanpa link Shopee akan otomatis dilewati dan tidak dimasukkan ke CSV.</li>
                    </ul>
                </div>
            </div>

            {/* Filter & Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Panel Kontrol Filter (Kiri/Atas) */}
                <div className="lg:col-span-8 p-5 md:p-6 border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface rounded-2xl space-y-5 shadow-sm">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        ⚙️ Saring Produk & Batch Ekspor
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Kategori Utama */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-brand-text dark:text-dark-text flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5 text-brand-muted" /> Kategori Utama
                            </label>
                            <select
                                value={selectedCategoryId}
                                onChange={(e) => {
                                    setSelectedCategoryId(e.target.value)
                                    setSelectedSubcategoryId('all')
                                    setSelectedBatch(1)
                                }}
                                className="flex h-10 w-full rounded-lg border border-brand-border bg-white dark:bg-dark-surface dark:border-dark-border px-3 py-2 text-sm text-brand-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            >
                                <option value="all">Semua Kategori</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name} ({cat._count?.products || 0} produk)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sub-kategori */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-brand-text dark:text-dark-text flex items-center gap-1.5">
                                <Tag className="h-3.5 w-3.5 text-brand-muted" /> Sub-kategori
                            </label>
                            <select
                                value={selectedSubcategoryId}
                                onChange={(e) => {
                                    setSelectedSubcategoryId(e.target.value)
                                    setSelectedBatch(1)
                                }}
                                className="flex h-10 w-full rounded-lg border border-brand-border bg-white dark:bg-dark-surface dark:border-dark-border px-3 py-2 text-sm text-brand-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            >
                                <option value="all">Semua Sub-kategori</option>
                                {filteredSubcategories.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                        {sub.name} ({sub._count?.products || 0} produk)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Batch Paginator (Maksimal 200 Baris per CSV) */}
                    {previewData && previewData.totalPages > 1 && (
                        <div className="space-y-2 pt-2">
                            <label className="text-xs font-semibold text-brand-text dark:text-dark-text">
                                Pilih Batch Download (Maksimal 200 Baris per Batch)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: previewData.totalPages }).map((_, idx) => {
                                    const batchNum = idx + 1
                                    const skipN = idx * 200
                                    const limit = Math.min(skipN + 200, previewData.totalRows)
                                    const isActive = selectedBatch === batchNum
                                    
                                    return (
                                        <button
                                            key={batchNum}
                                            onClick={() => setSelectedBatch(batchNum)}
                                            className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                                                isActive
                                                    ? 'bg-brand-primary border-brand-primary text-white shadow-sm'
                                                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            Batch {batchNum} (Baris {skipN + 1} - {limit})
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Panel Ringkasan / Ekspor (Kanan/Bawah) */}
                <div className="lg:col-span-4 p-5 md:p-6 border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface rounded-2xl flex flex-col justify-between min-h-[220px] shadow-sm">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                            📊 Estimasi File CSV
                        </h2>
                        
                        {loadingPreview ? (
                            <div className="flex items-center gap-2 py-4 text-xs text-brand-muted">
                                <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
                                Menghitung baris...
                            </div>
                        ) : previewData ? (
                            <div className="space-y-2.5">
                                <div className="flex justify-between text-xs border-b border-brand-border dark:border-dark-border pb-2">
                                    <span className="text-slate-500">Total Produk Terfilter:</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{previewData.totalProducts}</span>
                                </div>
                                <div className="flex justify-between text-xs border-b border-brand-border dark:border-dark-border pb-2">
                                    <span className="text-slate-500">Total Seluruh Baris Pin:</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{previewData.totalRows}</span>
                                </div>
                                {previewData.skippedCount > 0 && (
                                    <div className="flex justify-between text-xs border-b border-brand-border dark:border-dark-border pb-2">
                                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" />
                                            Dilewati (Tanpa Link/Foto):
                                        </span>
                                        <span className="font-bold text-amber-600 dark:text-amber-400">{previewData.skippedCount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs border-b border-brand-border dark:border-dark-border pb-2">
                                    <span className="text-slate-500">Maks. Baris/Batch:</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">200 baris</span>
                                </div>
                                <div className="flex justify-between text-xs pb-1">
                                    <span className="text-slate-500">Baris Pin di Batch Ini:</span>
                                    <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                                        {previewData.rowsCount} Baris
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
                                    ℹ️ Satu produk dengan beberapa foto akan menghasilkan beberapa baris Pin unik di file ekspor.
                                </p>
                            </div>
                        ) : null}
                    </div>

                    <Button
                        onClick={handleDownloadCsv}
                        disabled={loadingPreview || downloading || !previewData || previewData.rowsCount === 0}
                        className="w-full mt-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl h-11 flex items-center justify-center gap-2 font-bold shadow-lg shadow-red-600/15 transition-all"
                    >
                        {downloading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Mengunduh...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                Unduh Pinterest CSV
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Preview Section */}
            <div className="p-5 md:p-6 border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-brand-border dark:border-dark-border pb-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-brand-primary" />
                        Pratinjau Data CSV (10 Baris Pertama)
                    </h2>
                    {previewData && (
                        <span className="text-[10px] uppercase font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                            Batch {selectedBatch}
                        </span>
                    )}
                </div>

                {loadingPreview ? (
                    <div className="flex h-36 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
                    </div>
                ) : previewData && previewData.previewRows.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-brand-border dark:border-dark-border">
                        <table className="min-w-full divide-y divide-brand-border dark:divide-dark-border text-left text-xs text-brand-text dark:text-dark-text">
                            <thead className="bg-brand-surface dark:bg-dark-surface/50 text-[10px] font-bold uppercase text-brand-muted tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">Title</th>
                                    <th className="px-4 py-3">Pinterest Board</th>
                                    <th className="px-4 py-3">Link Target (Shopee)</th>
                                    <th className="px-4 py-3">Media (Foto)</th>
                                    <th className="px-4 py-3">Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border dark:divide-dark-border bg-white dark:bg-dark-surface">
                                {previewData.previewRows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="px-4 py-3 font-semibold max-w-[150px] truncate" title={row.Title}>
                                            {row.Title}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md font-medium">
                                                {row['Pinterest board']}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 max-w-[200px] truncate text-brand-primary hover:underline">
                                            <a href={row.Link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-bold">
                                                Shopee Link <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="relative h-12 w-12 rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50">
                                                <img 
                                                    src={row['Media URL']} 
                                                    alt="Media" 
                                                    className="h-full w-full object-cover" 
                                                    referrerPolicy="no-referrer"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 max-w-[250px] truncate text-slate-500" title={row.Description}>
                                            {row.Description}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                        Tidak ada produk untuk pratinjau
                    </div>
                )}
            </div>

            {/* Skipped Products Details */}
            {previewData && previewData.skippedCount > 0 && previewData.skippedProducts && previewData.skippedProducts.length > 0 && (
                <div className="p-5 md:p-6 border border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-amber-100 dark:border-amber-900/30 pb-3">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Detail Produk yang Dilewati ({previewData.skippedCount})
                        </h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSkippedList(!showSkippedList)}
                            className="h-7 text-xs font-semibold border-amber-200 hover:bg-amber-50 dark:border-amber-800/30 dark:hover:bg-amber-900/20 text-amber-800 dark:text-amber-400 rounded-full px-3"
                        >
                            {showSkippedList ? 'Sembunyikan' : 'Tampilkan Daftar'}
                        </Button>
                    </div>

                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-200/50 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                        <p className="font-semibold flex items-center gap-1.5 mb-1">
                            <Info className="h-3.5 w-3.5" /> Kenapa produk di bawah ini dilewati?
                        </p>
                        Pinterest mewajibkan setiap Pin memiliki <strong>Media URL (Foto Produk)</strong> dan <strong>Link Target (Redirection URL)</strong> yang valid. Produk-produk berikut tidak diekspor karena tidak memiliki tautan Shopee atau tidak memiliki gambar produk terpasang. Silakan lengkapi data produk tersebut di menu kelola produk agar dapat diekspor.
                    </div>

                    {showSkippedList && (
                        <div className="overflow-x-auto rounded-xl border border-amber-100 dark:border-amber-900/30">
                            <table className="min-w-full divide-y divide-amber-100 dark:divide-amber-900/30 text-left text-xs text-brand-text dark:text-dark-text">
                                <thead className="bg-amber-50/50 dark:bg-amber-950/30 text-[10px] font-bold uppercase text-amber-800 dark:text-amber-400 tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">Nama Produk</th>
                                        <th className="px-4 py-3">ID Produk</th>
                                        <th className="px-4 py-3">Alasan Dilewati</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100 dark:divide-amber-900/30 bg-white/50 dark:bg-dark-surface/50">
                                    {previewData.skippedProducts.map((prod) => (
                                        <tr key={prod.id} className="hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-colors">
                                            <td className="px-4 py-3 font-semibold">
                                                {prod.title}
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 font-mono text-[10px]">
                                                {prod.id}
                                            </td>
                                            <td className="px-4 py-3 text-amber-700 dark:text-amber-500 font-medium">
                                                ⚠️ {prod.reason}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
