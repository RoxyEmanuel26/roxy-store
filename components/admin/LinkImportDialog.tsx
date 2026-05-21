'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Globe, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface LinkImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function LinkImportDialog({ open, onOpenChange }: LinkImportDialogProps) {
    const router = useRouter()
    const [url, setUrl] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleScrape = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!url) {
            toast.error('Silakan masukkan tautan Shopee terlebih dahulu')
            return
        }

        if (!url.includes('shopee.co.id')) {
            toast.error('Harus berupa tautan Shopee Indonesia (shopee.co.id)')
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch('/api/admin/products/scrape-shopee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || 'Gagal mengambil data dari Shopee')
                return
            }

            // Save scraped data into sessionStorage for ProductForm to pick up
            const prefilledProduct = {
                title: data.title || '',
                description: data.description || '',
                image: data.imageUrl || data.rawImageUrl || '',
                shopeeUrl: url,
            }

            sessionStorage.setItem('prefilledProduct', JSON.stringify(prefilledProduct))
            toast.success('Data Shopee berhasil diambil! Dialihkan ke form produk...')

            // Close dialog and reset state
            setUrl('')
            onOpenChange(false)

            // Redirect to new product form
            router.push('/admin/products/new')
        } catch (err) {
            toast.error('Terjadi kesalahan saat mengambil data')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleScrape} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold text-brand-primary">
                            <Sparkles className="h-5 w-5 text-brand-primary animate-pulse" />
                            Smart Add dari Shopee
                        </DialogTitle>
                        <DialogDescription className="text-sm text-brand-muted dark:text-dark-muted">
                            Tempel tautan produk Shopee Indonesia di bawah. Sistem akan mengambil judul, deskripsi, gambar utama, dan link Shopee secara otomatis.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 py-2">
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
                            <Input
                                type="text"
                                placeholder="Contoh: https://s.shopee.co.id/1BJLxhR2uv"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="pl-10 h-11 border-brand-primary/30 focus-visible:ring-brand-primary bg-white"
                                disabled={isLoading}
                            />
                        </div>
                        <p className="text-xs text-brand-muted dark:text-dark-muted">
                            * Mendukung tautan pendek (s.shopee.co.id) maupun tautan panjang shopee.co.id
                        </p>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className="h-11"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-brand-primary hover:bg-brand-primary/90 text-white h-11 px-6 font-medium gap-2 shadow-md hover:shadow-lg transition-all"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Mengambil Data...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Ambil Data Shopee
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
