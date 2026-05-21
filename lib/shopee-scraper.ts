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

export function cleanShopeeDescription(description: string): string {
    if (!description) return ''
    const lower = description.toLowerCase()
    
    // Shopee promotional boilerplate detection
    if (
        lower.includes('terbaru harga murah di shopee') ||
        lower.includes('beli produk ini di shopee') ||
        (lower.startsWith('beli ') && lower.includes('di shopee.'))
    ) {
        return ''
    }
    
    return description.trim()
}

export function extractCategoryFromHtml(html: string): string {
    const ldJsons = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || []
    
    for (const tag of ldJsons) {
        try {
            const cleanJson = tag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim()
            const obj = JSON.parse(cleanJson)
            
            if (obj['@type'] === 'BreadcrumbList' && obj.itemListElement && Array.isArray(obj.itemListElement)) {
                // Find item at position 2 or index 1
                const secondItem = obj.itemListElement.find((el: any) => el.position === 2) || obj.itemListElement[1]
                if (secondItem) {
                    if (secondItem.item && secondItem.item.name) {
                        return secondItem.item.name.trim()
                    } else if (secondItem.name) {
                        return secondItem.name.trim()
                    }
                }
            }
        } catch {
            // Ignore parse errors
        }
    }
    
    return ''
}

export function extractShopeeIds(url: string): { shopId: string; itemId: string } | null {
    // 1. Check for /product/{shopId}/{itemId}
    const productMatch = url.match(/\/product\/(\d+)\/(\d+)/i)
    if (productMatch) {
        return { shopId: productMatch[1], itemId: productMatch[2] }
    }

    // 2. Check for -i.{shopId}.{itemId}
    const hyphenIMatch = url.match(/-i\.(\d+)\.(\d+)/i)
    if (hyphenIMatch) {
        return { shopId: hyphenIMatch[1], itemId: hyphenIMatch[2] }
    }

    // 3. Check for /{username}/{shopId}/{itemId}
    const userMatch = url.match(/shopee\.co\.id\/([^/]+)\/(\d+)\/(\d+)/i)
    if (userMatch) {
        const reserved = ['product', 'api', 'cart', 'checkout', 'buyer', 'user', 'search', 'category']
        if (!reserved.includes(userMatch[1].toLowerCase())) {
            return { shopId: userMatch[2], itemId: userMatch[3] }
        }
    }

    return null
}

export function cleanShopeeImageUrl(url: string): string {
    if (!url) return ''
    // Strip query parameters
    let cleaned = url.split('?')[0]
    // Strip resizing suffixes like _tn, _tn.jpg, or @resize...
    cleaned = cleaned.replace(/(_tn|@resize.*)$/i, '')
    return cleaned
}

