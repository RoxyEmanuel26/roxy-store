import { Metadata } from 'next'

const BASE_URL = process.env.NEXTAUTH_URL || 'https://roxystore.com'
const SITE_NAME = 'Roxy Store'
const DEFAULT_DESCRIPTION =
    'Rekomendasi produk terlaris dan terpercaya di Shopee. Temukan produk skincare, fashion, rumah tangga, gaming, dan lainnya dengan harga terbaik.'
const DEFAULT_IMAGE = `${BASE_URL}/og-default.jpg`

export function generatePageMetadata({
    title,
    description = DEFAULT_DESCRIPTION,
    image = DEFAULT_IMAGE,
    path = '',
    type = 'website',
}: {
    title: string
    description?: string
    image?: string
    path?: string
    type?: 'website' | 'article'
}): Metadata {
    const fullUrl = `${BASE_URL}${path}`
    const fullTitle = `${title} - ${SITE_NAME}`

    return {
        title: fullTitle,
        description,
        metadataBase: new URL(BASE_URL),
        alternates: { canonical: fullUrl },
        openGraph: {
            title: fullTitle,
            description,
            url: fullUrl,
            siteName: SITE_NAME,
            images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
            locale: 'id_ID',
            type,
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description,
            images: [image],
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large' as const,
                'max-snippet': -1,
            },
        },
    }
}

export { BASE_URL, SITE_NAME, DEFAULT_DESCRIPTION, DEFAULT_IMAGE }
