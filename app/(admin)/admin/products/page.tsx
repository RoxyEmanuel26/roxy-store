'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Search, X, Pencil, Trash2, Loader2, FileSpreadsheet, Sparkles, RefreshCw, ChevronDown, ChevronUp, Coins, ImageIcon, Database, AlignLeft, Settings } from 'lucide-react'
import CsvImportDialog from '@/components/admin/CsvImportDialog'
import LinkImportDialog from '@/components/admin/LinkImportDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils'

interface Product {
    id: string
    title: string
    slug: string
    price: number
    image: string
    badge: string | null
    isActive: boolean
    viewCount: number
    createdAt: string
    category: { id: string; name: string }
}

interface Category {
    id: string
    name: string
}

export default function AdminProductsPage() {
    const isCancelledRef = useRef(false)
    const isImageCancelledRef = useRef(false)
    const isSyncBatchCancelledRef = useRef(false)
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Filters
    const [search, setSearch] = useState('')
    const [searchDebounced, setSearchDebounced] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    // CSV & Link Import
    const [csvDialogOpen, setCsvDialogOpen] = useState(false)
    const [linkDialogOpen, setLinkDialogOpen] = useState(false)

    // Delete
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Shopee Link Checker State
    const [checkStatus, setCheckStatus] = useState<{
        status: 'idle' | 'running' | 'completed' | 'cancelled'
        checked: number
        total: number
        deactivated: number
        logs: string[]
        startedAt: string | null
        completedAt: string | null
    } | null>(null)
    const [showCheckLogs, setShowCheckLogs] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)

    // Shopee Sync Batch State & Handlers
    const [syncBatchStatus, setSyncBatchStatus] = useState<{
        status: 'idle' | 'running' | 'completed' | 'cancelled'
        syncType: 'data' | 'image' | 'description' | null
        checked: number
        total: number
        updated: number
        logs: string[]
        startedAt: string | null
        completedAt: string | null
    } | null>(null)
    const [showSyncBatchLogs, setShowSyncBatchLogs] = useState(false)
    const [isSyncBatchDismissed, setIsSyncBatchDismissed] = useState(false)

    // Sync state
    const [syncingState, setSyncingState] = useState<Record<string, 'price' | 'content' | null>>({})

    const handleSync = async (productId: string, action: 'price' | 'content') => {
        setSyncingState(prev => ({ ...prev, [productId]: action }))
        try {
            const res = await fetch(`/api/admin/products/${productId}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            })

            const data = await res.json()
            if (res.ok) {
                toast.success(data.message || 'Sinkronisasi berhasil!')
                setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...data.product } : p))
            } else {
                toast.error(data.error || 'Gagal sinkronisasi dengan Shopee')
            }
        } catch {
            toast.error('Terjadi kesalahan koneksi saat sinkronisasi')
        } finally {
            setSyncingState(prev => ({ ...prev, [productId]: null }))
        }
    }

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setSearchDebounced(search), 500)
        return () => clearTimeout(timer)
    }, [search])

    const fetchProducts = useCallback(async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
            })
            if (searchDebounced) params.set('search', searchDebounced)
            if (categoryId) params.set('categoryId', categoryId)
            if (statusFilter) params.set('isActive', statusFilter)

            const res = await fetch(`/api/admin/products?${params}`)
            if (res.ok) {
                const data = await res.json()
                setProducts(data.products)
                setTotal(data.total)
                setTotalPages(data.totalPages)
            }
        } catch {
            toast.error('Gagal memuat data produk')
        } finally {
            setIsLoading(false)
        }
    }, [page, searchDebounced, categoryId, statusFilter])

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/categories')
            if (res.ok) setCategories(await res.json())
        } catch { /* ignore */ }
    }, [])

    const fetchCheckStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/products/check-links')
            if (res.ok) {
                const data = await res.json()
                setCheckStatus(data)
                
                // If it finished running, refresh the product list to show deactivated products
                if (data.status === 'completed' || data.status === 'cancelled') {
                    fetchProducts()
                }
            }
        } catch { /* ignore */ }
    }, [fetchProducts])

    const handleStartCheck = async () => {
        isCancelledRef.current = false
        try {
            const res = await fetch('/api/admin/products/check-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start' }),
            })
            if (res.ok) {
                const data = await res.json()
                toast.success('Pengecekan link aktif dimulai!')
                setIsDismissed(false)
                setShowCheckLogs(true)
                setCheckStatus(data.status)

                const productsToCheck = data.products || []
                
                // Sequential execution loop driven entirely by the client browser
                for (let i = 0; i < productsToCheck.length; i++) {
                    if (isCancelledRef.current) {
                        break
                    }

                    const product = productsToCheck[i]
                    try {
                        const checkRes = await fetch('/api/admin/products/check-links', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'check-single', productId: product.id }),
                        })

                        if (checkRes.ok) {
                            const checkData = await checkRes.json()
                            setCheckStatus(checkData.status)
                        }
                    } catch (err) {
                        console.error('Failed to check single link:', err)
                    }

                    // Throttled delay between checks to prevent Shopee IP rate limit/ban
                    await new Promise(resolve => setTimeout(resolve, 1500))
                }

                // Finalize process status based on completion or cancellation
                if (isCancelledRef.current) {
                    const cancelRes = await fetch('/api/admin/products/check-links', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'cancel' }),
                    })
                    if (cancelRes.ok) {
                        const cancelData = await cancelRes.json()
                        setCheckStatus(cancelData.status)
                        toast.error('Verifikasi dibatalkan!')
                    }
                } else {
                    const completeRes = await fetch('/api/admin/products/check-links', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'complete' }),
                    })
                    if (completeRes.ok) {
                        const completeData = await completeRes.json()
                        setCheckStatus(completeData.status)
                        toast.success('Verifikasi link selesai!')
                    }
                }
                
                fetchProducts()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Gagal memulai pengecekan')
            }
        } catch {
            toast.error('Terjadi kesalahan koneksi')
        }
    }

    const handleCancelCheck = async () => {
        isCancelledRef.current = true
        toast.info('Sedang menghentikan pengecekan...')
        try {
            const res = await fetch('/api/admin/products/check-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel' }),
            })
            if (res.ok) {
                const data = await res.json()
                setCheckStatus(data.status)
                toast.success('Pengecekan dihentikan.')
                fetchProducts()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Gagal membatalkan pengecekan')
            }
        } catch {
            toast.error('Terjadi kesalahan koneksi')
        }
    }

    // Shopee Image Checker State & Handlers
    const [imageCheckStatus, setImageCheckStatus] = useState<{
        status: 'idle' | 'running' | 'completed' | 'cancelled'
        checked: number
        total: number
        deactivated: number
        logs: string[]
        startedAt: string | null
        completedAt: string | null
    } | null>(null)
    const [showImageCheckLogs, setShowImageCheckLogs] = useState(false)
    const [isImageDismissed, setIsImageDismissed] = useState(false)

    const fetchImageCheckStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/products/check-images')
            if (res.ok) {
                const data = await res.json()
                setImageCheckStatus(data)
                if (data.status === 'completed' || data.status === 'cancelled') {
                    fetchProducts()
                }
            }
        } catch { /* ignore */ }
    }, [fetchProducts])

    const handleStartImageCheck = async () => {
        isImageCancelledRef.current = false
        try {
            const res = await fetch('/api/admin/products/check-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start' }),
            })
            if (res.ok) {
                const data = await res.json()
                toast.success('Pengecekan gambar aktif dimulai!')
                setIsImageDismissed(false)
                setShowImageCheckLogs(true)
                setImageCheckStatus(data.status)

                const productsToCheck = data.products || []
                for (let i = 0; i < productsToCheck.length; i++) {
                    if (isImageCancelledRef.current) break

                    const product = productsToCheck[i]
                    try {
                        const checkRes = await fetch('/api/admin/products/check-images', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'check-single', productId: product.id }),
                        })
                        if (checkRes.ok) {
                            const checkData = await checkRes.json()
                            setImageCheckStatus(checkData.status)
                        }
                    } catch (err) {
                        console.error('Failed to check single image:', err)
                    }

                    await new Promise(resolve => setTimeout(resolve, 500))
                }

                if (isImageCancelledRef.current) {
                    const cancelRes = await fetch('/api/admin/products/check-images', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'cancel' }),
                    })
                    if (cancelRes.ok) {
                        const cancelData = await cancelRes.json()
                        setImageCheckStatus(cancelData.status)
                        toast.error('Verifikasi gambar dibatalkan!')
                    }
                } else {
                    const completeRes = await fetch('/api/admin/products/check-images', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'complete' }),
                    })
                    if (completeRes.ok) {
                        const completeData = await completeRes.json()
                        setImageCheckStatus(completeData.status)
                        toast.success('Verifikasi gambar selesai!')
                    }
                }
                fetchProducts()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Gagal memulai pengecekan gambar')
            }
        } catch {
            toast.error('Terjadi kesalahan koneksi')
        }
    }

    const handleCancelImageCheck = async () => {
        isImageCancelledRef.current = true
        toast.info('Sedang menghentikan pengecekan gambar...')
        try {
            const res = await fetch('/api/admin/products/check-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel' }),
            })
            if (res.ok) {
                const data = await res.json()
                setImageCheckStatus(data.status)
                toast.success('Pengecekan gambar dihentikan.')
                fetchProducts()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Gagal membatalkan pengecekan gambar')
            }
        } catch {
            toast.error('Terjadi kesalahan koneksi')
        }
    }

    const fetchSyncBatchStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/products/sync-batch')
            if (res.ok) {
                const data = await res.json()
                setSyncBatchStatus(data)
                if (data.status === 'completed' || data.status === 'cancelled') {
                    fetchProducts()
                }
            }
        } catch { /* ignore */ }
    }, [fetchProducts])

    const handleStartSyncBatch = async (syncType: 'data' | 'image' | 'description') => {
        isSyncBatchCancelledRef.current = false
        try {
            const res = await fetch('/api/admin/products/sync-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start', syncType }),
            })
            if (res.ok) {
                const data = await res.json()
                let typeLabel = 'Data (Kategori/Harga)'
                if (syncType === 'image') typeLabel = 'Gambar'
                if (syncType === 'description') typeLabel = 'Deskripsi'
                
                toast.success(`Sinkronisasi Massal ${typeLabel} dimulai!`)
                setIsSyncBatchDismissed(false)
                setShowSyncBatchLogs(true)
                setSyncBatchStatus(data.status)

                const productsToSync = data.products || []
                for (let i = 0; i < productsToSync.length; i++) {
                    if (isSyncBatchCancelledRef.current) break

                    const product = productsToSync[i]
                    try {
                        const checkRes = await fetch('/api/admin/products/sync-batch', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'sync-single', productId: product.id, syncType }),
                        })
                        if (checkRes.ok) {
                            const checkData = await checkRes.json()
                            setSyncBatchStatus(checkData.status)
                        }
                    } catch (err) {
                        console.error('Failed to sync single product:', err)
                    }

                    // Throttled delay between checks
                    await new Promise(resolve => setTimeout(resolve, 1500))
                }

                if (isSyncBatchCancelledRef.current) {
                    const cancelRes = await fetch('/api/admin/products/sync-batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'cancel' }),
                    })
                    if (cancelRes.ok) {
                        const cancelData = await cancelRes.json()
                        setSyncBatchStatus(cancelData.status)
                        toast.error(`Sinkronisasi Massal ${typeLabel} dibatalkan!`)
                    }
                } else {
                    const completeRes = await fetch('/api/admin/products/sync-batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'complete' }),
                    })
                    if (completeRes.ok) {
                        const completeData = await completeRes.json()
                        setSyncBatchStatus(completeData.status)
                        toast.success(`Sinkronisasi Massal ${typeLabel} selesai!`)
                    }
                }
                fetchProducts()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Gagal memulai sinkronisasi massal')
            }
        } catch {
            toast.error('Terjadi kesalahan koneksi')
        }
    }

    const handleCancelSyncBatch = async () => {
        isSyncBatchCancelledRef.current = true
        toast.info('Sedang menghentikan sinkronisasi...')
        try {
            const res = await fetch('/api/admin/products/sync-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel' }),
            })
            if (res.ok) {
                const data = await res.json()
                setSyncBatchStatus(data.status)
                toast.success('Sinkronisasi dihentikan.')
                fetchProducts()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Gagal membatalkan sinkronisasi')
            }
        } catch {
            toast.error('Terjadi kesalahan koneksi')
        }
    }

    // Cancel the client checker loop on page unmount to prevent leaked requests
    useEffect(() => {
        return () => {
            isCancelledRef.current = true
            isImageCancelledRef.current = true
            isSyncBatchCancelledRef.current = true
        }
    }, [])

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    useEffect(() => {
        fetchCheckStatus()
    }, [fetchCheckStatus])

    useEffect(() => {
        fetchImageCheckStatus()
    }, [fetchImageCheckStatus])

    useEffect(() => {
        fetchSyncBatchStatus()
    }, [fetchSyncBatchStatus])

    useEffect(() => {
        if (!checkStatus || checkStatus.status !== 'running') return

        const interval = setInterval(() => {
            fetchCheckStatus()
        }, 3000)

        return () => clearInterval(interval)
    }, [checkStatus?.status, fetchCheckStatus])

    useEffect(() => {
        if (!imageCheckStatus || imageCheckStatus.status !== 'running') return

        const interval = setInterval(() => {
            fetchImageCheckStatus()
        }, 3000)

        return () => clearInterval(interval)
    }, [imageCheckStatus?.status, fetchImageCheckStatus])

    useEffect(() => {
        if (!syncBatchStatus || syncBatchStatus.status !== 'running') return

        const interval = setInterval(() => {
            fetchSyncBatchStatus()
        }, 3000)

        return () => clearInterval(interval)
    }, [syncBatchStatus?.status, fetchSyncBatchStatus])

    // Reset page when filters change
    useEffect(() => {
        setPage(1)
    }, [searchDebounced, categoryId, statusFilter])

    const handleToggleActive = async (product: Product) => {
        // Optimistic update
        setProducts((prev) =>
            prev.map((p) =>
                p.id === product.id ? { ...p, isActive: !p.isActive } : p
            )
        )

        try {
            const res = await fetch(`/api/admin/products/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !product.isActive }),
            })

            if (!res.ok) {
                // Rollback
                setProducts((prev) =>
                    prev.map((p) =>
                        p.id === product.id ? { ...p, isActive: product.isActive } : p
                    )
                )
                toast.error('Gagal mengubah status produk')
                return
            }

            toast.success(
                `Produk ${!product.isActive ? 'diaktifkan' : 'dinonaktifkan'}!`
            )
        } catch {
            // Rollback
            setProducts((prev) =>
                prev.map((p) =>
                    p.id === product.id ? { ...p, isActive: product.isActive } : p
                )
            )
            toast.error('Terjadi kesalahan')
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            const res = await fetch(`/api/admin/products/${deleteTarget.id}`, {
                method: 'DELETE',
            })
            if (!res.ok) {
                toast.error('Gagal menghapus produk')
                return
            }
            toast.success('Produk berhasil dihapus!')
            setDeleteTarget(null)
            fetchProducts()
        } catch {
            toast.error('Terjadi kesalahan')
        } finally {
            setDeleting(false)
        }
    }

    const resetFilters = () => {
        setSearch('')
        setSearchDebounced('')
        setCategoryId('')
        setStatusFilter('')
        setPage(1)
    }

    const badgeColors: Record<string, string> = {
        NEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        HOT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        'BEST SELLER': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    }

    return (
        <div className="space-y-6">
            {/* Progress Banner Sync Massal */}
            {syncBatchStatus && syncBatchStatus.status !== 'idle' && !isSyncBatchDismissed && (
                <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                    syncBatchStatus.status === 'running' 
                        ? 'bg-blue-50/75 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40 backdrop-blur-md'
                        : syncBatchStatus.status === 'completed'
                        ? 'bg-emerald-50/75 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 backdrop-blur-md'
                        : 'bg-amber-50/75 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 backdrop-blur-md'
                }`}>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1 flex-1 w-full">
                            <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${
                                    syncBatchStatus.status === 'running' 
                                        ? 'bg-blue-500 animate-ping'
                                        : syncBatchStatus.status === 'completed'
                                        ? 'bg-emerald-500'
                                        : 'bg-amber-500'
                                }`} />
                                <h3 className="font-semibold text-brand-text dark:text-dark-text">
                                    {syncBatchStatus.status === 'running' 
                                        ? `Sedang Sinkronisasi Massal ${syncBatchStatus.syncType === 'image' ? 'Gambar' : syncBatchStatus.syncType === 'description' ? 'Deskripsi' : 'Data (Kategori/Harga)'}...` 
                                        : syncBatchStatus.status === 'completed'
                                        ? 'Sinkronisasi Massal Selesai!'
                                        : 'Sinkronisasi Massal Dibatalkan'}
                                </h3>
                                {syncBatchStatus.updated > 0 && (
                                    <Badge variant="default" className="ml-2 bg-brand-primary text-white">
                                        {syncBatchStatus.updated} Produk Diperbarui
                                    </Badge>
                                )}
                            </div>
                            
                            {syncBatchStatus.status === 'running' ? (
                                <p className="text-sm text-brand-muted dark:text-dark-muted">
                                    Memproses: <span className="font-medium text-brand-primary">{syncBatchStatus.checked}</span> dari <span className="font-medium">{syncBatchStatus.total}</span> produk ({Math.round((syncBatchStatus.checked / (syncBatchStatus.total || 1)) * 100)}%)
                                </p>
                            ) : (
                                <p className="text-sm text-brand-muted dark:text-dark-muted">
                                    Proses selesai pada {syncBatchStatus.completedAt ? new Date(syncBatchStatus.completedAt).toLocaleTimeString() : ''}. Total {syncBatchStatus.checked} diperiksa, {syncBatchStatus.updated} berhasil diperbarui.
                                </p>
                            )}

                            {/* Progress Bar */}
                            {syncBatchStatus.status === 'running' && (
                                <div className="w-full bg-brand-border dark:bg-dark-border/40 h-2.5 rounded-full overflow-hidden mt-3">
                                    <div 
                                        className="bg-brand-primary h-full transition-all duration-500 ease-out"
                                        style={{ width: `${(syncBatchStatus.checked / (syncBatchStatus.total || 1)) * 100}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowSyncBatchLogs(!showSyncBatchLogs)}
                                className="border-brand-primary/20 text-brand-primary hover:bg-brand-primary/5 dark:border-brand-primary/30 h-9"
                            >
                                {showSyncBatchLogs ? (
                                    <>
                                        <ChevronUp className="h-4 w-4 mr-2" />
                                        Sembunyikan Log
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4 mr-2" />
                                        Lihat Log
                                    </>
                                )}
                            </Button>

                            {syncBatchStatus.status === 'running' ? (
                                <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={handleCancelSyncBatch}
                                    className="bg-red-600 hover:bg-red-700 text-white h-9"
                                >
                                    Batal
                                </Button>
                            ) : (
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setIsSyncBatchDismissed(true)}
                                    className="h-9"
                                >
                                    Tutup
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Console Logs Box */}
                    {showSyncBatchLogs && (
                        <div className="mt-4 p-4 rounded-xl bg-gray-950 text-gray-200 dark:bg-black/40 border border-gray-800 font-mono text-xs max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-gray-800">
                            {syncBatchStatus.logs.length === 0 ? (
                                <p className="text-gray-500 italic">Belum ada log...</p>
                            ) : (
                                syncBatchStatus.logs.map((log, index) => {
                                    let textColor = 'text-gray-300'
                                    if (log.includes('✅')) textColor = 'text-emerald-400 font-medium'
                                    if (log.includes('⚠️')) textColor = 'text-amber-400 font-medium'
                                    if (log.includes('❌') || log.includes('Error')) textColor = 'text-red-400 font-semibold animate-pulse'
                                    if (log.includes('🎉')) textColor = 'text-brand-primary font-bold text-sm'
                                    
                                    return (
                                        <p key={index} className={`${textColor} border-b border-gray-900/40 pb-0.5 last:border-0`}>
                                            {log}
                                        </p>
                                    )
                                })
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Progress Banner Gambar Aktif */}
            {imageCheckStatus && imageCheckStatus.status !== 'idle' && !isImageDismissed && (
                <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                    imageCheckStatus.status === 'running' 
                        ? 'bg-blue-50/75 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40 backdrop-blur-md'
                        : imageCheckStatus.status === 'completed'
                        ? 'bg-emerald-50/75 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 backdrop-blur-md'
                        : 'bg-amber-50/75 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 backdrop-blur-md'
                }`}>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1 flex-1 w-full">
                            <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${
                                    imageCheckStatus.status === 'running' 
                                        ? 'bg-blue-500 animate-ping'
                                        : imageCheckStatus.status === 'completed'
                                        ? 'bg-emerald-500'
                                        : 'bg-amber-500'
                                }`} />
                                <h3 className="font-semibold text-brand-text dark:text-dark-text">
                                    {imageCheckStatus.status === 'running' 
                                        ? 'Sedang Memverifikasi Gambar Produk...' 
                                        : imageCheckStatus.status === 'completed'
                                        ? 'Verifikasi Gambar Produk Selesai!'
                                        : 'Verifikasi Gambar Dibatalkan'}
                                </h3>
                                {imageCheckStatus.deactivated > 0 && (
                                    <Badge variant="destructive" className="ml-2 animate-bounce">
                                        {imageCheckStatus.deactivated} Produk Dinonaktifkan (Gambar Mati)
                                    </Badge>
                                )}
                            </div>
                            
                            {imageCheckStatus.status === 'running' ? (
                                <p className="text-sm text-brand-muted dark:text-dark-muted">
                                    Memeriksa: <span className="font-medium text-brand-primary">{imageCheckStatus.checked}</span> dari <span className="font-medium">{imageCheckStatus.total}</span> produk ({Math.round((imageCheckStatus.checked / (imageCheckStatus.total || 1)) * 100)}%)
                                </p>
                            ) : (
                                <p className="text-sm text-brand-muted dark:text-dark-muted">
                                    Pemeriksaan gambar selesai pada {imageCheckStatus.completedAt ? new Date(imageCheckStatus.completedAt).toLocaleTimeString() : ''}. Total {imageCheckStatus.checked} diperiksa, {imageCheckStatus.deactivated} dinonaktifkan karena gambar mati.
                                </p>
                            )}

                            {/* Progress Bar */}
                            {imageCheckStatus.status === 'running' && (
                                <div className="w-full bg-brand-border dark:bg-dark-border/40 h-2.5 rounded-full overflow-hidden mt-3">
                                    <div 
                                        className="bg-brand-primary h-full transition-all duration-500 ease-out"
                                        style={{ width: `${(imageCheckStatus.checked / (imageCheckStatus.total || 1)) * 100}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowImageCheckLogs(!showImageCheckLogs)}
                                className="border-brand-primary/20 text-brand-primary hover:bg-brand-primary/5 dark:border-brand-primary/30 h-9"
                            >
                                {showImageCheckLogs ? (
                                    <>
                                        <ChevronUp className="h-4 w-4 mr-2" />
                                        Sembunyikan Log
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4 mr-2" />
                                        Lihat Log
                                    </>
                                )}
                            </Button>

                            {imageCheckStatus.status === 'running' ? (
                                <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={handleCancelImageCheck}
                                    className="bg-red-600 hover:bg-red-700 text-white h-9"
                                >
                                    Batal
                                </Button>
                            ) : (
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setIsImageDismissed(true)}
                                    className="h-9"
                                >
                                    Tutup
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Console Logs Box */}
                    {showImageCheckLogs && (
                        <div className="mt-4 p-4 rounded-xl bg-gray-950 text-gray-200 dark:bg-black/40 border border-gray-800 font-mono text-xs max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-gray-800">
                            {imageCheckStatus.logs.length === 0 ? (
                                <p className="text-gray-500 italic">Belum ada log...</p>
                            ) : (
                                imageCheckStatus.logs.map((log, index) => {
                                    let textColor = 'text-gray-300'
                                    if (log.includes('✅')) textColor = 'text-emerald-400 font-medium'
                                    if (log.includes('⚠️')) textColor = 'text-rose-400 font-medium'
                                    if (log.includes('❌') || log.includes('Error')) textColor = 'text-red-400 font-semibold'
                                    if (log.includes('🎉')) textColor = 'text-brand-primary font-bold text-sm'
                                    
                                    return (
                                        <p key={index} className={`${textColor} border-b border-gray-900/40 pb-0.5 last:border-0`}>
                                            {log}
                                        </p>
                                    )
                                })
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Progress Banner Tautan Shopee */}
            {checkStatus && checkStatus.status !== 'idle' && !isDismissed && (
                <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                    checkStatus.status === 'running' 
                        ? 'bg-blue-50/75 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40 backdrop-blur-md'
                        : checkStatus.status === 'completed'
                        ? 'bg-emerald-50/75 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 backdrop-blur-md'
                        : 'bg-amber-50/75 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 backdrop-blur-md'
                }`}>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1 flex-1 w-full">
                            <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${
                                    checkStatus.status === 'running' 
                                        ? 'bg-blue-500 animate-ping'
                                        : checkStatus.status === 'completed'
                                        ? 'bg-emerald-500'
                                        : 'bg-amber-500'
                                }`} />
                                <h3 className="font-semibold text-brand-text dark:text-dark-text">
                                    {checkStatus.status === 'running' 
                                        ? 'Sedang Memverifikasi Tautan Shopee...' 
                                        : checkStatus.status === 'completed'
                                        ? 'Verifikasi Tautan Shopee Selesai!'
                                        : 'Verifikasi Tautan Shopee Dibatalkan'}
                                </h3>
                                {checkStatus.deactivated > 0 && (
                                    <Badge variant="destructive" className="ml-2 animate-bounce">
                                        {checkStatus.deactivated} Produk Dinonaktifkan
                                    </Badge>
                                )}
                            </div>
                            
                            {checkStatus.status === 'running' ? (
                                <p className="text-sm text-brand-muted dark:text-dark-muted">
                                    Memeriksa: <span className="font-medium text-brand-primary">{checkStatus.checked}</span> dari <span className="font-medium">{checkStatus.total}</span> produk ({Math.round((checkStatus.checked / (checkStatus.total || 1)) * 100)}%)
                                </p>
                            ) : (
                                <p className="text-sm text-brand-muted dark:text-dark-muted">
                                    Pemeriksaan selesai pada {checkStatus.completedAt ? new Date(checkStatus.completedAt).toLocaleTimeString() : ''}. Total {checkStatus.checked} diperiksa, {checkStatus.deactivated} dinonaktifkan karena link mati.
                                </p>
                            )}

                            {/* Progress Bar */}
                            {checkStatus.status === 'running' && (
                                <div className="w-full bg-brand-border dark:bg-dark-border/40 h-2.5 rounded-full overflow-hidden mt-3">
                                    <div 
                                        className="bg-brand-primary h-full transition-all duration-500 ease-out"
                                        style={{ width: `${(checkStatus.checked / (checkStatus.total || 1)) * 100}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowCheckLogs(!showCheckLogs)}
                                className="border-brand-primary/20 text-brand-primary hover:bg-brand-primary/5 dark:border-brand-primary/30 h-9"
                            >
                                {showCheckLogs ? (
                                    <>
                                        <ChevronUp className="h-4 w-4 mr-2" />
                                        Sembunyikan Log
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4 mr-2" />
                                        Lihat Log
                                    </>
                                )}
                            </Button>

                            {checkStatus.status === 'running' ? (
                                <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={handleCancelCheck}
                                    className="bg-red-600 hover:bg-red-700 text-white h-9"
                                >
                                    Batal
                                </Button>
                            ) : (
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setIsDismissed(true)}
                                    className="h-9"
                                >
                                    Tutup
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Console Logs Box */}
                    {showCheckLogs && (
                        <div className="mt-4 p-4 rounded-xl bg-gray-950 text-gray-200 dark:bg-black/40 border border-gray-800 font-mono text-xs max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-gray-800">
                            {checkStatus.logs.length === 0 ? (
                                <p className="text-gray-500 italic">Belum ada log...</p>
                            ) : (
                                checkStatus.logs.map((log, index) => {
                                    let textColor = 'text-gray-300'
                                    if (log.includes('✅')) textColor = 'text-emerald-400 font-medium'
                                    if (log.includes('⚠️')) textColor = 'text-rose-400 font-medium'
                                    if (log.includes('❌') || log.includes('Error')) textColor = 'text-red-400 font-semibold animate-pulse'
                                    if (log.includes('🎉')) textColor = 'text-brand-primary font-bold text-sm'
                                    
                                    return (
                                        <p key={index} className={`${textColor} border-b border-gray-900/40 pb-0.5 last:border-0`}>
                                            {log}
                                        </p>
                                    )
                                })
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-brand-text dark:text-dark-text">
                        Manajemen Produk
                    </h1>
                    <Badge variant="secondary" className="text-sm">
                        {total} Produk
                    </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                disabled={checkStatus?.status === 'running' || imageCheckStatus?.status === 'running' || syncBatchStatus?.status === 'running'}
                                className="border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10 h-10 shrink-0"
                            >
                                <Settings className={`h-4 w-4 mr-2 text-brand-primary ${checkStatus?.status === 'running' || imageCheckStatus?.status === 'running' || syncBatchStatus?.status === 'running' ? 'animate-spin' : ''}`} />
                                Aksi Massal
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Pengecekan Tautan</DropdownMenuLabel>
                            <DropdownMenuItem onClick={handleStartCheck} className="cursor-pointer">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Cek Tautan Mati
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleStartImageCheck} className="cursor-pointer">
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Cek Gambar Mati
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Sinkronisasi Shopee</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleStartSyncBatch('data')} className="cursor-pointer">
                                <Database className="h-4 w-4 mr-2" />
                                Sync Data Semua Produk
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStartSyncBatch('image')} className="cursor-pointer">
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Sync Gambar Semua Produk
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStartSyncBatch('description')} className="cursor-pointer">
                                <AlignLeft className="h-4 w-4 mr-2" />
                                Sync Deskripsi Semua Produk
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        onClick={() => setCsvDialogOpen(true)}
                        className="border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10 h-10"
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Import CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setLinkDialogOpen(true)}
                        className="border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10 h-10"
                    >
                        <Sparkles className="h-4 w-4 mr-2 text-brand-primary animate-pulse" />
                        Tambah Produk Baru Menggunakan Link
                    </Button>
                    <Link href="/admin/products/new">
                        <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white h-10">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Produk Baru
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Toolbar Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
                    <Input
                        placeholder="Cari nama produk..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Kategori</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="true">Aktif</SelectItem>
                        <SelectItem value="false">Nonaktif</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={resetFilters} size="icon" className="shrink-0">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Product Table */}
            <div className="rounded-xl border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-brand-border dark:border-dark-border bg-brand-surface/50 dark:bg-dark-surface/50">
                            <th className="px-4 py-3 text-left font-medium text-brand-muted dark:text-dark-muted">Foto</th>
                            <th className="px-4 py-3 text-left font-medium text-brand-muted dark:text-dark-muted">Produk</th>
                            <th className="px-4 py-3 text-left font-medium text-brand-muted dark:text-dark-muted">Kategori</th>
                            <th className="px-4 py-3 text-left font-medium text-brand-muted dark:text-dark-muted">Harga</th>
                            <th className="px-4 py-3 text-left font-medium text-brand-muted dark:text-dark-muted">Badge</th>
                            <th className="px-4 py-3 text-left font-medium text-brand-muted dark:text-dark-muted">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-brand-muted dark:text-dark-muted">Views</th>
                            <th className="px-4 py-3 text-left font-medium text-brand-muted dark:text-dark-muted">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-brand-border/50 dark:border-dark-border/50">
                                    {Array.from({ length: 8 }).map((_, j) => (
                                        <td key={j} className="px-4 py-4">
                                            <div className="h-5 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-16 text-center text-brand-muted dark:text-dark-muted">
                                    Belum ada produk yang sesuai.
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr
                                    key={product.id}
                                    className="border-b border-brand-border/50 dark:border-dark-border/50 hover:bg-brand-surface/30 dark:hover:bg-dark-surface/30 transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                            {product.image ? (
                                                <Image
                                                    src={product.image}
                                                    alt={product.title}
                                                    fill
                                                    className="object-cover"
                                                    sizes="48px"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                                    No img
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-brand-text dark:text-dark-text">{product.title}</p>
                                        <p className="text-xs text-brand-muted dark:text-dark-muted">{product.slug}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-xs">
                                            {product.category.name}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-brand-text dark:text-dark-text">
                                        {formatRupiah(product.price)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {product.badge ? (
                                            <Badge className={badgeColors[product.badge] || 'bg-gray-100 text-gray-700'}>
                                                {product.badge}
                                            </Badge>
                                        ) : (
                                            <span className="text-brand-muted dark:text-dark-muted">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Switch
                                            checked={product.isActive}
                                            onCheckedChange={() => handleToggleActive(product)}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-brand-muted dark:text-dark-muted">
                                        {product.viewCount}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                title="Perbarui Harga dari Shopee"
                                                onClick={() => handleSync(product.id, 'price')}
                                                disabled={!!syncingState[product.id]}
                                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                            >
                                                {syncingState[product.id] === 'price' ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Coins className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                title="Perbarui Deskripsi & Gambar"
                                                onClick={() => handleSync(product.id, 'content')}
                                                disabled={!!syncingState[product.id]}
                                                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                            >
                                                {syncingState[product.id] === 'content' ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Sparkles className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Link href={`/admin/products/${product.id}/edit`}>
                                                <Button size="sm" variant="ghost">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                onClick={() => setDeleteTarget(product)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-brand-muted dark:text-dark-muted">
                        Menampilkan {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} dari {total} produk
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            Sebelumnya
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => Math.abs(p - page) < 2 || p === 1 || p === totalPages)
                            .map((p, idx, arr) => (
                                <span key={p} className="flex items-center gap-2">
                                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                                        <span className="px-1 text-brand-muted dark:text-dark-muted select-none">
                                            &hellip;
                                        </span>
                                    )}
                                    <Button
                                        variant={p === page ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setPage(p)}
                                        className={p === page ? 'bg-brand-primary text-white font-medium' : ''}
                                    >
                                        {p}
                                    </Button>
                                </span>
                            ))}
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            Berikutnya
                        </Button>
                    </div>
                </div>
            )}

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah kamu yakin ingin menghapus produk &ldquo;{deleteTarget?.title}&rdquo;?
                            Tindakan ini tidak bisa dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                'Ya, Hapus'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* CSV Import Dialog */}
            <CsvImportDialog
                open={csvDialogOpen}
                onOpenChange={setCsvDialogOpen}
                onImportComplete={fetchProducts}
            />

            {/* Link Import Dialog */}
            <LinkImportDialog
                open={linkDialogOpen}
                onOpenChange={setLinkDialogOpen}
            />
        </div>
    )
}
