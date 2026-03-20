const BASE_URL = process.env.NEXTAUTH_URL || 'https://Roxylay.com'

export function getOrganizationSchema(settings: {
    tagline: string
    wa_number: string
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: 'Roxy Lay',
        description: settings.tagline,
        url: BASE_URL,
        telephone: `+${settings.wa_number}`,
        address: { '@type': 'PostalAddress', addressCountry: 'ID' },
        priceRange: '$$',
        currenciesAccepted: 'IDR',
        paymentAccepted: 'Shopee Pay, GoPay, OVO, Transfer Bank',
    }
}

export function getProductSchema(product: {
    title: string
    description: string
    price: number
    image: string
    slug: string
    shopeeUrl: string
    tokopediaUrl: string
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.description,
        image: product.image,
        url: `${BASE_URL}/products/${product.slug}`,
        brand: { '@type': 'Brand', name: 'Roxy Lay' },
        offers: [
            {
                '@type': 'Offer',
                price: product.price,
                priceCurrency: 'IDR',
                availability: 'https://schema.org/InStock',
                url: product.shopeeUrl,
                seller: { '@type': 'Organization', name: 'Roxy Lay di Shopee' },
            },
            {
                '@type': 'Offer',
                price: product.price,
                priceCurrency: 'IDR',
                availability: 'https://schema.org/InStock',
                url: product.tokopediaUrl,
                seller: { '@type': 'Organization', name: 'Roxy Lay di Tokopedia' },
            },
        ],
    }
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
        name: 'Roxy Lay',
        url: BASE_URL,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${BASE_URL}/products?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    }
}
