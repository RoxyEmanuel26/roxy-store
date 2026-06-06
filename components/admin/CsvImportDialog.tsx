'use client'

import { useState, useRef, useEffect } from 'react'
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
    Trash2,
    Square,
    FileText,
    Play,
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

interface QueueItem {
    id: string
    file: File
    status: 'pending' | 'processing' | 'completed' | 'error'
    progress: number // progress of importing products within this file (0-100)
    summary?: ImportSummary
    results?: ImportResult[]
    errorMsg?: string
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
    'originalPrice',
    'image',
    'images',
    'shopeeUrl',
    'shopeeRating',
    'shopeeSold',
    'category',
    'badge',
    'isActive',
]

const CSV_TEMPLATE_EXAMPLE = [
    'Serum Vitamin C',
    'Serum wajah terbaik untuk kulit cerah dan sehat',
    '89000',
    '120000',
    'https://example.com/serum.jpg',
    'https://example.com/serum2.jpg|https://example.com/serum3.jpg',
    'https://shopee.co.id/product-link',
    '4.8',
    '150',
    'Skincare & Kecantikan',
    'NEW',
    'true',
]

function cleanNumberString(val: string): string {
    let str = val.trim()
    str = str.replace(/^(rp|idr|usd|sgd)\.?\s*/i, '')
    str = str.replace(/[^\d.,-]/g, '')
    
    if (!str) return '0'

    const hasDot = str.includes('.')
    const hasComma = str.includes(',')

    if (hasDot && hasComma) {
        const dotIndex = str.lastIndexOf('.')
        const commaIndex = str.lastIndexOf(',')
        if (dotIndex > commaIndex) {
            str = str.replace(/,/g, '')
        } else {
            str = str.replace(/\./g, '').replace(/,/g, '.')
        }
    } else if (hasComma) {
        const parts = str.split(',')
        const lastPart = parts[parts.length - 1]
        if (lastPart.length === 3 && parts.length > 1) {
            str = str.replace(/,/g, '')
        } else {
            str = str.replace(/,/g, '.')
        }
    } else if (hasDot) {
        const parts = str.split('.')
        const lastPart = parts[parts.length - 1]
        if (lastPart.length === 3 && parts.length > 1) {
            str = str.replace(/\./g, '')
        }
    }
    return str
}

function parseStringWithMultipliers(val: unknown): number {
    if (val === '' || val === undefined || val === null) return 0
    let str = String(val).trim().toLowerCase()
    
    str = str.replace(/^(rp|idr|usd|sgd)\.?\s*/i, '')
    str = str.replace(/terjual/g, '').trim()
    
    let multiplier = 1
    if (str.includes('ribu') || str.includes('rb') || str.includes('k')) {
        multiplier = 1000
        str = str.replace(/ribu|rb|\+/g, '').replace(/k/g, '').trim()
    } else if (str.includes('juta') || str.includes('jt')) {
        multiplier = 1000000
        str = str.replace(/juta|jt|\+/g, '').trim()
    } else {
        str = str.replace(/\+/g, '').trim()
    }
    
    if (multiplier > 1) {
        const partsComma = str.split(',')
        const partsDot = str.split('.')
        if (partsComma.length === 2 && partsDot.length === 1) {
            str = str.replace(',', '.')
        } else {
            str = cleanNumberString(str)
        }
    } else {
        str = cleanNumberString(str)
    }
    
    const parsed = parseFloat(str)
    return isNaN(parsed) ? 0 : parsed * multiplier
}

function parseCommissionAmount(val: unknown): number {
    if (val === '' || val === undefined || val === null) return 0
    let str = String(val).trim().toLowerCase()
    str = str.replace(/^(rp|idr|usd|sgd)\.?\s*/i, '')
    str = str.replace(/[^\d]/g, '')
    const parsed = parseInt(str, 10)
    return isNaN(parsed) ? 0 : parsed
}

