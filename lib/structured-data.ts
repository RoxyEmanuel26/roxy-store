const envUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'https://www.roxystore.web.id'
const BASE_URL = envUrl.startsWith('http') ? envUrl : `https://${envUrl}`

export function getOrganizationSchema(settings: {
    tagline: string
    wa_number: string
    telegram_channel_url?: string
    instagram_url?: string
}) {
    const sameAs: string[] = []
    if (settings.telegram_channel_url) sameAs.push(settings.telegram_channel_url)
    if (settings.instagram_url) sameAs.push(settings.instagram_url)

    return {
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: 'Roxy Store',
        description: settings.tagline,
        url: BASE_URL,
        logo: `${BASE_URL}/icons/icon-512x512.png`,
        telephone: settings.wa_number ? `+${settings.wa_number}` : undefined,
        address: { '@type': 'PostalAddress', addressCountry: 'ID' },
        priceRange: '$$',
        currenciesAccepted: 'IDR',
        paymentAccepted: 'Shopee Pay, GoPay, OVO, Transfer Bank',
        ...(sameAs.length > 0 && { sameAs }),
    }
}

export function getProductSchema(product: {
    title: string
    description: string
    price: number
    originalPrice?: number | null
    image: string
    images?: string[]
    slug: string
    shopeeUrl: string
    shopeeRating?: number | null
    shopeeSold?: number | null
}) {
    const offers = []

    if (product.shopeeUrl) {
        offers.push({
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'IDR',
            availability: 'https://schema.org/InStock',
            url: product.shopeeUrl,
            seller: { '@type': 'Organization', name: 'Shopee' },
        })
    }

    const allImages = [product.image, ...(product.images || [])].filter(Boolean)

    const schema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.description?.slice(0, 500),
        image: allImages,
        url: `${BASE_URL}/produk/${product.slug}`,
        brand: { '@type': 'Brand', name: 'Roxy Store' },
        offers: offers.length === 1
            ? offers[0]
            : { '@type': 'AggregateOffer', lowPrice: product.price, highPrice: product.originalPrice || product.price, priceCurrency: 'IDR', offerCount: offers.length, offers },
    }

    // AggregateRating from Shopee data
    if (product.shopeeRating && product.shopeeRating > 0) {
        schema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: product.shopeeRating,
            bestRating: 5,
            worstRating: 1,
            reviewCount: product.shopeeSold || 1,
        }
    }

    return schema
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    }
}

export function getWebsiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Roxy Store',
        url: BASE_URL,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${BASE_URL}/produk?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    }
}