export function extractShopeeImages(html: string): string[] {
    const images: string[] = []

    // 1. Extract from JSON-LD Product schema (most reliable source for carousel images)
    const ldJsons = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || []
    for (const tag of ldJsons) {
        try {
            const cleanJson = tag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim()
            const obj = JSON.parse(cleanJson)
            // Check for Product type with image array
            if (obj['@type'] === 'Product' && obj.image) {
                const imgArr = Array.isArray(obj.image) ? obj.image : [obj.image]
                for (const imgUrl of imgArr) {
                    if (typeof imgUrl === 'string' && imgUrl.includes('susercontent.com')) {
                        const cleaned = cleanShopeeImageUrl(imgUrl)
                        if (cleaned && !images.includes(cleaned)) {
                            images.push(cleaned)
                        }
                    }
                }
            }
        } catch {
            // Ignore parse errors
        }
    }

    // 2. Extract from <img> and <source> tags (filtering avatars)
    const tags = html.match(/<(?:img|source)\b[^>]*>/gi) || []
    const cdnUrlRegex = /https:\/\/(?:[a-z0-9-]+\.img\.susercontent\.com|cf\.shopee\.[a-z.]+)\/file\/[a-zA-Z0-9_-]+/gi
    
    for (const tag of tags) {
        // Check if it's a shop avatar
        const isAvatar = /class=["'][^"']*(?:avatar|OUM_RU|shop-avatar|shopee-avatar)[^"']*["']/i.test(tag)
        if (isAvatar) continue
        
        let match
        cdnUrlRegex.lastIndex = 0
        while ((match = cdnUrlRegex.exec(tag)) !== null) {
            const cleaned = cleanShopeeImageUrl(match[0])
            if (cleaned && !images.includes(cleaned)) {
                images.push(cleaned)
            }
        }
    }

    // 3. Scan entire HTML for CDN URLs as final fallback (captures preloaded/lazy images)
    const globalCdnRegex = /https:\/\/(?:down-[a-z]+\.img\.susercontent\.com|cf\.shopee\.[a-z.]+)\/file\/[a-zA-Z0-9_-]+/g
    let globalMatch
    while ((globalMatch = globalCdnRegex.exec(html)) !== null) {
        const cleaned = cleanShopeeImageUrl(globalMatch[0])
        if (cleaned && !images.includes(cleaned)) {
            images.push(cleaned)
        }
    }

    return images
}

export function generateFallbackDescription(title: string): string {
    if (!title) return ''
    return `Dapatkan ${title} original berkualitas terbaik hanya di Roxy Store! Produk pilihan ini dirancang dengan desain modern dan material berkualitas untuk memberikan kenyamanan serta keandalan maksimal dalam penggunaan sehari-hari.`
}

export async function scrapeShopeeProduct(url: string): Promise<{
    title: string
    description: string
    imageUrl: string
    rawImageUrl: string
    category: string
    images: string[]
}> {
    if (!url || !url.includes('shopee.co.id')) {
        throw new Error('URL harus berupa link Shopee Indonesia')
    }

    // 1. Fetch initial URL
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
    const finalUrl = response.url

    // 2. Extract initial metadata from bridge or direct page
    const rawTitle = getMetaContent(html, 'og:title') || getMetaContent(html, 'twitter:title') || ''
    let title = cleanShopeeTitle(rawTitle)

    const rawDescription = getMetaContent(html, 'og:description') || getMetaContent(html, 'description') || ''
    let description = cleanShopeeDescription(rawDescription)
    
    let rawImageUrl = getMetaContent(html, 'og:square_image') || getMetaContent(html, 'og:image') || ''
    let category = extractCategoryFromHtml(html)

    // Also extract images from initial HTML
    let extractedImages = extractShopeeImages(html)

    // 3. Resolve real desktop URL if needed for categories or extra info
    const alWebUrl = getMetaContent(html, 'al:web:url')
    
    // Find shopId and itemId from current URL, redirected response URL, or alWebUrl
    let ids = extractShopeeIds(url) || extractShopeeIds(finalUrl)
    if (!ids && alWebUrl) {
        ids = extractShopeeIds(alWebUrl)
    }

    if (ids) {
        const desktopUrl = `https://shopee.co.id/product/${ids.shopId}/${ids.itemId}`
        try {
            const desktopResponse = await fetch(desktopUrl, {
                headers: {
                    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_codedoc.html)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'id-ID,id;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                redirect: 'follow'
            })
            if (desktopResponse.ok) {
                const desktopHtml = await desktopResponse.text()
                
                // If category was not found, search the desktop page
                if (!category) {
                    category = extractCategoryFromHtml(desktopHtml)
                }
                
                // If title was empty or not found, try to search the desktop page
                if (!title) {
                    const desktopRawTitle = getMetaContent(desktopHtml, 'og:title') || getMetaContent(desktopHtml, 'twitter:title') || ''
                    title = cleanShopeeTitle(desktopRawTitle)
                }

                // If description was empty, check if we can get a non-boilerplate description
                if (!description) {
                    const desktopRawDesc = getMetaContent(desktopHtml, 'og:description') || getMetaContent(desktopHtml, 'description') || ''
                    description = cleanShopeeDescription(desktopRawDesc)
                }

                // If image URL is not found yet, get it from desktop
                if (!rawImageUrl) {
                    rawImageUrl = getMetaContent(desktopHtml, 'og:square_image') || getMetaContent(desktopHtml, 'og:image') || ''
                }

                // Extract images from desktop HTML as well
                const desktopImages = extractShopeeImages(desktopHtml)
                for (const img of desktopImages) {
                    if (!extractedImages.includes(img)) {
                        extractedImages.push(img)
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch desktop URL for extra details:', err)
        }
    }

    // High quality fallback description if needed
    if (!description && title) {
        description = generateFallbackDescription(title)
    }

    // Filter out rawImageUrl from extractedImages if it's already there
    const cleanedRawImageUrl = cleanShopeeImageUrl(rawImageUrl)
    extractedImages = extractedImages.filter(img => cleanShopeeImageUrl(img) !== cleanedRawImageUrl)

    // Build unique list with rawImageUrl at index 0
    const finalUniqueImages = [cleanedRawImageUrl || rawImageUrl, ...extractedImages].filter(Boolean)
    const uniqueImagesSet = Array.from(new Set(finalUniqueImages))

    // Concurrent upload to Cloudinary using Promise.all
    const uploadedImages = await Promise.all(
        uniqueImagesSet.map(async (imgUrl) => {
            try {
                const uploadRes = await uploadImage(imgUrl, 'Roxy-lay/products')
                return uploadRes.url
            } catch (err) {
                console.error(`Failed to upload image to Cloudinary: ${imgUrl}`, err)
                return imgUrl // Fallback to raw Shopee CDN URL
            }
        })
    )

    const imageUrl = uploadedImages[0] || ''

    return {
        title,
        description,
        imageUrl,
        rawImageUrl: cleanedRawImageUrl || rawImageUrl,
        category,
        images: uploadedImages
    }
}