export default function CsvImportDialog({
    open,
    onOpenChange,
    onImportComplete,
}: CsvImportDialogProps) {
    const [step, setStep] = useState<'upload' | 'importing' | 'result'>('upload')
    const [queueItems, setQueueItems] = useState<QueueItem[]>([])
    const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1)
    const [isQueueActive, setIsQueueActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [autoScrape, setAutoScrape] = useState(true)
    
    const isQueueActiveRef = useRef(false)
    const currentQueueIndexRef = useRef(-1)

    // Sync refs for the async loop access
    useEffect(() => {
        isQueueActiveRef.current = isQueueActive
    }, [isQueueActive])

    useEffect(() => {
        currentQueueIndexRef.current = currentQueueIndex
    }, [currentQueueIndex])

    const [minCommission, setMinCommission] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('roxy_import_min_commission')
            if (saved !== null) {
                const parsed = parseInt(saved, 10)
                return isNaN(parsed) ? 1000 : parsed
            }
        }
        return 1000
    })

    const handleMinCommissionChange = (val: number) => {
        setMinCommission(val)
        localStorage.setItem('roxy_import_min_commission', String(val))
    }

    const resetState = () => {
        setStep('upload')
        setQueueItems([])
        setCurrentQueueIndex(-1)
        setIsQueueActive(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleClose = () => {
        if (isQueueActive) {
            const confirmStop = window.confirm('Import sedang berjalan. Apakah Anda yakin ingin membatalkan dan menutup?')
            if (!confirmStop) return
            stopQueue()
        }
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
        const files = e.target.files
        if (!files || files.length === 0) return

        const newItems: QueueItem[] = []
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            if (!file.name.endsWith('.csv')) {
                toast.error(`File "${file.name}" dilewati karena bukan format .csv`)
                continue
            }

            if (file.size > 10 * 1024 * 1024) {
                toast.error(`File "${file.name}" dilewati karena ukuran melebihi 10MB`)
                continue
            }

            // Avoid adding duplicate files in the list
            if (queueItems.some((item) => item.file.name === file.name && item.file.size === file.size)) {
                continue
            }

            newItems.push({
                id: Math.random().toString(36).substring(7),
                file,
                status: 'pending',
                progress: 0,
            })
        }

        if (newItems.length > 0) {
            setQueueItems((prev) => [...prev, ...newItems])
            toast.success(`Berhasil menambahkan ${newItems.length} file ke daftar.`)
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const removeQueueItem = (id: string) => {
        setQueueItems((prev) => prev.filter((item) => item.id !== id))
    }

    const clearQueue = () => {
        setQueueItems([])
    }

    // Helper functions for functional state updates during loop
    const updateItemStatus = (index: number, status: QueueItem['status'], progress: number) => {
        setQueueItems((prev) => prev.map((item, i) => 
            i === index ? { ...item, status, progress } : item
        ))
    }

    const updateItemCompleted = (
        index: number,
        summary: ImportSummary,
        results: ImportResult[],
        errorMsg?: string
    ) => {
        setQueueItems((prev) => prev.map((item, i) => 
            i === index ? { ...item, status: 'completed', progress: 100, summary, results, errorMsg } : item
        ))
    }

    const updateItemError = (index: number, errorMsg: string) => {
        setQueueItems((prev) => prev.map((item, i) => 
            i === index ? { ...item, status: 'error', progress: 100, errorMsg } : item
        ))
    }

    // CSV parsing wrapper
    const parseCsvFile = (file: File): Promise<Record<string, any>[]> => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                encoding: 'UTF-8',
                complete: (result) => {
                    if (result.errors.length > 0) {
                        reject(new Error(`Gagal parsing CSV: ${result.errors[0].message}`))
                        return
                    }

                    const data = result.data as Record<string, string>[]
                    if (data.length === 0) {
                        reject(new Error('File CSV kosong atau tidak memiliki data'))
                        return
                    }

                    // Map headers
                    const fieldMap: Record<string, string> = {
                        title: 'title',
                        description: 'description',
                        price: 'price',
                        originalprice: 'originalPrice',
                        originalPrice: 'originalPrice',
                        image: 'image',
                        images: 'images',
                        shopeeurl: 'shopeeUrl',
                        shopeerating: 'shopeeRating',
                        shopeeRating: 'shopeeRating',
                        shopeesold: 'shopeeSold',
                        shopeeSold: 'shopeeSold',
                        category: 'category',
                        badge: 'badge',
                        isactive: 'isActive',
                        isActive: 'isActive',
                        shopeeUrl: 'shopeeUrl',

                        // Indonesian
                        judul: 'title',
                        nama: 'title',
                        deskripsi: 'description',
                        detail: 'description',
                        harga: 'price',
                        harga_asal: 'originalPrice',
                        hargaasal: 'originalPrice',
                        harga_coret: 'originalPrice',
                        hargacoret: 'originalPrice',
                        gambar: 'image',
                        foto: 'image',
                        gambar_galeri: 'images',
                        galeri: 'images',
                        fotogaleri: 'images',
                        shopee_url: 'shopeeUrl',
                        link_shopee: 'shopeeUrl',
                        shopee_rating: 'shopeeRating',
                        rating_shopee: 'shopeeRating',
                        shopee_terjual: 'shopeeSold',
                        terjual_shopee: 'shopeeSold',
                        terjual: 'shopeeSold',
                        kategori: 'category',
                        aktif: 'isActive',

                        // Shopee mass affiliate CSV
                        'nama produk': 'title',
                        'penjualan': 'shopeeSold',
                        'link komisi ekstra': 'shopeeUrl',
                        'id produk': '_ignore',
                        'nama toko': '_ignore',
                        'komisi hingga': '_ignore',
                        'komisi': 'commissionAmount',
                        'link produk': '_ignore',
                    }

                    const normalizedData = data.map((row, index) => {
                        const normalized: Record<string, any> = {}
                        for (const [key, value] of Object.entries(row)) {
                            const cleanKey = key.trim()
                            const mappedKey = fieldMap[cleanKey] || fieldMap[cleanKey.toLowerCase()] || cleanKey
                            normalized[mappedKey] = value
                        }
                        normalized.originalRow = index + 2
                        return normalized
                    })

                    resolve(normalizedData)
                },
                error: (error) => {
                    reject(new Error(`Gagal membaca file: ${error.message}`))
                }
            })
        })
    }

    const filterAndNormalizeRows = (rows: Record<string, any>[]): Record<string, any>[] => {
        const seenUrls = new Set<string>()
        const seenTitles = new Set<string>()
        const uniqueData: Record<string, any>[] = []

        for (const row of rows) {
            // Filter commission amount < minCommission
            const commissionRaw = row.commissionAmount
            if (commissionRaw !== undefined && commissionRaw !== '') {
                const commissionVal = parseCommissionAmount(commissionRaw)
                if (commissionVal < minCommission) {
                    continue
                }
            }

            const url = row.shopeeUrl ? String(row.shopeeUrl).trim().toLowerCase() : ''
            const title = row.title ? String(row.title).trim().toLowerCase() : ''
            
            let isDuplicate = false
            if (url && seenUrls.has(url)) {
                isDuplicate = true
            } else if (title && seenTitles.has(title)) {
                isDuplicate = true
            }

            if (!isDuplicate) {
                if (url) seenUrls.add(url)
                if (title) seenTitles.add(title)
                uniqueData.push(row)
            }
        }

        return uniqueData
    }

    const startQueueImport = async () => {
        if (queueItems.length === 0) {
            toast.error('Belum ada file di daftar import.')
            return
        }

        isQueueActiveRef.current = true
        setIsQueueActive(true)
        setStep('importing')

        // Loop through files in the queue
        for (let i = 0; i < queueItems.length; i++) {
            // Check cancellation ref
            if (!isQueueActiveRef.current) break

            setCurrentQueueIndex(i)
            updateItemStatus(i, 'processing', 0)

            const item = queueItems[i]

            try {
                // Parse CSV
                const parsedRows = await parseCsvFile(item.file)

                // Validate headers
                const firstRow = parsedRows[0]
                if (!firstRow || firstRow.title === undefined) {
                    throw new Error('Kolom "title", "judul", atau "nama" tidak ditemukan di file CSV ini.')
                }

                // Filter duplicates and commission limits
                const filteredRows = filterAndNormalizeRows(parsedRows)

                if (filteredRows.length === 0) {
                    updateItemCompleted(i, {
                        total: parsedRows.length,
                        created: 0,
                        updated: 0,
                        errors: 0
                    }, [], 'Semua produk disaring (komisi terlalu rendah atau duplikat)')
                    continue
                }

                const CHUNK_SIZE = 1
                let created = 0
                let updated = 0
                let errors = 0
                const fileResults: ImportResult[] = []

                // Process products one by one
                for (let c = 0; c < filteredRows.length; c++) {
                    // Check cancellation ref before fetching
                    if (!isQueueActiveRef.current) {
                        throw new Error('Proses dihentikan oleh pengguna')
                    }

                    const chunk = [filteredRows[c]]
                    const rowNumber = filteredRows[c].originalRow || (c + 2)

                    try {
                        const res = await fetch('/api/admin/products/import', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ products: chunk, autoScrape }),
                        })

                        if (!res.ok) {
                            const errorText = await res.text()
                            const isHtml = errorText.trim().startsWith('<') || errorText.includes('server error') || errorText.includes('504')
                            const displayError = isHtml 
                                ? 'Timeout serverless (Batas Vercel 10s). Silakan coba lagi.' 
                                : errorText || 'Gagal import produk ini'
                            throw new Error(displayError)
                        }

                        const data = await res.json()
                        if (res.ok && data.summary) {
                            created += data.summary.created
                            updated += data.summary.updated
                            errors += data.summary.errors
                            if (data.results) {
                                fileResults.push(...data.results)
                            }
                        } else {
                            errors += 1
                            fileResults.push({
                                row: rowNumber,
                                title: chunk[0].title || '(kosong)',
                                status: 'error',
                                error: data.error || 'Gagal mengimport baris ini',
                            })
                        }
                    } catch (err) {
                        errors += 1
                        fileResults.push({
                            row: rowNumber,
                            title: chunk[0].title || '(kosong)',
                            status: 'error',
                            error: err instanceof Error ? err.message : 'Kesalahan jaringan/timeout',
                        })
                    }

                    // Update live file progress
                    const progressVal = Math.round(((c + 1) / filteredRows.length) * 100)
                    updateItemStatus(i, 'processing', progressVal)
                }

                updateItemCompleted(i, {
                    total: filteredRows.length,
                    created,
                    updated,
                    errors
                }, fileResults)

            } catch (err: any) {
                updateItemError(i, err.message || 'Gagal memproses file')
            }
        }

        setIsQueueActive(false)
        setStep('result')
        onImportComplete()
        toast.success('Daftar import queue selesai diproses!')
    }

    const stopQueue = () => {
        setIsQueueActive(false)
        isQueueActiveRef.current = false
        toast.warning('Proses import queue dihentikan.')
    }

    // Statistics summaries for the result screen
    const totalFiles = queueItems.length
    const successfulFiles = queueItems.filter(item => item.status === 'completed').length
    const failedFiles = queueItems.filter(item => item.status === 'error').length
    
    let totalCreated = 0
    let totalUpdated = 0
    let totalErrors = 0
    
    queueItems.forEach(item => {
        if (item.summary) {
            totalCreated += item.summary.created
            totalUpdated += item.summary.updated
            totalErrors += item.summary.errors
        } else if (item.status === 'error') {
            totalErrors += 1
        }
    })

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                        <FileSpreadsheet className="h-5 w-5 text-brand-primary" />
                        Multi-CSV Queue Product Importer
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto my-4 pr-1 space-y-4">
                    {/* Step 1: Upload & Queue list */}
                    {step === 'upload' && (
                        <div className="space-y-4">
                            {/* Templates info */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 rounded-lg border border-brand-primary/20 bg-brand-primary/5 dark:bg-brand-primary/10 p-4 text-center sm:text-left flex flex-col justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-brand-text dark:text-dark-text mb-1 flex items-center gap-1.5 justify-center sm:justify-start">
                                            <Download className="h-3.5 w-3.5 text-brand-primary" />
                                            Gunakan Template CSV
                                        </p>
                                        <p className="text-[11px] text-brand-muted dark:text-dark-muted mb-3">
                                            Sesuaikan format judul, harga, dan link agar auto-scrape dan klasifikasi kategori berjalan lancar.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={downloadTemplate}
                                        className="w-full sm:w-auto self-start border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10 text-xs h-8"
                                    >
                                        Unduh Template CSV
                                    </Button>
                                </div>
                                <div className="flex-1 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-brand-muted dark:text-dark-muted space-y-1">
                                    <p className="font-semibold text-amber-700 dark:text-amber-500 flex items-center gap-1.5">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        Mendukung Mass Affiliate CSV
                                    </p>
                                    <p className="text-[11px]">
                                        Anda bisa langsung mengunggah file CSV mentah hasil ekspor Laporan Komisi Shopee Affiliate. Kolom <code className="bg-gray-150 dark:bg-gray-800 px-1 rounded font-mono">nama produk</code>, <code className="bg-gray-150 dark:bg-gray-800 px-1 rounded font-mono">komisi</code>, dan <code className="bg-gray-150 dark:bg-gray-800 px-1 rounded font-mono">link komisi ekstra</code> akan otomatis dipetakan.
                                    </p>
                                </div>
                            </div>

                            {/* Dropzone */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="multi-csv-upload"
                                    className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-brand-border dark:border-dark-border rounded-lg cursor-pointer hover:border-brand-primary/50 hover:bg-brand-surface/30 dark:hover:bg-dark-surface/30 transition-colors"
                                >
                                    <FileUp className="h-7 w-7 text-brand-muted dark:text-dark-muted mb-1" />
                                    <span className="text-xs font-medium text-brand-text dark:text-dark-text">
                                        Pilih File CSV atau Seret ke Sini
                                    </span>
                                    <span className="text-[10px] text-brand-muted/70 dark:text-dark-muted/70 mt-0.5">
                                        Anda bisa memilih lebih dari 10 file CSV sekaligus (Maks 10MB per file)
                                    </span>
                                    <input
                                        id="multi-csv-upload"
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </label>
                            </div>

                            {/* Settings Section */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg border border-brand-border dark:border-dark-border bg-brand-surface/30 dark:bg-dark-surface/20">
                                <div className="flex items-start gap-2.5">
                                    <input
                                        id="auto-scrape-check"
                                        type="checkbox"
                                        checked={autoScrape}
                                        onChange={(e) => setAutoScrape(e.target.checked)}
                                        className="h-4 w-4 mt-0.5 rounded border-brand-border text-brand-primary focus:ring-brand-primary cursor-pointer"
                                    />
                                    <div className="grid gap-0.5">
                                        <label
                                            htmlFor="auto-scrape-check"
                                            className="text-xs font-semibold text-brand-text dark:text-dark-text cursor-pointer select-none"
                                        >
                                            Scraping Otomatis Gambar & Detail Shopee
                                        </label>
                                        <p className="text-[10px] text-brand-muted dark:text-dark-muted leading-relaxed">
                                            Mengambil deskripsi asli, galeri foto lengkap, dan detail rating langsung dari Shopee secara background.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 sm:border-l border-brand-border dark:border-dark-border sm:pl-4">
                                    <label
                                        htmlFor="min-comm-input"
                                        className="text-xs font-semibold text-brand-text dark:text-dark-text select-none"
                                    >
                                        Minimal Komisi Produk (Rupiah)
                                    </label>
                                    <div className="relative mt-1">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-brand-muted dark:text-dark-muted font-medium">
                                            Rp
                                        </span>
                                        <input
                                            id="min-comm-input"
                                            type="number"
                                            min="0"
                                            step="500"
                                            value={minCommission}
                                            onChange={(e) => handleMinCommissionChange(parseInt(e.target.value, 10) || 0)}
                                            className="w-full h-8 pl-8 pr-3 rounded border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface text-xs focus:ring-1 focus:ring-brand-primary outline-none"
                                        />
                                    </div>
                                    <p className="text-[9px] text-brand-muted dark:text-dark-muted mt-0.5">
                                        Saring & lewati baris produk yang memiliki komisi di bawah nominal ini.
                                    </p>
                                </div>
                            </div>

                            {/* Queue List */}
                            {queueItems.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-brand-text dark:text-dark-text">
                                            Daftar File Antrean ({queueItems.length} file)
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearQueue}
                                            className="text-[10px] h-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 px-2"
                                        >
                                            Kosongkan Semua
                                        </Button>
                                    </div>
                                    <div className="border border-brand-border dark:border-dark-border rounded-lg overflow-hidden max-h-[220px] overflow-y-auto bg-white dark:bg-dark-surface/10 divide-y divide-brand-border dark:divide-dark-border">
                                        {queueItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between p-2.5 text-xs hover:bg-brand-surface/20 dark:hover:bg-dark-surface/20 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FileSpreadsheet className="h-4 w-4 text-brand-primary flex-shrink-0" />
                                                    <span className="font-medium text-brand-text dark:text-dark-text truncate max-w-[320px]">
                                                        {item.file.name}
                                                    </span>
                                                    <span className="text-[10px] text-brand-muted dark:text-dark-muted">
                                                        ({(item.file.size / 1024).toFixed(1)} KB)
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeQueueItem(item.id)}
                                                    className="text-brand-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 h-7 w-7 rounded"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-xs text-brand-muted dark:text-dark-muted rounded-lg border border-brand-border dark:border-dark-border border-dashed bg-brand-surface/10 dark:bg-dark-surface/5">
                                    Belum ada file yang dipilih untuk diimport.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Queue processing status */}
                    {step === 'importing' && (
                        <div className="space-y-4">
                            {/* Current File Header progress */}
                            {currentQueueIndex >= 0 && currentQueueIndex < queueItems.length && (
                                <div className="p-4 rounded-lg bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20 space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <p className="font-semibold text-brand-text dark:text-dark-text flex items-center gap-2">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-primary" />
                                            Sedang Memproses File {currentQueueIndex + 1} dari {queueItems.length}
                                        </p>
                                        <span className="font-bold text-brand-primary">
                                            {queueItems[currentQueueIndex].progress}%
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-brand-text dark:text-dark-text truncate">
                                        📄 {queueItems[currentQueueIndex].file.name}
                                    </p>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full bg-brand-primary rounded-full transition-all duration-300"
                                            style={{ width: `${queueItems[currentQueueIndex].progress}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-brand-muted dark:text-dark-muted leading-relaxed">
                                        Mohon jangan tutup modal atau pindah halaman ini. Proses scraping shopee berjalan lambat di background demi kestabilan.
                                    </p>
                                </div>
                            )}

                            {/* Overall progress status list */}
                            <p className="text-xs font-bold text-brand-text dark:text-dark-text">
                                Antrean Detail Status:
                            </p>
                            <div className="border border-brand-border dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface/10 divide-y divide-brand-border dark:divide-dark-border max-h-[260px] overflow-y-auto">
                                {queueItems.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className={`p-2.5 text-xs flex items-center justify-between ${
                                            idx === currentQueueIndex
                                                ? 'bg-brand-primary/5 dark:bg-brand-primary/10 font-medium'
                                                : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-[10px] text-brand-muted dark:text-dark-muted font-mono w-4 text-right">
                                                {idx + 1}.
                                            </span>
                                            <span className="text-brand-text dark:text-dark-text truncate max-w-[280px]">
                                                {item.file.name}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {item.status === 'pending' && (
                                                <span className="text-brand-muted dark:text-dark-muted text-[10px] flex items-center gap-1">
                                                    <RefreshCw className="h-3 w-3 animate-pulse" />
                                                    Menunggu
                                                </span>
                                            )}
                                            {item.status === 'processing' && (
                                                <span className="text-brand-primary text-[10px] font-semibold flex items-center gap-1">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    {item.progress}%
                                                </span>
                                            )}
                                            {item.status === 'completed' && (
                                                <div className="text-right">
                                                    <span className="text-green-600 dark:text-green-400 text-[10px] font-semibold flex items-center gap-1 justify-end">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Selesai
                                                    </span>
                                                    {item.summary && (
                                                        <span className="text-[9px] text-brand-muted dark:text-dark-muted block">
                                                            {item.summary.created} baru, {item.summary.updated} update, {item.summary.errors} error
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {item.status === 'error' && (
                                                <span className="text-red-500 text-[10px] font-semibold flex items-center gap-1" title={item.errorMsg}>
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    Gagal
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Result Summary screen */}
                    {step === 'result' && (
                        <div className="space-y-4">
                            {/* Summary header */}
                            <div className="rounded-lg border border-brand-border dark:border-dark-border p-4 bg-brand-surface/30 dark:bg-dark-surface/20 space-y-3">
                                <p className="text-sm font-bold text-brand-text dark:text-dark-text flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    Hasil Akhir Import Queue
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                                    <div className="p-2 border border-brand-border dark:border-dark-border rounded bg-white dark:bg-dark-surface">
                                        <p className="text-brand-muted dark:text-dark-muted font-medium text-[10px] mb-0.5">Total File</p>
                                        <p className="text-sm font-bold text-brand-text dark:text-dark-text">{totalFiles}</p>
                                    </div>
                                    <div className="p-2 border border-brand-border dark:border-dark-border rounded bg-white dark:bg-dark-surface">
                                        <p className="text-green-600 dark:text-green-500 font-medium text-[10px] mb-0.5">File Sukses</p>
                                        <p className="text-sm font-bold text-green-700 dark:text-green-400">{successfulFiles}</p>
                                    </div>
                                    <div className="p-2 border border-brand-border dark:border-dark-border rounded bg-white dark:bg-dark-surface">
                                        <p className="text-brand-primary font-medium text-[10px] mb-0.5">Produk Baru/Update</p>
                                        <p className="text-sm font-bold text-brand-primary">{totalCreated + totalUpdated}</p>
                                    </div>
                                    <div className="p-2 border border-brand-border dark:border-dark-border rounded bg-white dark:bg-dark-surface">
                                        <p className="text-red-500 font-medium text-[10px] mb-0.5">Total Error</p>
                                        <p className="text-sm font-bold text-red-600 dark:text-red-400">{totalErrors}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Details accordions */}
                            <p className="text-xs font-bold text-brand-text dark:text-dark-text">
                                Detail Hasil per File:
                            </p>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {queueItems.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className="border border-brand-border dark:border-dark-border rounded-lg overflow-hidden bg-white dark:bg-dark-surface/5"
                                    >
                                        <div className="flex items-center justify-between p-3 bg-brand-surface/30 dark:bg-dark-surface/10 text-xs">
                                            <div className="flex items-center gap-2 truncate">
                                                <FileText className="h-4 w-4 text-brand-primary" />
                                                <p className="font-bold text-brand-text dark:text-dark-text truncate">
                                                    {item.file.name}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {item.status === 'completed' ? (
                                                    <span className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/40 text-[9px] px-2 py-0.5 rounded font-medium">
                                                        {item.summary?.created} baru, {item.summary?.updated} update, {item.summary?.errors} error
                                                    </span>
                                                ) : (
                                                    <span className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 text-[9px] px-2 py-0.5 rounded font-medium">
                                                        Gagal: {item.errorMsg || 'Error tidak diketahui'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Display errors if they occurred */}
                                        {item.results && item.results.some(r => r.status === 'error') && (
                                            <div className="p-3 border-t border-brand-border dark:border-dark-border bg-red-50/20 dark:bg-red-950/5 text-[10px] space-y-1">
                                                <p className="font-semibold text-red-600 dark:text-red-400">Error dalam file:</p>
                                                <ul className="list-disc pl-4 space-y-1 text-brand-muted dark:text-dark-muted">
                                                    {item.results.filter(r => r.status === 'error').map((err, i) => (
                                                        <li key={i}>
                                                            Baris {err.row}: <strong className="text-brand-text dark:text-dark-text">{err.title}</strong> - {err.error}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Dialog Footer Actions */}
                <DialogFooter className="flex-shrink-0 pt-3 border-t border-brand-border dark:border-dark-border">
                    {step === 'upload' && (
                        <>
                            <Button variant="outline" onClick={handleClose}>
                                Tutup
                            </Button>
                            <Button
                                onClick={startQueueImport}
                                disabled={queueItems.length === 0 || isQueueActive}
                                className="bg-brand-primary hover:bg-brand-primary/90 text-white"
                            >
                                <Play className="h-4 w-4 mr-2" />
                                Mulai Import Queue ({queueItems.length} File)
                            </Button>
                        </>
                    )}
                    {step === 'importing' && (
                        <Button
                            variant="destructive"
                            onClick={stopQueue}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            <Square className="h-4 w-4 mr-2" />
                            Hentikan Proses (Batal)
                        </Button>
                    )}
                    {step === 'result' && (
                        <>
                            <Button variant="outline" onClick={resetState}>
                                Import Queue Baru
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
