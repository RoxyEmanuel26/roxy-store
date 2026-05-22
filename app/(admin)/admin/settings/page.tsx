'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SettingsSchema } from '@/lib/validations'
import { z } from 'zod'
import { Loader2, Save, ArrowUp, ArrowDown, Trash2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ImageUpload from '@/components/admin/ImageUpload'
import { toast } from 'sonner'

type SettingsValues = z.infer<typeof SettingsSchema>

export default function AdminSettingsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isDirty },
    } = useForm<SettingsValues>({
        resolver: zodResolver(SettingsSchema),
        defaultValues: {
            tagline: '',
            logo_url: '',
            hero_title: '',
            hero_subtitle: '',
            hero_image: '',
            about_text: '',
            wa_number: '',
            telegram_channel_url: '',
            home_banners: [],
        },
    })

    // Watch image URLs for ImageUpload components
    const logo_url = watch('logo_url')
    const home_banners = watch('home_banners') || []

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/settings')
            if (res.ok) {
                const data = await res.json()
                reset({
                    tagline: data.tagline || '',
                    logo_url: data.logo_url || '',
                    hero_title: data.hero_title || '',
                    hero_subtitle: data.hero_subtitle || '',
                    hero_image: data.hero_image || '',
                    about_text: data.about_text || '',
                    wa_number: data.wa_number || '',
                    telegram_channel_url: data.telegram_channel_url || '',
                    home_banners: data.home_banners || [],
                })
            }
        } catch {
            toast.error('Gagal memuat pengaturan')
        } finally {
            setIsLoading(false)
        }
    }, [reset])

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    const onSubmit = async (data: SettingsValues) => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const result = await res.json()
                toast.error(result.error || 'Gagal menyimpan pengaturan')
                return
            }

            const result = await res.json()
            reset(result) // Reset with new data to clear isDirty state
            toast.success('Pengaturan berhasil disimpan!')
        } catch {
            toast.error('Terjadi kesalahan')
        } finally {
            setSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                    <p className="text-sm text-brand-muted dark:text-dark-muted">
                        Memuat pengaturan...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text dark:text-dark-text">
                        Pengaturan Website
                    </h1>
                    <p className="text-sm text-brand-muted dark:text-dark-muted mt-1">
                        Kelola tampilan dan informasi utama website Anda
                    </p>
                </div>
                <Button
                    onClick={handleSubmit(onSubmit)}
                    disabled={saving || !isDirty}
                    className="bg-brand-primary hover:bg-brand-primary/90 text-white w-full sm:w-auto"
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Simpan Perubahan
                        </>
                    )}
                </Button>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-brand-surface/50 dark:bg-dark-surface/50 p-1">
                    <TabsTrigger value="general" className="data-[state=active]:bg-white data-[state=active]:dark:bg-dark-surface data-[state=active]:shadow-sm">
                        Umum & SEO
                    </TabsTrigger>
                    <TabsTrigger value="hero" className="data-[state=active]:bg-white data-[state=active]:dark:bg-dark-surface data-[state=active]:shadow-sm">
                        Banner Home
                    </TabsTrigger>
                    <TabsTrigger value="social" className="data-[state=active]:bg-white data-[state=active]:dark:bg-dark-surface data-[state=active]:shadow-sm">
                        Kontak & Sosial
                    </TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* TAB 1: UMUM & SEO */}
                    <TabsContent value="general" className="space-y-6">
                        <div className="rounded-xl border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface p-6 space-y-5">
                            <h3 className="text-lg font-semibold text-brand-text dark:text-dark-text border-b border-brand-border dark:border-dark-border pb-3">
                                Informasi Dasar
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="tagline">Tagline Website</Label>
                                    <Input
                                        id="tagline"
                                        placeholder="Roxy Store Accessories"
                                        {...register('tagline')}
                                    />
                                    {errors.tagline && (
                                        <p className="text-xs text-red-500">{errors.tagline.message}</p>
                                    )}
                                    <p className="text-xs text-brand-muted dark:text-dark-muted">
                                        Digunakan untuk judul utama (Title Tag).
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="about_text">Deskripsi Website (SEO)</Label>
                                    <Textarea
                                        id="about_text"
                                        rows={3}
                                        placeholder="Produk premium dengan pilihan terbaik..."
                                        className="resize-y"
                                        {...register('about_text')}
                                    />
                                    {errors.about_text && (
                                        <p className="text-xs text-red-500">{errors.about_text.message}</p>
                                    )}
                                    <p className="text-xs text-brand-muted dark:text-dark-muted">
                                        Penjelasan singkat tentang toko untuk pencarian Google.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label>Logo Website</Label>
                                <div className="max-w-md">
                                    <ImageUpload
                                        value={logo_url || ''}
                                        onChange={(url) => setValue('logo_url', url, { shouldDirty: true })}
                                        folder="Roxy-Store/settings"
                                        aspectRatio="1:1"
                                    />
                                </div>
                                {errors.logo_url && (
                                    <p className="text-xs text-red-500">{errors.logo_url.message}</p>
                                )}
                                <p className="text-xs text-brand-muted dark:text-dark-muted">
                                    Disarankan format PNG transparan dengan resolusi 512x512px.
                                </p>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB 2: BANNER HOME */}
                    <TabsContent value="hero" className="space-y-6">
                        <div className="rounded-xl border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface p-6 space-y-5">
                            <h3 className="text-lg font-semibold text-brand-text dark:text-dark-text border-b border-brand-border dark:border-dark-border pb-3">
                                Banner Halaman Utama (Home Banner Carousel)
                            </h3>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <Label className="text-sm font-semibold">Daftar Banner Aktif</Label>
                                    
                                    {home_banners.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-brand-border dark:border-dark-border rounded-xl bg-brand-surface/30 dark:bg-dark-surface/10 text-center">
                                            <ImageIcon className="h-10 w-10 text-brand-muted dark:text-dark-muted mb-2" />
                                            <p className="text-sm font-medium text-brand-text dark:text-dark-text">Belum ada banner terunggah</p>
                                            <p className="text-xs text-brand-muted dark:text-dark-muted mt-0.5">Unggah gambar baru di bawah untuk mulai menambahkan banner.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {home_banners.map((banner: any, index: number) => {
                                                const isObj = banner && typeof banner === 'object';
                                                const bannerUrl = isObj ? banner.url : banner;
                                                const bannerLink = isObj ? (banner.link || '') : '';

                                                return (
                                                    <div 
                                                        key={`${bannerUrl}-${index}`}
                                                        className="flex flex-col md:flex-row md:items-center gap-4 p-4 border border-brand-border dark:border-dark-border rounded-xl bg-white dark:bg-dark-surface/50 hover:shadow-sm transition-all"
                                                    >
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold shrink-0">
                                                                {index + 1}
                                                            </div>
                                                            
                                                            <div className="relative h-16 w-32 shrink-0 rounded-lg overflow-hidden border border-brand-border dark:border-dark-border bg-gray-50">
                                                                <img
                                                                    src={bannerUrl}
                                                                    alt={`Banner ${index + 1}`}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            </div>
                                                            
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-brand-text dark:text-dark-text truncate">
                                                                    {bannerUrl.split('/').pop() || `Banner Image ${index + 1}`}
                                                                </p>
                                                                <p className="text-xs text-brand-muted dark:text-dark-muted truncate mt-0.5">
                                                                    {bannerUrl}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                                                            <div className="flex-1 md:w-64">
                                                                <Input
                                                                    type="text"
                                                                    placeholder="Link pengalihan (misal: /produk/slug atau shopee...)"
                                                                    value={bannerLink}
                                                                    onChange={(e) => {
                                                                        const updated = [...home_banners];
                                                                        if (isObj) {
                                                                            updated[index] = { ...banner, link: e.target.value };
                                                                        } else {
                                                                            updated[index] = { url: banner, link: e.target.value };
                                                                        }
                                                                        setValue('home_banners', updated, { shouldDirty: true });
                                                                    }}
                                                                    className="h-8 text-xs bg-brand-surface/40 dark:bg-dark-surface/20 border-brand-border dark:border-dark-border text-brand-text dark:text-dark-text"
                                                                />
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    disabled={index === 0}
                                                                    onClick={() => {
                                                                        const updated = [...home_banners];
                                                                        const temp = updated[index];
                                                                        updated[index] = updated[index - 1];
                                                                        updated[index - 1] = temp;
                                                                        setValue('home_banners', updated, { shouldDirty: true });
                                                                    }}
                                                                    className="h-8 w-8 text-brand-text dark:text-dark-text hover:text-brand-primary hover:border-brand-primary"
                                                                >
                                                                    <ArrowUp className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    disabled={index === home_banners.length - 1}
                                                                    onClick={() => {
                                                                        const updated = [...home_banners];
                                                                        const temp = updated[index];
                                                                        updated[index] = updated[index + 1];
                                                                        updated[index + 1] = temp;
                                                                        setValue('home_banners', updated, { shouldDirty: true });
                                                                    }}
                                                                    className="h-8 w-8 text-brand-text dark:text-dark-text hover:text-brand-primary hover:border-brand-primary"
                                                                >
                                                                    <ArrowDown className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        const updated = home_banners.filter((_, idx) => idx !== index);
                                                                        setValue('home_banners', updated, { shouldDirty: true });
                                                                    }}
                                                                    className="h-8 w-8 border-red-200 dark:border-red-950 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 hover:border-red-300"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
 
                                <div className="space-y-3 pt-4 border-t border-brand-border dark:border-dark-border">
                                    <Label className="text-sm font-semibold">Unggah Banner Baru</Label>
                                    <ImageUpload
                                        value=""
                                        onChange={(url) => {
                                            if (url) {
                                                setValue('home_banners', [...home_banners, { url, link: '' }], { shouldDirty: true });
                                            }
                                        }}
                                        folder="Roxy-lay/settings"
                                        aspectRatio="auto"
                                    />
                                    <p className="text-xs text-brand-muted dark:text-dark-muted">
                                        Rekomendasi format gambar landscape (misalnya 1200x320px atau rasio aspek ~3.5:1). Anda dapat mengunggah 10+ banner.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB 3: KONTAK & SOSIAL */}
                    <TabsContent value="social" className="space-y-6">
                        <div className="rounded-xl border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface p-6 space-y-5">
                            <h3 className="text-lg font-semibold text-brand-text dark:text-dark-text border-b border-brand-border dark:border-dark-border pb-3">
                                Informasi Kontak
                            </h3>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="wa_number">Nomor WhatsApp (CS)</Label>
                                    <Input
                                        id="wa_number"
                                        placeholder="6289610528894"
                                        {...register('wa_number')}
                                    />
                                    {errors.wa_number && (
                                        <p className="text-xs text-red-500">{errors.wa_number.message}</p>
                                    )}
                                    <p className="text-xs text-brand-muted dark:text-dark-muted">
                                        Gunakan format 628xxx (tanpa + atau 0 di depan).
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface p-6 space-y-5">
                            <h3 className="text-lg font-semibold text-brand-text dark:text-dark-text border-b border-brand-border dark:border-dark-border pb-3">
                                Media Sosial
                            </h3>
                            
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="telegram_channel_url">Tautan Channel Telegram</Label>
                                    <Input
                                        id="telegram_channel_url"
                                        type="url"
                                        placeholder="https://t.me/nama_channel"
                                        {...register('telegram_channel_url')}
                                    />
                                    {errors.telegram_channel_url && (
                                        <p className="text-xs text-red-500">{errors.telegram_channel_url.message}</p>
                                    )}
                                    <p className="text-xs text-brand-muted dark:text-dark-muted">
                                        Masukkan tautan lengkap channel Telegram Anda (contoh: https://t.me/mychannel). Tautan ini digunakan untuk tautan "📣 Gabung Channel Telegram" di website.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </form>
            </Tabs>
        </div>
    )
}
