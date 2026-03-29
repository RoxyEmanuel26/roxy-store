'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Search, X, Pencil, Trash2, Loader2, FileSpreadsheet } from 'lucide-react'
import CsvImportDialog from '@/components/admin/CsvImportDialog'
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

    // CSV Import
    const [csvDialogOpen, setCsvDialogOpen] = useState(false)

    // Delete
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
    const [deleting, setDeleting] = useState(false)

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

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

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
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setCsvDialogOpen(true)}
                        className="border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10"
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Import CSV
                    </Button>
                    <Link href="/admin/products/new">
                        <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white">
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
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <Button
                                key={p}
                                variant={p === page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPage(p)}
                                className={p === page ? 'bg-brand-primary text-white' : ''}
                            >
                                {p}
                            </Button>
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
        </div>
    )
}
