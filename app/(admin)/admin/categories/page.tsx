'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Loader2, FolderTree } from 'lucide-react'
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
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
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
import ImageUpload from '@/components/admin/ImageUpload'
import { toast } from 'sonner'
import slugify from 'slugify'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Category {
    id: string
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    createdAt: string
    _count: { products: number }
}

interface Subcategory {
    id: string
    name: string
    slug: string
    description?: string | null
    categoryId: string
    _count?: { products: number }
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [categoryName, setCategoryName] = useState('')
    const [categoryDescription, setCategoryDescription] = useState('')
    const [categoryIcon, setCategoryIcon] = useState('')
    const [saving, setSaving] = useState(false)

    // Delete dialog
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Sub-category state
    const [allSubcategories, setAllSubcategories] = useState<Subcategory[]>([])
    const [activeSubCategoryCategory, setActiveSubCategoryCategory] = useState<Category | null>(null)
    const [subName, setSubName] = useState('')
    const [subDescription, setSubDescription] = useState('')
    const [editingSubCategory, setEditingSubCategory] = useState<Subcategory | null>(null)
    const [subSaving, setSubSaving] = useState(false)
    const [subLoading, setSubLoading] = useState(false)
    const [subDeletingId, setSubDeletingId] = useState<string | null>(null)

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/categories', {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' },
            })
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

    const fetchSubcategories = useCallback(async () => {
        setSubLoading(true)
        try {
            const res = await fetch('/api/admin/subcategories', {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' },
            })
            if (res.ok) {
                const data = await res.json()
                setAllSubcategories(data)
            }
        } catch {
            toast.error('Gagal memuat data sub-kategori')
        } finally {
            setSubLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCategories()
        fetchSubcategories()
    }, [fetchCategories, fetchSubcategories])

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
                body: JSON.stringify({
                    name: categoryName.trim(),
                    description: categoryDescription.trim() || '',
                    icon: categoryIcon.trim() || '',
                }),
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
            setCategoryDescription('')
            setCategoryIcon('')
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

    const handleSaveSubcategory = async () => {
        if (!activeSubCategoryCategory) return

        if (!subName.trim()) {
            toast.error('Nama sub-kategori tidak boleh kosong')
            return
        }

        setSubSaving(true)
        try {
            const url = editingSubCategory
                ? `/api/admin/subcategories/${editingSubCategory.id}`
                : '/api/admin/subcategories'
            const method = editingSubCategory ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: subName.trim(),
                    categoryId: activeSubCategoryCategory.id,
                    description: subDescription.trim() || '',
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || 'Gagal menyimpan sub-kategori')
                return
            }

            toast.success(
                editingSubCategory
                    ? 'Sub-kategori berhasil diperbarui!'
                    : 'Sub-kategori berhasil ditambahkan!'
            )

            setSubName('')
            setSubDescription('')
            setEditingSubCategory(null)
            fetchSubcategories()
            fetchCategories()
        } catch {
            toast.error('Terjadi kesalahan')
        } finally {
            setSubSaving(false)
        }
    }

    const handleDeleteSubcategory = async (subId: string) => {
        setSubDeletingId(subId)
        try {
            const res = await fetch(`/api/admin/subcategories/${subId}`, {
                method: 'DELETE',
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || 'Gagal menghapus sub-kategori')
                return
            }

            toast.success('Sub-kategori berhasil dihapus!')
            fetchSubcategories()
            fetchCategories()
        } catch {
            toast.error('Terjadi kesalahan')
        } finally {
            setSubDeletingId(null)
        }
    }


    const openEdit = (cat: Category) => {
        setEditingCategory(cat)
        setCategoryName(cat.name)
        setCategoryDescription(cat.description || '')
        setCategoryIcon(cat.icon || '')
        setDialogOpen(true)
    }

    const openAdd = () => {
        setEditingCategory(null)
        setCategoryName('')
        setCategoryDescription('')
        setCategoryIcon('')
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
                <div className="flex items-center gap-3">
                    {item.icon && (
                        item.icon.startsWith('http') ? (
                            <img src={item.icon} alt="" className="w-10 h-10 object-contain rounded-md bg-brand-surface/50 dark:bg-dark-surface/50 p-1" />
                        ) : (
                            <span className="text-2xl">{item.icon}</span>
                        )
                    )}
                    <div>
                        <span className="font-medium text-brand-text dark:text-dark-text">
                            {item.name}
                        </span>
                        {item.description && (
                            <p className="text-xs text-brand-muted dark:text-dark-muted line-clamp-1 mt-0.5">
                                {item.description}
                            </p>
                        )}
                    </div>
                </div>
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
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-brand-muted hover:text-brand-text hover:bg-brand-surface dark:hover:bg-dark-surface/50"
                        title="Kelola Sub-Kategori"
                        onClick={() => {
                            setActiveSubCategoryCategory(item)
                            setSubName('')
                            setSubDescription('')
                            setEditingSubCategory(null)
                        }}
                    >
                        <FolderTree className="h-4 w-4 text-brand-primary" />
                    </Button>
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
            className: 'w-[150px]',
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
                                placeholder="Contoh: Skincare & Kecantikan"
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

                        <div className="space-y-2">
                            <Label>Icon Kategori</Label>
                            <div className="space-y-4">
                                <ImageUpload
                                    value={categoryIcon.startsWith('http') ? categoryIcon : ''}
                                    onChange={(url) => setCategoryIcon(url)}
                                    folder="Roxy-lay/categories"
                                    aspectRatio="1:1"
                                    maxSizeMB={2}
                                />
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-brand-border dark:bg-dark-border" />
                                    <span className="text-xs text-brand-muted dark:text-dark-muted font-medium">ATAU GUNAKAN EMOJI</span>
                                    <div className="h-px flex-1 bg-brand-border dark:bg-dark-border" />
                                </div>
                                <Input
                                    value={!categoryIcon.startsWith('http') ? categoryIcon : ''}
                                    onChange={(e) => setCategoryIcon(e.target.value)}
                                    placeholder="Contoh: 💄 👗"
                                    className="text-xl text-center"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <textarea
                                id="description"
                                value={categoryDescription}
                                onChange={(e) => setCategoryDescription(e.target.value)}
                                placeholder="Deskripsi singkat untuk kategori ini..."
                                rows={3}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <p className="text-xs text-brand-muted dark:text-dark-muted">
                                Opsional, maksimal 500 karakter
                            </p>
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

            {/* Manage Subcategories Sheet */}
            <Sheet
                open={!!activeSubCategoryCategory}
                onOpenChange={(open) => {
                    if (!open) {
                        setActiveSubCategoryCategory(null)
                        setSubName('')
                        setSubDescription('')
                        setEditingSubCategory(null)
                    }
                }}
            >
                <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto space-y-6">
                    <SheetHeader>
                        <SheetTitle className="text-xl font-bold text-brand-text dark:text-dark-text">
                            Kelola Sub-Kategori
                        </SheetTitle>
                        <SheetDescription className="text-brand-muted dark:text-dark-muted">
                            Kategori Utama: <span className="font-semibold text-brand-text dark:text-dark-text">{activeSubCategoryCategory?.name}</span>
                        </SheetDescription>
                    </SheetHeader>

                    {/* Subcategory Form */}
                    <div className="bg-brand-surface dark:bg-dark-surface p-4 rounded-lg border border-brand-border dark:border-dark-border space-y-4">
                        <h3 className="font-semibold text-sm text-brand-text dark:text-dark-text">
                            {editingSubCategory ? '🖋️ Edit Sub-Kategori' : '✨ Tambah Sub-Kategori Baru'}
                        </h3>
                        <div className="space-y-2">
                            <Label htmlFor="subName">Nama Sub-Kategori</Label>
                            <Input
                                id="subName"
                                value={subName}
                                onChange={(e) => setSubName(e.target.value)}
                                placeholder="Contoh: Gantungan Kunci Manik-Manik"
                            />
                            {subName && (
                                <p className="text-xs text-brand-muted dark:text-dark-muted">
                                    Slug:{' '}
                                    <code className="bg-white dark:bg-black/20 px-1.5 py-0.5 rounded">
                                        {slugify(subName, { lower: true, locale: 'id', strict: true })}
                                    </code>
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subDescription">Deskripsi (Opsional)</Label>
                            <textarea
                                id="subDescription"
                                value={subDescription}
                                onChange={(e) => setSubDescription(e.target.value)}
                                placeholder="Deskripsi singkat untuk sub-kategori ini..."
                                rows={2}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={handleSaveSubcategory}
                                disabled={subSaving}
                                className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white"
                            >
                                {subSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : editingSubCategory ? (
                                    'Simpan Perubahan'
                                ) : (
                                    'Tambah Sub-Kategori'
                                )}
                            </Button>
                            {editingSubCategory && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setEditingSubCategory(null)
                                        setSubName('')
                                        setSubDescription('')
                                    }}
                                >
                                    Batal
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Subcategories List */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-brand-text dark:text-dark-text flex items-center justify-between">
                            <span>Daftar Sub-Kategori</span>
                            <span className="text-xs font-normal text-brand-muted dark:text-dark-muted">
                                {allSubcategories.filter((sub) => sub.categoryId === activeSubCategoryCategory?.id).length} sub-kategori
                            </span>
                        </h3>

                        {subLoading ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-brand-muted" />
                            </div>
                        ) : allSubcategories.filter((sub) => sub.categoryId === activeSubCategoryCategory?.id).length === 0 ? (
                            <div className="text-center py-8 border border-dashed rounded-lg border-brand-border dark:border-dark-border text-brand-muted dark:text-dark-muted text-sm">
                                Belum ada sub-kategori untuk kategori ini.
                            </div>
                        ) : (
                            <div className="border border-brand-border dark:border-dark-border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-brand-surface dark:bg-dark-surface border-b border-brand-border dark:border-dark-border text-brand-text dark:text-dark-text font-medium text-xs">
                                        <tr>
                                            <th className="px-3 py-2">Nama</th>
                                            <th className="px-3 py-2 w-[80px] text-center">Produk</th>
                                            <th className="px-3 py-2 w-[80px] text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-border dark:divide-dark-border">
                                        {allSubcategories
                                            .filter((sub) => sub.categoryId === activeSubCategoryCategory?.id)
                                            .map((sub) => (
                                                <tr key={sub.id} className="hover:bg-brand-surface/30 dark:hover:bg-dark-surface/10">
                                                    <td className="px-3 py-2">
                                                        <span className="font-medium text-brand-text dark:text-dark-text block">
                                                            {sub.name}
                                                        </span>
                                                        {sub.description && (
                                                            <span className="text-xs text-brand-muted dark:text-dark-muted block mt-0.5 line-clamp-1">
                                                                {sub.description}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-brand-muted dark:text-dark-muted text-xs">
                                                        {sub._count?.products || 0}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 w-7 p-0"
                                                                onClick={() => {
                                                                    setEditingSubCategory(sub)
                                                                    setSubName(sub.name)
                                                                    setSubDescription(sub.description || '')
                                                                }}
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                disabled={subDeletingId === sub.id}
                                                                onClick={() => handleDeleteSubcategory(sub.id)}
                                                            >
                                                                {subDeletingId === sub.id ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-3 w-3" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
