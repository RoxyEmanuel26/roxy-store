import ProductForm from '@/components/admin/ProductForm'

export default function AdminNewProductPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-brand-text dark:text-dark-text">
                    Tambah Produk Baru
                </h1>
                <p className="text-sm text-brand-muted dark:text-dark-muted mt-1">
                    Isi semua informasi produk di bawah ini
                </p>
            </div>
            <ProductForm />
        </div>
    )
}
