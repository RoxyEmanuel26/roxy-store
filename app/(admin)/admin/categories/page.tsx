'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
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
import DataTable, { type ColumnDef } from '@/components/admin/DataTable'
import { toast } from 'sonner'
import slugify from 'slugify'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Category {
    id: string
    name: string
    slug: string
    createdAt: string
    _count: { products: number }
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [categoryName, setCategoryName] = useState('')
    const [saving, setSaving] = useState(false)

    // Delete dialog
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
    const [deleting, setDeleting] = useState(false)

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/categories')
            if (res.ok) {
                const data = await res.json()
                setCategories(data)
            }
        } catch {
            toast.error('Gagal memuat data kategori')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    const slugPreview = slugify(categoryName || '', { lower: true, locale: 'id', strict: true })

    const handleSave = async () => {
        if (!categoryName.trim()) {
            toast.error('Nama kategori tidak boleh kosong')
            return
        }

        setSaving(true)
        try {
            const url = editingCategory
                ? `/api/admin/categories/${editingCategory.id}`
                : '/api/admin/categories'
            const method = editingCategory ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: categoryName.trim() }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || 'Gagal menyimpan kategori')
                return
            }

            toast.success(
                editingCategory
                    ? 'Kategori berhasil diperbarui!'
                    : 'Kategori berhasil ditambahkan!'
            )

            setDialogOpen(false)
            setCategoryName('')
            setEditingCategory(null)
            fetchCategories()
        } catch {
            toast.error('Terjadi kesalahan')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return

        setDeleting(true)
        try {
            const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, {
                method: 'DELETE',
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || 'Gagal menghapus kategori')
                return
            }

            toast.success('Kategori berhasil dihapus!')
            setDeleteTarget(null)
            fetchCategories()
        } catch {
            toast.error('Terjadi kesalahan')
        } finally {
            setDeleting(false)
        }
    }

    const openEdit = (cat: Category) => {
        setEditingCategory(cat)
        setCategoryName(cat.name)
        setDialogOpen(true)
    }

    const openAdd = () => {
        setEditingCategory(null)
        setCategoryName('')
        setDialogOpen(true)
    }

    const columns: ColumnDef<Category>[] = [
        {
            header: 'No',
            cell: (_, i: number) => (
                <span className="font-medium text-brand-muted dark:text-dark-muted">{(i ?? 0) + 1}</span>
            ),
            className: 'w-[60px]',
        },
        {
            header: 'Nama Kategori',
            cell: (item) => (
                <span className="font-medium text-brand-text dark:text-dark-text">
                    {item.name}
                </span>
            ),
        },
        {
            header: 'Slug',
            cell: (item) => (
                <code className="text-xs bg-brand-surface dark:bg-dark-surface px-2 py-1 rounded">
                    {item.slug}
                </code>
            ),
        },
        {
            header: 'Jumlah Produk',
            cell: (item) => (
                <span className="text-brand-muted dark:text-dark-muted">
                    {item._count.products} produk
                </span>
            ),
        },
        {
            header: 'Tanggal Dibuat',
            cell: (item) => (
                <span className="text-brand-muted dark:text-dark-muted text-sm">
                    {format(new Date(item.createdAt), 'd MMM yyyy', { locale: localeId })}
                </span>
            ),
        },
        {
            header: 'Aksi',
            cell: (item) => (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => setDeleteTarget(item)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
            className: 'w-[100px]',
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-brand-text dark:text-dark-text">
                    Manajemen Kategori
                </h1>
                <Button onClick={openAdd} className="bg-brand-primary hover:bg-brand-primary/90 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Kategori Baru
                </Button>
            </div>

            {/* Table */}
            <DataTable
                data={categories}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="Belum ada kategori"
            />

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Kategori</Label>
                            <Input
                                id="name"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                placeholder="Contoh: Gantungan Kunci"
                                autoFocus
                            />
                            {categoryName && (
                                <p className="text-xs text-brand-muted dark:text-dark-muted">
                                    Slug:{' '}
                                    <code className="bg-brand-surface dark:bg-dark-surface px-1.5 py-0.5 rounded">
                                        {slugPreview}
                                    </code>
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-brand-primary hover:bg-brand-primary/90 text-white"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                'Simpan Kategori'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete AlertDialog */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah kamu yakin ingin menghapus kategori &ldquo;{deleteTarget?.name}&rdquo;?
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
        </div>
    )
}
