'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ProductSchema } from '@/lib/validations'
import { z } from 'zod'
import slugify from 'slugify'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, ExternalLink, Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import ImageUpload from '@/components/admin/ImageUpload'
import { toast } from 'sonner'

type ProductValues = z.infer<typeof ProductSchema>

interface Category {
    id: string
    name: string
}

interface ProductFormProps {
    initialData?: ProductValues & { id?: string }
    isEdit?: boolean
}

export default function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
    const router = useRouter()
    const [categories, setCategories] = useState<Category[]>([])
    const [saving, setSaving] = useState(false)
    const [additionalImages, setAdditionalImages] = useState<string[]>(
        initialData?.images && initialData.images.length > 0
            ? initialData.images
            : ['']
    )

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ProductValues>({
        resolver: zodResolver(ProductSchema) as any,
        defaultValues: {
            title: initialData?.title || '',
            slug: initialData?.slug || '',
            description: initialData?.description || '',
            price: initialData?.price || 0,
            image: initialData?.image || '',
            images: initialData?.images || [],
            shopeeUrl: initialData?.shopeeUrl || '',
            tokopediaUrl: initialData?.tokopediaUrl || '',
            categoryId: initialData?.categoryId || '',
            badge: initialData?.badge || null,
            isActive: initialData?.isActive ?? true,
        } as ProductValues,
    })

    const title = watch('title')
    const image = watch('image')
    const badge = watch('badge')
    const isActive = watch('isActive')
    const slug = slugify(title || '', { lower: true, locale: 'id', strict: true })

    // Sync slug into form value so Zod validation passes
    useEffect(() => {
        if (slug) {
            setValue('slug', slug)
        }
    }, [slug, setValue])

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/categories')
            if (res.ok) setCategories(await res.json())
        } catch { /* ignore */ }
    }, [])

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    // Sync additional images to form
    useEffect(() => {
        const filtered = additionalImages.filter(Boolean)
        setValue('images', filtered)
    }, [additionalImages, setValue])

    const onSubmit = async (data: ProductValues) => {
        setSaving(true)
        try {
            const url = isEdit
                ? `/api/admin/products/${initialData?.id}`
                : '/api/admin/products'
            const method = isEdit ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            const result = await res.json()

            if (!res.ok) {
                toast.error(result.error || 'Gagal menyimpan produk')
                return
            }

            toast.success(
                isEdit ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!'
            )

            setTimeout(() => {
                router.push('/admin/products')
            }, 1500)
        } catch {
            toast.error('Terjadi kesalahan')
        } finally {
            setSaving(false)
        }
    }

    const badgeOptions = [
        { value: '', label: 'Tidak Ada Badge' },
        { value: 'NEW', label: '🆕 NEW - Produk Baru' },
        { value: 'HOT', label: '🔥 HOT - Produk Populer' },
        { value: 'BEST SELLER', label: '⭐ BEST SELLER - Terlaris' },
    ]

    return (
        <form onSubmit={handleSubmit(onSubmit, (formErrors) => {
            // Show validation errors as toast
            const firstError = Object.values(formErrors)[0]
            if (firstError?.message) {
                toast.error(String(firstError.message))
            } else {
                toast.error('Mohon lengkapi semua field yang wajib diisi')
            }
        })} className="space-y-8 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <Link href="/admin/products">
                    <Button type="button" variant="ghost" className="gap-2 hover:bg-brand-surface/50 dark:hover:bg-dark-surface/50">
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Daftar Produk
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* LEFT COLUMN - 60% */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Card: Informasi Produk */}
                    <div className="rounded-2xl border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm hover:shadow-md transition-shadow p-8 space-y-6">
                        <h3 className="text-xl font-bold text-brand-text dark:text-dark-text border-b border-brand-border/50 dark:border-dark-border/50 pb-3">
                            Informasi Produk
                        </h3>

                        {/* Judul Produk */}
                        <div className="space-y-2.5">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="title" className="text-sm font-semibold">Judul Produk *</Label>
                                <span className="text-xs text-brand-muted dark:text-dark-muted font-medium">
                                    {(title || '').length}/100
                                </span>
                            </div>
                            <Input
                                id="title"
                                maxLength={100}
                                placeholder="Contoh: Gantungan Kunci Hello Kitty Pink"
                                {...register('title')}
                                className="h-11"
                            />
                            {errors.title && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                                    {errors.title.message}
                                </p>
                            )}
                        </div>

                        {/* Slug URL */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Slug URL</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        /* slug is auto-generated */
                                    }}
                                    className="h-7 text-xs hover:bg-brand-surface/50 dark:hover:bg-dark-surface/50"
                                >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Regenerate
                                </Button>
                            </div>
                            <div className="flex items-center rounded-lg border border-brand-border dark:border-dark-border bg-brand-surface/30 dark:bg-dark-surface/30 overflow-hidden">
                                <span className="px-4 py-2.5 text-sm text-brand-muted dark:text-dark-muted whitespace-nowrap bg-brand-surface/50 dark:bg-dark-surface/50 border-r border-brand-border dark:border-dark-border">
                                    www.roxystore.web.id/produk/
                                </span>
                                <Input
                                    value={slug}
                                    readOnly
                                    className="border-0 bg-transparent h-11 focus-visible:ring-0"
                                />
                            </div>
                            <p className="text-xs text-brand-muted dark:text-dark-muted flex items-center gap-1.5">
                                <span className="inline-block w-1 h-1 rounded-full bg-brand-muted/50"></span>
                                URL yang akan digunakan untuk halaman produk
                            </p>
                        </div>

                        {/* Deskripsi */}
                        <div className="space-y-2.5">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="description" className="text-sm font-semibold">Deskripsi Produk *</Label>
                                <span className="text-xs text-brand-muted dark:text-dark-muted font-medium">
                                    {(watch('description') || '').length} karakter
                                </span>
                            </div>
                            <Textarea
                                id="description"
                                rows={6}
                                placeholder="Jelaskan produk secara detail: bahan, ukuran, warna yang tersedia, dll."
                                className="resize-y min-h-[150px]"
                                {...register('description')}
                            />
                            {errors.description && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                                    {errors.description.message}
                                </p>
                            )}
                        </div>

                        {/* Harga */}
                        <div className="space-y-2.5">
                            <Label htmlFor="price" className="text-sm font-semibold">Harga *</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-brand-muted dark:text-dark-muted">
                                    Rp
                                </span>
                                <Input
                                    id="price"
                                    type="number"
                                    min={0}
                                    placeholder="45000"
                                    className="pl-12 h-11"
                                    {...register('price', { valueAsNumber: true })}
                                />
                            </div>
                            <p className="text-xs text-brand-muted dark:text-dark-muted flex items-center gap-1.5">
                                <span className="inline-block w-1 h-1 rounded-full bg-brand-muted/50"></span>
                                Masukkan harga dalam Rupiah (angka saja)
                            </p>
                            {errors.price && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                                    {errors.price.message}
                                </p>
                            )}
                        </div>

                        {/* Kategori */}
                        <div className="space-y-2.5">
                            <Label className="text-sm font-semibold">Kategori *</Label>
                            <Select
                                value={watch('categoryId')}
                                onValueChange={(v) => setValue('categoryId', v)}
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="-- Pilih Kategori --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <a
                                href="/admin/categories"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:underline font-medium"
                            >
                                Belum ada kategori yang sesuai? Tambah kategori baru
                                <ExternalLink className="h-3 w-3" />
                            </a>
                            {errors.categoryId && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                                    {errors.categoryId.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - 40% */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Card: Foto Produk */}
                    <div className="rounded-2xl border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm hover:shadow-md transition-shadow p-8 space-y-6">
                        <h3 className="text-xl font-bold text-brand-text dark:text-dark-text border-b border-brand-border/50 dark:border-dark-border/50 pb-3">
                            Foto Produk
                        </h3>

                        <div className="space-y-3">
                            <ImageUpload
                                value={image || ''}
                                onChange={(url) => setValue('image', url)}
                                label="Foto Utama *"
                                aspectRatio="1:1"
                            />
                            {errors.image && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                                    {errors.image.message}
                                </p>
                            )}
                        </div>

                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-semibold text-brand-text dark:text-dark-text">
                                    Foto Tambahan <span className="text-brand-muted dark:text-dark-muted font-normal">({additionalImages.filter(Boolean).length}/20)</span>
                                </p>
                                {additionalImages.length < 20 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAdditionalImages([...additionalImages, ''])}
                                        className="h-8 text-xs gap-1.5 hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Tambah Foto
                                    </Button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {additionalImages.map((img, i) => (
                                    <div key={i} className="relative w-full group">
                                        <ImageUpload
                                            value={img}
                                            onChange={(url) => {
                                                const newImages = [...additionalImages]
                                                newImages[i] = url
                                                setAdditionalImages(newImages)
                                            }}
                                            aspectRatio="1:1"
                                        />
                                        {additionalImages.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = additionalImages.filter((_, idx) => idx !== i)
                                                    setAdditionalImages(newImages.length > 0 ? newImages : [''])
                                                }}
                                                className="absolute -top-2 -right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                                                title="Hapus foto"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Card: Link Marketplace */}
                    <div className="rounded-2xl border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm hover:shadow-md transition-shadow p-8 space-y-6">
                        <h3 className="text-xl font-bold text-brand-text dark:text-dark-text border-b border-brand-border/50 dark:border-dark-border/50 pb-3">
                            Link Marketplace
                        </h3>

                        <div className="space-y-2.5">
                            <Label htmlFor="shopeeUrl" className="text-sm font-semibold">Link Shopee</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="shopeeUrl"
                                    placeholder="https://shopee.co.id/..."
                                    {...register('shopeeUrl')}
                                    className="flex-1 h-11"
                                />
                                {watch('shopeeUrl') && (
                                    <a href={watch('shopeeUrl')} target="_blank" rel="noopener noreferrer">
                                        <Button type="button" variant="outline" size="sm" className="shrink-0 h-11 hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary">
                                            Test
                                        </Button>
                                    </a>
                                )}
                            </div>
                            {errors.shopeeUrl && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                                    {errors.shopeeUrl.message}
                                </p>
                            )}
                            <p className="text-xs text-brand-muted dark:text-dark-muted flex items-center gap-1.5">
                                <span className="inline-block w-1 h-1 rounded-full bg-brand-muted/50"></span>
                                Kosongkan jika tidak ingin menampilkan tombol Shopee
                            </p>
                        </div>

                        <div className="space-y-2.5">
                            <Label htmlFor="tokopediaUrl" className="text-sm font-semibold">Link Tokopedia</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="tokopediaUrl"
                                    placeholder="https://www.tokopedia.com/..."
                                    {...register('tokopediaUrl')}
                                    className="flex-1 h-11"
                                />
                                {watch('tokopediaUrl') && (
                                    <a href={watch('tokopediaUrl')} target="_blank" rel="noopener noreferrer">
                                        <Button type="button" variant="outline" size="sm" className="shrink-0 h-11 hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary">
                                            Test
                                        </Button>
                                    </a>
                                )}
                            </div>
                            {errors.tokopediaUrl && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                                    {errors.tokopediaUrl.message}
                                </p>
                            )}
                            <p className="text-xs text-brand-muted dark:text-dark-muted flex items-center gap-1.5">
                                <span className="inline-block w-1 h-1 rounded-full bg-brand-muted/50"></span>
                                Kosongkan jika tidak ingin menampilkan tombol Tokopedia
                            </p>
                        </div>
                    </div>

                    {/* Card: Pengaturan Produk */}
                    <div className="rounded-2xl border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm hover:shadow-md transition-shadow p-8 space-y-6">
                        <h3 className="text-xl font-bold text-brand-text dark:text-dark-text border-b border-brand-border/50 dark:border-dark-border/50 pb-3">
                            Pengaturan Produk
                        </h3>

                        <div className="space-y-2.5">
                            <Label className="text-sm font-semibold">Badge Produk</Label>
                            <Select
                                value={badge || 'none'}
                                onValueChange={(v) => setValue('badge', v === 'none' ? null : (v as "NEW" | "HOT" | "BEST SELLER"))}
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Tidak Ada Badge" />
                                </SelectTrigger>
                                <SelectContent>
                                    {badgeOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value || 'none'}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {badge && (
                                <div className="mt-3 p-3 rounded-lg bg-brand-surface/50 dark:bg-dark-surface/50 border border-brand-border/50 dark:border-dark-border/50">
                                    <p className="text-xs text-brand-muted dark:text-dark-muted mb-2">Preview:</p>
                                    <span className="inline-block rounded-full bg-brand-primary/10 text-brand-primary px-3 py-1.5 text-xs font-semibold">
                                        {badge}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-brand-surface/30 dark:bg-dark-surface/30 border border-brand-border/50 dark:border-dark-border/50">
                            <div>
                                <Label className="text-sm font-semibold">Status Produk</Label>
                                <p className="text-xs text-brand-muted dark:text-dark-muted mt-1">
                                    Produk nonaktif tidak tampil di halaman publik
                                </p>
                            </div>
                            <Switch
                                checked={isActive}
                                onCheckedChange={(v) => setValue('isActive', v)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit Buttons */}
            <div className="sticky bottom-0 -mb-4 md:-mb-6 -mx-4 md:-mx-6 px-6 md:px-8 py-5 mt-8 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md border-t border-brand-border dark:border-dark-border shadow-[0_-4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.3)] flex items-center justify-between gap-4 z-20">
                <p className="text-sm text-brand-muted dark:text-dark-muted hidden md:block">
                    <span className="font-medium text-brand-text dark:text-dark-text">*</span> Wajib diisi
                </p>
                <div className="flex items-center gap-3 ml-auto">
                    <Link href="/admin/products">
                        <Button type="button" variant="outline" className="h-11 px-6 hover:bg-brand-surface/50 dark:hover:bg-dark-surface/50">
                            Batal
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={saving}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white h-11 px-8 min-w-[180px] font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Menyimpan...
                            </>
                        ) : isEdit ? (
                            'Simpan Perubahan'
                        ) : (
                            'Simpan Produk'
                        )}
                    </Button>
                </div>
            </div>
        </form>
    )
}
