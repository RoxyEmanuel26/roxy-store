'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SettingsSchema } from '@/lib/validations'
import { z } from 'zod'
import { Loader2, Save } from 'lucide-react'
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
        },
    })

    // Watch image URLs for ImageUpload components
    const logo_url = watch('logo_url')
    const hero_image = watch('hero_image')

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
                        Banner Hero
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

                    {/* TAB 2: BANNER HERO */}
                    <TabsContent value="hero" className="space-y-6">
                        <div className="rounded-xl border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface p-6 space-y-5">
                            <h3 className="text-lg font-semibold text-brand-text dark:text-dark-text border-b border-brand-border dark:border-dark-border pb-3">
                                Hero Section (Halaman Utama)
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="hero_title">Judul Hero (Headline)</Label>
                                    <Input
                                        id="hero_title"
                                        placeholder="Lengkapi Gayamu dengan Koleksi Terbaik Kami"
                                        {...register('hero_title')}
                                    />
                                    {errors.hero_title && (
                                        <p className="text-xs text-red-500">{errors.hero_title.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="hero_subtitle">Sub-judul Hero</Label>
                                    <Textarea
                                        id="hero_subtitle"
                                        rows={2}
                                        placeholder="Temukan berbagai aksesori wanita eksklusif yang dirancang khusus untuk memancarkan pesona manismu."
                                        {...register('hero_subtitle')}
                                    />
                                    {errors.hero_subtitle && (
                                        <p className="text-xs text-red-500">{errors.hero_subtitle.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2 pt-2">
                                    <Label>Gambar Latar Hero</Label>
                                    <ImageUpload
                                        value={hero_image || ''}
                                        onChange={(url) => setValue('hero_image', url, { shouldDirty: true })}
                                        folder="Roxy-lay/settings"
                                        aspectRatio="16:9"
                                    />
                                    {errors.hero_image && (
                                        <p className="text-xs text-red-500">{errors.hero_image.message}</p>
                                    )}
                                    <p className="text-xs text-brand-muted dark:text-dark-muted">
                                        Gunakan gambar berkualitas tinggi, format Landscape (16:9).
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
                            <p className="text-sm text-brand-muted dark:text-dark-muted">
                                Tambahkan link media sosial Anda pada bagian ini menggunakan konfigurasi key/value (jika schema mendukung di masa depan).
                                Saat ini hanya mendukung WhatsApp dari skema pengaturan.
                            </p>
                        </div>
                    </TabsContent>
                </form>
            </Tabs>
        </div>
    )
}
