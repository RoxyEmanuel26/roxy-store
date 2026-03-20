'use client'

import { useState, useEffect, use } from 'react'
import { Loader2 } from 'lucide-react'
import ProductForm from '@/components/admin/ProductForm'
import { toast } from 'sonner'

export default function AdminEditProductPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params)
    const [product, setProduct] = useState<Record<string, unknown> | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchProduct() {
            try {
                const res = await fetch(`/api/admin/products/${id}`)
                if (!res.ok) {
                    toast.error('Produk tidak ditemukan')
                    return
                }
                const data = await res.json()
                setProduct(data)
            } catch {
                toast.error('Gagal memuat data produk')
            } finally {
                setIsLoading(false)
            }
        }
        fetchProduct()
    }, [id])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
        )
    }

    if (!product) {
        return (
            <div className="text-center py-20">
                <p className="text-lg text-brand-muted dark:text-dark-muted">
                    Produk tidak ditemukan.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-brand-text dark:text-dark-text">
                    Edit Produk
                </h1>
                <p className="text-sm text-brand-muted dark:text-dark-muted mt-1">
                    Perbarui informasi produk di bawah ini
                </p>
            </div>
            <ProductForm
                isEdit
                initialData={{
                    id: product.id as string,
                    title: product.title as string,
                    slug: product.slug as string,
                    description: product.description as string,
                    price: product.price as number,
                    image: product.image as string,
                    images: (product.images as string[]) || [],
                    shopeeUrl: product.shopeeUrl as string,
                    tokopediaUrl: product.tokopediaUrl as string,
                    categoryId: product.categoryId as string,
                    badge: (product.badge as "NEW" | "HOT" | "BEST SELLER" | null | undefined),
                    isActive: product.isActive as boolean,
                }}
            />
        </div>
    )
}
