import { uploadImage } from '@/lib/cloudinary'

export function decodeHtmlEntities(str: string): string {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
}

export function cleanShopeeTitle(title: string): string {
    let clean = title.trim()
    // Remove "Jual " prefix if exists
    if (clean.toLowerCase().startsWith('jual ')) {
        clean = clean.substring(5)
    }
    // Remove " | Shopee Indonesia" suffix if exists
    const suffix = ' | Shopee Indonesia'
    if (clean.toLowerCase().endsWith(suffix.toLowerCase())) {
        clean = clean.substring(0, clean.length - suffix.length)
    }
    return clean.trim()
}

export function getMetaContent(html: string, propertyOrName: string): string | null {
    const metaTags = html.match(/<meta[^>]+>/gi) || []
    for (const tag of metaTags) {
        const hasProp = tag.includes(`property="${propertyOrName}"`) || 
                        tag.includes(`property='${propertyOrName}'`) ||
                        tag.includes(`name="${propertyOrName}"`) ||
                        tag.includes(`name='${propertyOrName}'`)
        if (hasProp) {
            const contentMatch = tag.match(/content="([^"]+)"/i) || tag.match(/content='([^']+)'/i)
            if (contentMatch) {
                return decodeHtmlEntities(contentMatch[1])
            }
        }
    }
    return null
}

export async function scrapeShopeeProduct(url: string): Promise<{
    title: string
    description: string
    imageUrl: string
    rawImageUrl: string
}> {
    if (!url || !url.includes('shopee.co.id')) {
        throw new Error('URL harus berupa link Shopee Indonesia')
    }

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_codedoc.html)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        },
        redirect: 'follow'
    })

    if (!response.ok) {
        throw new Error(`Gagal mengambil halaman Shopee (Status: ${response.status})`)
    }

    const html = await response.text()

    const rawTitle = getMetaContent(html, 'og:title') || getMetaContent(html, 'twitter:title') || ''
    const title = cleanShopeeTitle(rawTitle)

    const description = getMetaContent(html, 'og:description') || getMetaContent(html, 'description') || ''
    const rawImageUrl = getMetaContent(html, 'og:square_image') || getMetaContent(html, 'og:image') || ''

    let imageUrl = ''
    if (rawImageUrl) {
        try {
            // Upload to Cloudinary
            const uploadRes = await uploadImage(rawImageUrl, 'Roxy-lay/products')
            imageUrl = uploadRes.url
        } catch (err) {
            console.error('Failed to upload image to Cloudinary during scraping:', err)
            // Fallback to raw image URL if Cloudinary upload fails
            imageUrl = rawImageUrl
        }
    }

    return {
        title,
        description,
        imageUrl,
        rawImageUrl
    }
}
