'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import {
    FileUp,
    Download,
    Loader2,
    CheckCircle2,
    XCircle,
    RefreshCw,
    AlertTriangle,
    FileSpreadsheet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ImportResult {
    row: number
    title: string
    status: 'created' | 'updated' | 'error'
    error?: string
}

interface ImportSummary {
    total: number
    created: number
    updated: number
    errors: number
}

interface CsvImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onImportComplete: () => void
}

const CSV_TEMPLATE_HEADERS = [
    'title',
    'description',
    'price',
    'image',
    'images',
    'shopeeUrl',
    'tokopediaUrl',
    'category',
    'badge',
    'isActive',
]

const CSV_TEMPLATE_EXAMPLE = [
    'Serum Vitamin C',
    'Serum wajah terbaik untuk kulit cerah dan sehat',
    '89000',
    'https://example.com/serum.jpg',
    'https://example.com/serum2.jpg|https://example.com/serum3.jpg',
    'https://shopee.co.id/product-link',
    '',
    'Skincare & Kecantikan',
    'NEW',
    'true',
]

export default function CsvImportDialog({
    open,
    onOpenChange,
    onImportComplete,
}: CsvImportDialogProps) {
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload')
    const [parsedData, setParsedData] = useState<Record<string, string>[]>([])
    const [fileName, setFileName] = useState('')
    const [importing, setImporting] = useState(false)
    const [progress, setProgress] = useState(0)
    const [summary, setSummary] = useState<ImportSummary | null>(null)
    const [results, setResults] = useState<ImportResult[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const resetState = () => {
        setStep('upload')
        setParsedData([])
        setFileName('')
        setImporting(false)
        setProgress(0)
        setSummary(null)
        setResults([])
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleClose = () => {
        resetState()
        onOpenChange(false)
    }

    const downloadTemplate = () => {
        const csv = [
            CSV_TEMPLATE_HEADERS.join(','),
            CSV_TEMPLATE_EXAMPLE.map((v) => `"${v}"`).join(','),
        ].join('\n')

        const bom = '\uFEFF'
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'template-import-produk.csv'
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Template CSV berhasil didownload!')
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith('.csv')) {
            toast.error('File harus berformat .csv')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ukuran file maksimal 5MB')
            return
        }

        setFileName(file.name)

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: 'UTF-8',
            complete: (result) => {
                if (result.errors.length > 0) {
                    toast.error(`Error parsing CSV: ${result.errors[0].message}`)
                    return
                }

                const data = result.data as Record<string, string>[]

                if (data.length === 0) {
                    toast.error('File CSV kosong atau tidak memiliki data')
                    return
                }

                if (data.length > 100) {
                    toast.error('Maksimal 100 produk per import')
                    return
                }

                // Validate headers
                const headers = Object.keys(data[0])
                const hasTitle = headers.some(
                    (h) => h.toLowerCase().trim() === 'title'
                )
                if (!hasTitle) {
                    toast.error('File CSV harus memiliki kolom "title"')
                    return
                }

                setParsedData(data)
                setStep('preview')
            },
            error: (error) => {
                toast.error(`Gagal membaca file: ${error.message}`)
            },
        })
    }

    const handleImport = async () => {
        setImporting(true)
        setStep('importing')
        setProgress(10)

        try {
            // Map CSV headers to expected field names (case-insensitive)
            const fieldMap: Record<string, string> = {
                title: 'title',
                description: 'description',
                price: 'price',
                image: 'image',
                images: 'images',
                shopeeurl: 'shopeeUrl',
                tokopediaurl: 'tokopediaUrl',
                category: 'category',
                badge: 'badge',
                isactive: 'isActive',
                isActive: 'isActive',
                shopeeUrl: 'shopeeUrl',
                tokopediaUrl: 'tokopediaUrl',
            }

            const normalizedProducts = parsedData.map((row) => {
                const normalized: Record<string, string> = {}
                for (const [key, value] of Object.entries(row)) {
                    const cleanKey = key.trim()
                    const mappedKey = fieldMap[cleanKey] || fieldMap[cleanKey.toLowerCase()] || cleanKey
                    normalized[mappedKey] = value
                }
                return normalized
            })

            setProgress(30)

            const res = await fetch('/api/admin/products/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: normalizedProducts }),
            })

            setProgress(80)

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || 'Gagal mengimport produk')
                setStep('preview')
                setImporting(false)
                return
            }

            setProgress(100)
            setSummary(data.summary)
            setResults(data.results)
            setStep('result')

            if (data.summary.errors === 0) {
                toast.success(
                    `Import berhasil! ${data.summary.created} ditambahkan, ${data.summary.updated} diperbarui.`
                )
            } else {
                toast.warning(
                    `Import selesai dengan ${data.summary.errors} error.`
                )
            }

            onImportComplete()
        } catch {
            toast.error('Terjadi kesalahan saat import')
            setStep('preview')
        } finally {
            setImporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-brand-primary" />
                        Import Produk dari CSV
                    </DialogTitle>
                </DialogHeader>

                {/* Step 1: Upload */}
                {step === 'upload' && (
                    <div className="space-y-6 py-4">
                        {/* Template Download */}
                        <div className="rounded-lg border-2 border-dashed border-brand-primary/30 dark:border-brand-primary/20 bg-brand-primary/5 dark:bg-brand-primary/10 p-6 text-center">
                            <Download className="h-8 w-8 mx-auto mb-3 text-brand-primary" />
                            <p className="text-sm font-medium text-brand-text dark:text-dark-text mb-1">
                                Mulai dengan template
                            </p>
                            <p className="text-xs text-brand-muted dark:text-dark-muted mb-4">
                                Download template CSV lalu isi data produk Anda
                            </p>
                            <Button
                                variant="outline"
                                onClick={downloadTemplate}
                                className="border-brand-primary text-brand-primary hover:bg-brand-primary/10"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download Template CSV
                            </Button>
                        </div>

                        {/* File Upload */}
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-brand-text dark:text-dark-text">
                                Upload File CSV
                            </p>
                            <label
                                htmlFor="csv-upload"
                                className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-brand-border dark:border-dark-border rounded-lg cursor-pointer hover:border-brand-primary/50 hover:bg-brand-surface/50 dark:hover:bg-dark-surface/50 transition-colors"
                            >
                                <FileUp className="h-8 w-8 text-brand-muted dark:text-dark-muted mb-2" />
                                <span className="text-sm text-brand-muted dark:text-dark-muted">
                                    Klik untuk pilih file atau drag & drop
                                </span>
                                <span className="text-xs text-brand-muted/70 dark:text-dark-muted/70 mt-1">
                                    Format: .csv (maks 5MB, maks 100 produk)
                                </span>
                                <input
                                    id="csv-upload"
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </label>
                        </div>

                        {/* Format Info */}
                        <div className="rounded-lg bg-brand-surface/50 dark:bg-dark-surface/50 p-4 space-y-2">
                            <p className="text-xs font-medium text-brand-text dark:text-dark-text flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                Panduan Format CSV:
                            </p>
                            <ul className="text-xs text-brand-muted dark:text-dark-muted space-y-1 ml-5 list-disc">
                                <li>Kolom <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">title</code> wajib diisi (min 3 karakter)</li>
                                <li>Kolom <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">images</code> bisa berisi beberapa URL dipisahkan <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">|</code></li>
                                <li>Jika <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">category</code> kosong, otomatis masuk &ldquo;Other&rdquo;</li>
                                <li>Jika kategori belum ada, akan dibuat secara otomatis</li>
                                <li>Produk dengan slug sama akan di-update (bukan duplikat)</li>
                                <li>Badge: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">NEW</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">HOT</code>, atau <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">BEST SELLER</code></li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Step 2: Preview */}
                {step === 'preview' && (
                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-brand-text dark:text-dark-text">
                                    📄 {fileName}
                                </p>
                                <p className="text-xs text-brand-muted dark:text-dark-muted">
                                    {parsedData.length} produk ditemukan
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetState}
                            >
                                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                Ganti File
                            </Button>
                        </div>

                        {/* Preview Table */}
                        <div className="rounded-lg border border-brand-border dark:border-dark-border overflow-hidden overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-brand-surface/50 dark:bg-dark-surface/50 border-b border-brand-border dark:border-dark-border">
                                        <th className="px-3 py-2 text-left font-medium text-brand-muted dark:text-dark-muted">
                                            #
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-brand-muted dark:text-dark-muted min-w-[150px]">
                                            Judul
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-brand-muted dark:text-dark-muted">
                                            Harga
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-brand-muted dark:text-dark-muted">
                                            Kategori
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-brand-muted dark:text-dark-muted">
                                            Badge
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-brand-muted dark:text-dark-muted">
                                            Gambar
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.slice(0, 10).map((row, i) => {
                                        const title =
                                            row.title || row.Title || row.TITLE || ''
                                        const price =
                                            row.price || row.Price || row.PRICE || '0'
                                        const category =
                                            row.category ||
                                            row.Category ||
                                            row.CATEGORY ||
                                            'Other'
                                        const badge =
                                            row.badge || row.Badge || row.BADGE || '-'
                                        const image =
                                            row.image || row.Image || row.IMAGE || ''
                                        const images =
                                            row.images || row.Images || row.IMAGES || ''
                                        const totalImages =
                                            (image ? 1 : 0) +
                                            (images
                                                ? images.split('|').filter(Boolean).length
                                                : 0)

                                        return (
                                            <tr
                                                key={i}
                                                className="border-b border-brand-border/50 dark:border-dark-border/50"
                                            >
                                                <td className="px-3 py-2 text-brand-muted dark:text-dark-muted">
                                                    {i + 1}
                                                </td>
                                                <td className="px-3 py-2 font-medium text-brand-text dark:text-dark-text truncate max-w-[200px]">
                                                    {title || (
                                                        <span className="text-red-500">
                                                            (kosong)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-brand-text dark:text-dark-text">
                                                    Rp{Number(price).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className="inline-block bg-brand-surface dark:bg-dark-surface px-2 py-0.5 rounded text-[10px]">
                                                        {category}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-brand-muted dark:text-dark-muted">
                                                    {badge}
                                                </td>
                                                <td className="px-3 py-2 text-brand-muted dark:text-dark-muted">
                                                    {totalImages} foto
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            {parsedData.length > 10 && (
                                <div className="px-3 py-2 text-center text-xs text-brand-muted dark:text-dark-muted bg-brand-surface/30 dark:bg-dark-surface/30">
                                    ... dan {parsedData.length - 10} produk lainnya
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Importing */}
                {step === 'importing' && (
                    <div className="py-12 flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
                        <div className="text-center">
                            <p className="text-sm font-medium text-brand-text dark:text-dark-text">
                                Mengimport {parsedData.length} produk...
                            </p>
                            <p className="text-xs text-brand-muted dark:text-dark-muted mt-1">
                                Mohon tunggu, jangan tutup halaman ini
                            </p>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full bg-brand-primary rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-brand-muted dark:text-dark-muted">
                            {progress}%
                        </p>
                    </div>
                )}

                {/* Step 4: Result */}
                {step === 'result' && summary && (
                    <div className="space-y-4 py-4">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-center">
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                                <p className="text-lg font-bold text-green-700 dark:text-green-400">
                                    {summary.created}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-500">
                                    Ditambahkan
                                </p>
                            </div>
                            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-center">
                                <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                                    {summary.updated}
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-500">
                                    Diperbarui
                                </p>
                            </div>
                            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-center">
                                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto mb-1" />
                                <p className="text-lg font-bold text-red-700 dark:text-red-400">
                                    {summary.errors}
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-500">
                                    Gagal
                                </p>
                            </div>
                        </div>

                        {/* Detail Results */}
                        <div className="rounded-lg border border-brand-border dark:border-dark-border overflow-hidden max-h-[250px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0">
                                    <tr className="bg-brand-surface/80 dark:bg-dark-surface/80 border-b border-brand-border dark:border-dark-border backdrop-blur-sm">
                                        <th className="px-3 py-2 text-left font-medium text-brand-muted dark:text-dark-muted">
                                            Baris
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-brand-muted dark:text-dark-muted">
                                            Produk
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-brand-muted dark:text-dark-muted">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((r, i) => (
                                        <tr
                                            key={i}
                                            className="border-b border-brand-border/50 dark:border-dark-border/50"
                                        >
                                            <td className="px-3 py-2 text-brand-muted dark:text-dark-muted">
                                                {r.row}
                                            </td>
                                            <td className="px-3 py-2 text-brand-text dark:text-dark-text truncate max-w-[200px]">
                                                {r.title}
                                            </td>
                                            <td className="px-3 py-2">
                                                {r.status === 'created' && (
                                                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Ditambahkan
                                                    </span>
                                                )}
                                                {r.status === 'updated' && (
                                                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                                        <RefreshCw className="h-3.5 w-3.5" />
                                                        Diperbarui
                                                    </span>
                                                )}
                                                {r.status === 'error' && (
                                                    <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400" title={r.error}>
                                                        <XCircle className="h-3.5 w-3.5" />
                                                        {r.error}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <DialogFooter>
                    {step === 'upload' && (
                        <Button variant="outline" onClick={handleClose}>
                            Tutup
                        </Button>
                    )}
                    {step === 'preview' && (
                        <>
                            <Button variant="outline" onClick={handleClose}>
                                Batal
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={importing}
                                className="bg-brand-primary hover:bg-brand-primary/90 text-white"
                            >
                                <FileUp className="h-4 w-4 mr-2" />
                                Mulai Import ({parsedData.length} produk)
                            </Button>
                        </>
                    )}
                    {step === 'result' && (
                        <>
                            <Button variant="outline" onClick={resetState}>
                                Import Lagi
                            </Button>
                            <Button
                                onClick={handleClose}
                                className="bg-brand-primary hover:bg-brand-primary/90 text-white"
                            >
                                Selesai
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
