import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Produk Favoritku - Roxy Store',
    description: 'Daftar produk favorit yang sudah kamu simpan di Roxy Store.',
    robots: {
        index: false,
        follow: true,
    },
}

export default function WishlistLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
