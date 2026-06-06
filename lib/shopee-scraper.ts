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

export function extractBreadcrumbsFromHtml(html: string): { category: string; subcategory: string } {
    const ldJsons = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || []
    
    let category = ''
    let subcategory = ''
    
    for (const tag of ldJsons) {
        try {
            const cleanJson = tag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim()
            const obj = JSON.parse(cleanJson)
            
            if (obj['@type'] === 'BreadcrumbList' && obj.itemListElement && Array.isArray(obj.itemListElement)) {
                // Find category at position 2 (index 1)
                const secondItem = obj.itemListElement.find((el: any) => el.position === 2) || obj.itemListElement[1]
                if (secondItem) {
                    category = (secondItem.item && secondItem.item.name ? secondItem.item.name : (secondItem.name || '')).trim()
                }
                
                // Find subcategory at position 3 (index 2)
                const thirdItem = obj.itemListElement.find((el: any) => el.position === 3) || obj.itemListElement[2]
                if (thirdItem) {
                    subcategory = (thirdItem.item && thirdItem.item.name ? thirdItem.item.name : (thirdItem.name || '')).trim()
                }
                
                if (category) {
                    break
                }
            }
        } catch {
            // Ignore parse errors
        }
    }
    
    return { category, subcategory }
}

export function extractCategoryFromHtml(html: string): string {
    return extractBreadcrumbsFromHtml(html).category
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
    subcategory: string
    images: string[]
    price?: number | null
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
    
    const initialBreadcrumbs = extractBreadcrumbsFromHtml(html)
    let category = initialBreadcrumbs.category
    let subcategory = initialBreadcrumbs.subcategory

    // Also extract images from initial HTML
    let extractedImages = extractShopeeImages(html)

    // 3. Resolve real desktop URL if needed for categories or extra info
    const alWebUrl = getMetaContent(html, 'al:web:url')
    
    // Find shopId and itemId from current URL, redirected response URL, or alWebUrl
    let ids = extractShopeeIds(url) || extractShopeeIds(finalUrl)
    if (!ids && alWebUrl) {
        ids = extractShopeeIds(alWebUrl)
    }

    let scrapedPrice: number | null = null

    if (ids) {
        const desktopUrl = `https://shopee.co.id/product/${ids.shopId}/${ids.itemId}`
        try {
            const desktopResponse = await fetch(desktopUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36 (compatible; Google-Structured-Data-Testing-Tool +http://developers.google.com/search)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'id-ID,id;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                redirect: 'follow'
            })
            if (desktopResponse.ok) {
                const desktopHtml = await desktopResponse.text()
                
                const desktopBreadcrumbs = extractBreadcrumbsFromHtml(desktopHtml)
                if (!category && desktopBreadcrumbs.category) {
                    category = desktopBreadcrumbs.category
                }
                if (!subcategory && desktopBreadcrumbs.subcategory) {
                    subcategory = desktopBreadcrumbs.subcategory
                }
                
                // Parse JSON-LD Product schema for title, description, and price
                const ldJsons = desktopHtml.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || []
                for (const tag of ldJsons) {
                    const cleanJson = tag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim()
                    try {
                        const obj = JSON.parse(cleanJson)
                        if (obj['@type'] === 'Product') {
                            if (obj.name && !title) {
                                title = cleanShopeeTitle(obj.name)
                            }
                            if (obj.description && !description) {
                                description = cleanShopeeDescription(obj.description)
                            }
                            if (obj.offers && obj.offers.price) {
                                scrapedPrice = parseFloat(obj.offers.price)
                            }
                        }
                    } catch {
                        // Ignore parse errors
                    }
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
    const bypassCloudinary = process.env.BYPASS_CLOUDINARY === 'true'
    const uploadedImages = bypassCloudinary 
        ? uniqueImagesSet 
        : await Promise.all(
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

    // Apply title-based classifier fallback if category is empty or 'Other'
    if ((!category || category.toLowerCase() === 'other') && title) {
        const classified = classifyCategoryFromTitle(title)
        if (classified) {
            category = classified.category
            subcategory = classified.subcategory
        }
    }

    return {
        title,
        description,
        imageUrl,
        rawImageUrl: cleanedRawImageUrl || rawImageUrl,
        category,
        subcategory,
        images: uploadedImages,
        price: scrapedPrice
    }
}

export function classifyCategoryFromTitle(title: string): { category: string; subcategory: string } | null {
    const t = title.toLowerCase()

    // 1. Makanan & Minuman
    if (t.includes('kopi') || t.includes('teh') || t.includes('susu') || t.includes('jus') || t.includes('sirup') || t.includes('air mineral') || t.includes('soda') || t.includes('boba') || t.includes('yakult') || t.includes('minuman')) {
        return { category: 'Makanan & Minuman', subcategory: 'Minuman' }
    }
    if (t.includes('keripik') || t.includes('snack') || t.includes('chiki') || t.includes('biskuit') || t.includes('kue kering') || t.includes('wafer') || t.includes('cokelat') || t.includes('permen') || t.includes('kacang') || t.includes('cookies') || t.includes('kue') || t.includes('makaroni') || t.includes('baso aci') || t.includes('seblak') || t.includes('cemilan') || t.includes('kuaci')) {
        return { category: 'Makanan & Minuman', subcategory: 'Makanan Ringan' }
    }
    if (t.includes('minyak') || t.includes('gula') || t.includes('beras') || t.includes('tepung') || t.includes('garam') || t.includes('mentega') || t.includes('margarin') || t.includes('sunco') || t.includes('filma') || t.includes('fortune') || t.includes('bimoli') || t.includes('sania') || t.includes('minyak goreng') || t.includes('bumbu') || t.includes('kecap') || t.includes('saos') || t.includes('kaldu') || t.includes('penyedap') || t.includes('mie instan') || t.includes('indomie') || t.includes('samyang') || t.includes('sarimi') || t.includes('sedap')) {
        return { category: 'Makanan & Minuman', subcategory: 'Bahan Pokok' }
    }

    // 2. Fashion Muslim
    if (t.includes('gamis') || t.includes('abaya') || t.includes('kaftan') || t.includes('dress muslim') || t.includes('tunik muslim')) {
        return { category: 'Fashion Muslim', subcategory: 'Dress Muslim' }
    }
    if (t.includes('hijab') || t.includes('jilbab') || t.includes('bergo') || t.includes('pashmina') || t.includes('khimar') || t.includes('kerudung') || t.includes('ciput') || t.includes('dagu') || t.includes('inner rajut') || t.includes('manset leher')) {
        return { category: 'Fashion Muslim', subcategory: 'Hijab' }
    }
    if (t.includes('koko') || t.includes('kurta') || t.includes('sarung') || t.includes('peci') || t.includes('kopiah') || t.includes('sirwal')) {
        return { category: 'Fashion Muslim', subcategory: 'Pakaian Muslim Pria' }
    }
    if (t.includes('mukena') || t.includes('sajadah') || t.includes('tasbih')) {
        return { category: 'Fashion Muslim', subcategory: 'Mukena & Perlengkapan Sholat' }
    }

    // 3. Sepatu Pria (Checked before generic checks)
    if (t.includes('sepatu pria') || t.includes('sandal pria') || t.includes('sendal pria') || t.includes('sepatu kets pria') || t.includes('sneakers pria') || (t.includes('pria') && (t.includes('sepatu') || t.includes('sandal') || t.includes('sendal')))) {
        if (t.includes('slip-on') || t.includes('slip on') || t.includes('selop') || t.includes('mules') || t.includes('pantofel slip')) {
            return { category: 'Sepatu Pria', subcategory: 'Slip-On & Mules' }
        }
        if (t.includes('sneakers') || t.includes('sneaker') || t.includes('kets') || t.includes('sport')) {
            return { category: 'Sepatu Pria', subcategory: 'Sneakers' }
        }
        if (t.includes('boot') || t.includes('boots') || t.includes('safety')) {
            return { category: 'Sepatu Pria', subcategory: 'Boot' }
        }
        if (t.includes('sandal') || t.includes('sendal') || t.includes('jepit') || t.includes('slop') || t.includes('gunung')) {
            return { category: 'Sepatu Pria', subcategory: 'Sandal' }
        }
        if (t.includes('formal') || t.includes('pantofel') || t.includes('pantovel') || t.includes('kerja') || t.includes('kulit formal')) {
            return { category: 'Sepatu Pria', subcategory: 'Sepatu Formal' }
        }
        if (t.includes('semir') || t.includes('pembersih sepatu') || t.includes('cat sepatu') || t.includes('tali sepatu') || t.includes('leather paint')) {
            return { category: 'Sepatu Pria', subcategory: 'Aksesoris & Perawatan Sepatu' }
        }
        return { category: 'Sepatu Pria', subcategory: 'Sepatu Pria Lainnya' }
    }

    // 4. Sepatu Wanita (Checked before generic checks)
    if (t.includes('sepatu wanita') || t.includes('sandal wanita') || t.includes('sendal wanita') || t.includes('sneakers wanita') || t.includes('sneaker wanita') || t.includes('heels') || t.includes('flatshoes') || t.includes('flat shoes') || (t.includes('wanita') && (t.includes('sepatu') || t.includes('sandal') || t.includes('sendal')))) {
        if (t.includes('sneakers') || t.includes('sneaker') || t.includes('kets') || t.includes('sport')) {
            return { category: 'Sepatu Wanita', subcategory: 'Sneakers' }
        }
        if (t.includes('flat') || t.includes('flatshoes') || t.includes('flat shoes')) {
            return { category: 'Sepatu Wanita', subcategory: 'Sepatu Flat' }
        }
        if (t.includes('heels') || t.includes('high heels') || t.includes('hak tinggi') || t.includes('stiletto') || t.includes('pumps')) {
            return { category: 'Sepatu Wanita', subcategory: 'Heels' }
        }
        if (t.includes('wedges') || t.includes('sepatu wedges')) {
            return { category: 'Sepatu Wanita', subcategory: 'Wedges' }
        }
        if (t.includes('slip-on') || t.includes('slip on') || t.includes('mules') || t.includes('selop') || t.includes('pantofel wanita')) {
            return { category: 'Sepatu Wanita', subcategory: 'Slip Ons, Mary Janes & Mules' }
        }
        if (t.includes('boot') || t.includes('boots')) {
            return { category: 'Sepatu Wanita', subcategory: 'Boots' }
        }
        if (t.includes('sandal') || t.includes('sendal') || t.includes('jepit') || t.includes('slop')) {
            return { category: 'Sepatu Wanita', subcategory: 'Sandal' }
        }
        return { category: 'Sepatu Wanita', subcategory: 'Sepatu Wanita Lainnya' }
    }

    // Generic Shoe / Sandal Care or products containing "sepatu" or "sandal"
    if (t.includes('sepatu') || t.includes('sandal') || t.includes('sendal')) {
        if (t.includes('semir') || t.includes('pembersih') || t.includes('sikat') || t.includes('cat') || t.includes('tali') || t.includes('leather paint') || t.includes('cleaner') || t.includes('balsam') || t.includes('biopolish') || t.includes('lem')) {
            return { category: 'Sepatu Pria', subcategory: 'Aksesoris & Perawatan Sepatu' }
        }
        if (t.includes('slip-on') || t.includes('slip on') || t.includes('selop') || t.includes('mules')) {
            return { category: 'Sepatu Pria', subcategory: 'Slip-On & Mules' }
        }
        if (t.includes('sneakers') || t.includes('sneaker') || t.includes('kets') || t.includes('olahraga')) {
            return { category: 'Sepatu Pria', subcategory: 'Sneakers' }
        }
        if (t.includes('sandal') || t.includes('sendal') || t.includes('jepit') || t.includes('slop')) {
            return { category: 'Sepatu Pria', subcategory: 'Sandal' }
        }
    }

    // 5. Aksesoris (Checked before Pakaian Pria/Wanita generic checks)
    if (t.includes('jam tangan') || t.includes('wristwatch') || t.includes('smartwatch') || t.includes('smart watch') || t.includes('kacamata') || t.includes('sunglasses') || t.includes('kalung') || t.includes('necklace') || t.includes('gelang') || t.includes('bracelet') || t.includes('cincin') || t.includes('anting') || t.includes('earrings') || t.includes('topi') || t.includes('cap') || t.includes('ikat pinggang') || t.includes('belt') || t.includes('bros') || t.includes('brooch') || t.includes('pin hijab') || t.includes('gesper')) {
        if (t.includes('jam tangan') || t.includes('wristwatch') || t.includes('smartwatch') || t.includes('smart watch')) {
            return { category: 'Aksesoris', subcategory: 'Jam Tangan' }
        }
        if (t.includes('kacamata') || t.includes('sunglasses') || t.includes('frame kacamata') || t.includes('kotak kacamata') || t.includes('pembersih kacamata')) {
            return { category: 'Aksesoris', subcategory: 'Kacamata & Aksesoris' }
        }
        if (t.includes('kalung') || t.includes('necklace') || t.includes('liontin')) {
            return { category: 'Aksesoris', subcategory: 'Kalung' }
        }
        if (t.includes('gelang') || t.includes('bracelet')) {
            return { category: 'Aksesoris', subcategory: 'Gelang' }
        }
        if (t.includes('cincin') || t.includes('ring')) {
            return { category: 'Aksesoris', subcategory: 'Cincin' }
        }
        if (t.includes('anting') || t.includes('earrings') || t.includes('subang')) {
            return { category: 'Aksesoris', subcategory: 'Anting' }
        }
        if (t.includes('topi') || t.includes('cap') || t.includes('bucket hat') || t.includes('kupluk') || t.includes('topi baseball')) {
            return { category: 'Aksesoris', subcategory: 'Topi' }
        }
        if (t.includes('ikat pinggang') || t.includes('sabuk') || t.includes('belt') || t.includes('gesper')) {
            return { category: 'Aksesoris', subcategory: 'Ikat Pinggang' }
        }
        if (t.includes('bros') || t.includes('brooch') || t.includes('pin hijab') || t.includes('lencana')) {
            return { category: 'Aksesoris', subcategory: 'Bros, Pin & Lencana' }
        }
        return { category: 'Aksesoris', subcategory: 'Aksesoris Lainnya' }
    }

    // 6. Tas Wanita (Checked before Pakaian Wanita generic checks)
    if (t.includes('tas wanita') || t.includes('dompet wanita') || (t.includes('wanita') && t.includes('tas')) || (t.includes('wanita') && t.includes('dompet')) || t.includes('slingbag wanita') || t.includes('sling bag wanita') || t.includes('tote bag wanita') || t.includes('totebag wanita') || t.includes('clutch wanita') || t.includes('handbag wanita') || t.includes('ransel wanita') || t.includes('backpack wanita')) {
        if (t.includes('ransel') || t.includes('backpack')) {
            return { category: 'Tas Wanita', subcategory: 'Ransel Wanita' }
        }
        if (t.includes('selempang') || t.includes('sling bag') || t.includes('slingbag') || t.includes('shoulder bag') || t.includes('tas bahu')) {
            return { category: 'Tas Wanita', subcategory: 'Tas Selempang & Bahu Wanita' }
        }
        if (t.includes('dompet') || t.includes('wallet') || t.includes('pouch')) {
            return { category: 'Tas Wanita', subcategory: 'Dompet Wanita' }
        }
        if (t.includes('tote') || t.includes('totebag') || t.includes('tote bag')) {
            return { category: 'Tas Wanita', subcategory: 'Tote Bag' }
        }
        if (t.includes('clutch')) {
            return { category: 'Tas Wanita', subcategory: 'Clutch' }
        }
        if (t.includes('handbag') || t.includes('hand bag') || t.includes('top handle')) {
            return { category: 'Tas Wanita', subcategory: 'Top Handle Bag' }
        }
        return { category: 'Tas Wanita', subcategory: 'Tas Wanita Lainnya' }
    }

    // 7. Tas Pria (Checked before Pakaian Pria generic checks)
    if (t.includes('tas pria') || t.includes('dompet pria') || (t.includes('pria') && t.includes('tas')) || (t.includes('pria') && t.includes('dompet')) || t.includes('slingbag pria') || t.includes('sling bag pria') || t.includes('waistbag') || t.includes('waist bag') || t.includes('ransel pria') || t.includes('backpack pria') || t.includes('messenger bag')) {
        if (t.includes('selempang') || t.includes('sling bag') || t.includes('slingbag') || t.includes('shoulder bag') || t.includes('messenger')) {
            return { category: 'Tas Pria', subcategory: 'Tas Selempang & Bahu Pria' }
        }
        if (t.includes('dompet') || t.includes('wallet') || t.includes('dompet kartu')) {
            return { category: 'Tas Pria', subcategory: 'Dompet' }
        }
        if (t.includes('ransel') || t.includes('backpack')) {
            return { category: 'Tas Pria', subcategory: 'Ransel Pria' }
        }
        if (t.includes('pinggang') || t.includes('waistbag') || t.includes('waist bag')) {
            return { category: 'Tas Pria', subcategory: 'Tas Pinggang Pria' }
        }
        if (t.includes('laptop')) {
            return { category: 'Tas Pria', subcategory: 'Tas Laptop' }
        }
        return { category: 'Tas Pria', subcategory: 'Tas Pria Lainnya' }
    }

    // 8. Handphone & Aksesoris
    if (t.includes('case') || t.includes('casing') || t.includes('cover hp') || t.includes('softcase') || t.includes('hardcase') || t.includes('casing hp')) {
        return { category: 'Handphone & Aksesoris', subcategory: 'Casing & Cover' }
    }
    if (t.includes('charger') || t.includes('kabel data') || t.includes('fast charging') || t.includes('adaptor charger') || t.includes('kabel type c') || t.includes('kabel lightning')) {
        return { category: 'Handphone & Aksesoris', subcategory: 'Charger & Kabel' }
    }
    if (t.includes('tempered glass') || t.includes('screen protector') || t.includes('anti gores hp') || t.includes('antigores')) {
        return { category: 'Handphone & Aksesoris', subcategory: 'Screen Protector' }
    }
    if (t.includes('earphone') || t.includes('headset') || t.includes('handsfree') || t.includes('tws') || t.includes('wireless earphone') || t.includes('airpods') || t.includes('earbud')) {
        return { category: 'Handphone & Aksesoris', subcategory: 'Earphone & Headset' }
    }
    if (t.includes('powerbank') || t.includes('power bank')) {
        return { category: 'Handphone & Aksesoris', subcategory: 'Power Bank' }
    }
    if (t.includes('holder hp') || t.includes('stand hp') || t.includes('tripod hp') || t.includes('tongsis') || t.includes('gimbal hp')) {
        return { category: 'Handphone & Aksesoris', subcategory: 'Holder & Stand' }
    }

    // 9. Elektronik
    if (t.includes('speaker') || t.includes('bluetooth speaker') || t.includes('soundbar') || t.includes('microphone') || t.includes('mic bluetooth') || t.includes('pengeras suara') || t.includes('kamera') || t.includes('action cam') || t.includes('drone') || t.includes('gimbal stabilizer') || t.includes('ringlight') || t.includes('ring light') || t.includes('tripod kamera') || t.includes('tv') || t.includes('smart tv') || t.includes('monitor pc') || t.includes('bracket tv') || t.includes('laptop') || t.includes('keyboard') || t.includes('mouse') || t.includes('printer') || t.includes('router') || t.includes('mousepad') || t.includes('komputer') || t.includes('tablet') || t.includes('ipad') || t.includes('flashdisk') || t.includes('sd card') || t.includes('harddisk eksternal') || t.includes('ssd eksternal') || t.includes('memory card')) {
        if (t.includes('speaker') || t.includes('bluetooth speaker') || t.includes('soundbar') || t.includes('microphone') || t.includes('mic bluetooth')) {
            return { category: 'Elektronik', subcategory: 'Audio' }
        }
        if (t.includes('kamera') || t.includes('action cam') || t.includes('drone') || t.includes('gimbal stabilizer') || t.includes('ringlight') || t.includes('ring light')) {
            return { category: 'Elektronik', subcategory: 'Kamera & Drone' }
        }
        if (t.includes('tv') || t.includes('smart tv') || t.includes('monitor pc') || t.includes('bracket tv')) {
            return { category: 'Elektronik', subcategory: 'TV & Monitor' }
        }
        if (t.includes('laptop') || t.includes('keyboard') || t.includes('mouse') || t.includes('printer') || t.includes('router') || t.includes('mousepad') || t.includes('komputer')) {
            return { category: 'Elektronik', subcategory: 'Komputer & Laptop' }
        }
        if (t.includes('tablet') || t.includes('ipad')) {
            return { category: 'Elektronik', subcategory: 'Handphone & Tablet' }
        }
        if (t.includes('kabel hdmi') || t.includes('stop kontak') || t.includes('steker') || t.includes('colokan')) {
            return { category: 'Elektronik', subcategory: 'Aksesoris Elektronik' }
        }
        if (t.includes('flashdisk') || t.includes('sd card') || t.includes('harddisk eksternal') || t.includes('ssd eksternal') || t.includes('memory card')) {
            return { category: 'Elektronik', subcategory: 'Media Penyimpanan' }
        }
        return { category: 'Elektronik', subcategory: 'Elektronik Lainnya' }
    }

    // 10. Perawatan & Kecantikan
    if (t.includes('sabun mandi') || t.includes('body wash') || t.includes('shower gel') || t.includes('scrub tubuh') || t.includes('body scrub') || t.includes('lulur') || t.includes('deodorant') || t.includes('body lotion') || t.includes('lotion tubuh') || t.includes('hand body')) {
        return { category: 'Perawatan & Kecantikan', subcategory: 'Perawatan Tubuh' }
    }
    if (t.includes('shampoo') || t.includes('sampo') || t.includes('conditioner') || t.includes('kondisioner') || t.includes('hair tonic') || t.includes('vitamin rambut') || t.includes('serum rambut') || t.includes('hair mask') || t.includes('hair oil') || t.includes('minyak rambut')) {
        return { category: 'Perawatan & Kecantikan', subcategory: 'Perawatan Rambut' }
    }
    if (t.includes('lip cream') || t.includes('lipstick') || t.includes('lipstik') || t.includes('lip tint') || t.includes('liptint') || t.includes('lip balm') || t.includes('lipbalm') || t.includes('lip gloss') || t.includes('lip serum') || t.includes('pelembab bibir')) {
        return { category: 'Perawatan & Kecantikan', subcategory: 'Kosmetik Bibir' }
    }
    if (t.includes('foundation') || t.includes('cushion') || t.includes('bedak') || t.includes('concealer') || t.includes('blush on') || t.includes('blushon') || t.includes('highlighter') || t.includes('setting spray') || t.includes('primer wajah')) {
        return { category: 'Perawatan & Kecantikan', subcategory: 'Kosmetik Wajah' }
    }
    if (t.includes('eyeliner') || t.includes('maskara') || t.includes('mascara') || t.includes('eyeshadow') || t.includes('pensil alis') || t.includes('eyebrow')) {
        return { category: 'Perawatan & Kecantikan', subcategory: 'Kosmetik Mata' }
    }
    if (t.includes('serum wajah') || t.includes('toner') || t.includes('moisturizer') || t.includes('pelembab wajah') || t.includes('sunscreen') || t.includes('sunblock') || t.includes('facial wash') || t.includes('sabun cuci muka') || t.includes('masker wajah') || t.includes('sheet mask') || t.includes('skincare') || t.includes('skin care') || t.includes('micellar water') || t.includes('cleansing oil')) {
        return { category: 'Perawatan & Kecantikan', subcategory: 'Perawatan Wajah' }
    }
    if (t.includes('parfum') || t.includes('perfume') || t.includes('cologne') || t.includes('body mist') || t.includes('fragrance') || t.includes('wewangian')) {
        return { category: 'Perawatan & Kecantikan', subcategory: 'Parfum & Wewangian' }
    }

    // 11. Perlengkapan Rumah
    if (t.includes('rak piring') || t.includes('tempat bumbu') || t.includes('pisau dapur') || t.includes('talenan') || t.includes('tempat sampah dapur') || t.includes('wadah makanan') || t.includes('kotak bekal') || t.includes('botol minum')) {
        return { category: 'Perlengkapan Rumah', subcategory: 'Peralatan Dapur' }
    }
    if (t.includes('wajan') || t.includes('teflon') || t.includes('panci') || t.includes('spatula') || t.includes('sodet') || t.includes('steamer') || t.includes('kukusan') || t.includes('panggangan') || t.includes('frypan')) {
        return { category: 'Perlengkapan Rumah', subcategory: 'Peralatan Masak' }
    }
    if (t.includes('piring') || t.includes('mangkok') || t.includes('sendok') || t.includes('garpu') || t.includes('gelas') || t.includes('cangkir') || t.includes('sedotan')) {
        return { category: 'Perlengkapan Rumah', subcategory: 'Peralatan Makan' }
    }
    if (t.includes('sapu') || t.includes('pelan') || t.includes('alat pel') || t.includes('sikat toilet') || t.includes('deterjen') || t.includes('pewangi pakaian') || t.includes('gantungan baju') || t.includes('jemuran') || t.includes('pelembut pakaian')) {
        return { category: 'Perlengkapan Rumah', subcategory: 'Kebersihan & Binatu' }
    }
    if (t.includes('rak susun') || t.includes('kotak penyimpanan') || t.includes('storage box') || t.includes('rak gantung') || t.includes('organizer') || t.includes('rak sepatu') || t.includes('laci plastik')) {
        return { category: 'Perlengkapan Rumah', subcategory: 'Organizer Rumah' }
    }
    if (t.includes('hiasan dinding') || t.includes('jam dinding') || t.includes('cermin') || t.includes('taplak meja') || t.includes('sarung bantal sofa') || t.includes('wallpaper') || t.includes('stiker dinding') || t.includes('lampu hias') || t.includes('gorden') || t.includes('karpet') || t.includes('vas bunga')) {
        return { category: 'Perlengkapan Rumah', subcategory: 'Dekorasi' }
    }
    if (t.includes('meja') || t.includes('kursi') || t.includes('lemari') || t.includes('rak buku') || t.includes('sofa') || t.includes('laci') || t.includes('kasur busa') || t.includes('springbed')) {
        return { category: 'Perlengkapan Rumah', subcategory: 'Furniture' }
    }
    if (t.includes('handuk') || t.includes('dispenser sabun') || t.includes('sikat gigi holder') || t.includes('keset') || t.includes('shower') || t.includes('gantungan handuk') || t.includes('gayung')) {
        return { category: 'Perlengkapan Rumah', subcategory: 'Kamar Mandi' }
    }
    if (t.includes('sprei') || t.includes('bedcover') || t.includes('selimut') || t.includes('bantal') || t.includes('guling') || t.includes('kelambu') || t.includes('kasur')) {
        return { category: 'Perlengkapan Rumah', subcategory: 'Kamar Tidur' }
    }

    // 12. Ibu & Bayi
    if (t.includes('popok') || t.includes('pampers') || t.includes('diaper') || t.includes('mamy poko') || t.includes('sweety') || t.includes('merries')) {
        return { category: 'Ibu & Bayi', subcategory: 'Popok' }
    }
    if (t.includes('botol susu') || t.includes('empeng') || t.includes('teether') || t.includes('sendok bayi') || t.includes('mangkok bayi') || t.includes('celemek bayi') || t.includes('celemek makan bayi') || t.includes('dot bayi')) {
        return { category: 'Ibu & Bayi', subcategory: 'Perlengkapan Makan Bayi' }
    }
    if (t.includes('gendongan') || t.includes('baby carrier') || t.includes('hipseat')) {
        return { category: 'Ibu & Bayi', subcategory: 'Gendongan & Carrier' }
    }
    if (t.includes('baby oil') || t.includes('bedak bayi') || t.includes('tisu basah bayi') || t.includes('sabun bayi') || t.includes('minyak telon') || t.includes('telon') || t.includes('sampo bayi') || t.includes('baby cream')) {
        return { category: 'Ibu & Bayi', subcategory: 'Perawatan Bayi' }
    }
    if (t.includes('pompa asi') || t.includes('breastpad') || t.includes('baju menyusui') || t.includes('korset melahirkan') || t.includes('kantong asi')) {
        return { category: 'Ibu & Bayi', subcategory: 'Kehamilan & Ibu Menyusui' }
    }
    if (t.includes('susu formula') || t.includes('sufor') || t.includes('susu bayi') || t.includes('sgm') || t.includes('lactogen') || t.includes('morinaga')) {
        return { category: 'Ibu & Bayi', subcategory: 'Susu Formula' }
    }

    // 13. Otomotif
    if (t.includes('sarung tangan motor') || t.includes('jas hujan') || t.includes('cover motor') || t.includes('kunci ganda') || t.includes('holder hp motor') || t.includes('masker motor') || t.includes('jas hujan motor')) {
        return { category: 'Otomotif', subcategory: 'Aksesoris Motor' }
    }
    if (t.includes('knalpot') || t.includes('spion motor') || t.includes('jok motor') || t.includes('shockbreaker') || t.includes('lampu led motor') || t.includes('velg motor')) {
        return { category: 'Otomotif', subcategory: 'Aksesoris Sepeda Motor' }
    }
    if (t.includes('rantai motor') || t.includes('kampas rem motor') || t.includes('ban motor') || t.includes('aki motor') || t.includes('suku cadang motor')) {
        return { category: 'Otomotif', subcategory: 'Suku Cadang Motor' }
    }
    if (t.includes('parfum mobil') || t.includes('phone holder mobil') || t.includes('bantal mobil') || t.includes('karpet mobil') || t.includes('cover setir') || t.includes('tempat sampah mobil')) {
        return { category: 'Otomotif', subcategory: 'Aksesoris Interior Mobil' }
    }
    if (t.includes('shampoo mobil') || t.includes('kit motor') || t.includes('pembersih jamur kaca') || t.includes('compound') || t.includes('wax mobil') || t.includes('poles mobil') || t.includes('pembersih mobil')) {
        return { category: 'Otomotif', subcategory: 'Perawatan Kendaraan' }
    }
    if (t.includes('oli mesin') || t.includes('oli samping') || t.includes('oli gardan') || t.includes('pelumas rantai') || t.includes('oli yamalube') || t.includes('oli shell')) {
        return { category: 'Otomotif', subcategory: 'Oli & Pelumas Kendaraan' }
    }

    // 14. Olahraga & Outdoor
    if (t.includes('jersey') || t.includes('celana olahraga') || t.includes('manset olahraga') || t.includes('sportwear') || t.includes('legging olahraga') || t.includes('baju senam')) {
        return { category: 'Olahraga & Outdoor', subcategory: 'Pakaian Olahraga' }
    }
    if (t.includes('sepatu lari') || t.includes('sepatu running') || t.includes('sepatu futsal') || t.includes('sepatu bola') || t.includes('sepatu badminton') || t.includes('sepatu olahraga')) {
        return { category: 'Olahraga & Outdoor', subcategory: 'Sepatu Olahraga' }
    }
    if (t.includes('tenda camping') || t.includes('sleeping bag') || t.includes('carrier bag') || t.includes('kompor camping') || t.includes('senter outdoor') || t.includes('perlengkapan hiking') || t.includes('hammock')) {
        return { category: 'Olahraga & Outdoor', subcategory: 'Camping & Hiking' }
    }
    if (t.includes('sepeda') || t.includes('helm sepeda') || t.includes('lampu sepeda') || t.includes('sarung tangan sepeda') || t.includes('sadel sepeda')) {
        return { category: 'Olahraga & Outdoor', subcategory: 'Sepeda' }
    }
    if (t.includes('matras yoga') || t.includes('dumbbell') || t.includes('skipping') || t.includes('resistance band') || t.includes('barbel')) {
        return { category: 'Olahraga & Outdoor', subcategory: 'Fitness & Gym' }
    }

    // 15. Hobi & Koleksi
    if (t.includes('novel') || t.includes('komik') || t.includes('kamus') || t.includes('majalah') || t.includes('buku bacaan') || t.includes('buku cerita')) {
        return { category: 'Hobi & Koleksi', subcategory: 'Buku' }
    }
    if (t.includes('pulpen') || t.includes('pensil') || t.includes('penghapus') || t.includes('penggaris') || t.includes('buku tulis') || t.includes('binder') || t.includes('spidol') || t.includes('stiker') || t.includes('alat tulis') || t.includes('stationary')) {
        return { category: 'Hobi & Koleksi', subcategory: 'Alat Tulis' }
    }
    if (t.includes('mainan anak') || t.includes('boneka') || t.includes('slime') || t.includes('squishy') || t.includes('lego') || t.includes('mainan bayi') || t.includes('mobil mainan')) {
        return { category: 'Hobi & Koleksi', subcategory: 'Mainan' }
    }
    if (t.includes('action figure') || t.includes('gundam') || t.includes('nendoroid') || t.includes('diecast') || t.includes('hot wheels') || t.includes('hotwheels')) {
        return { category: 'Hobi & Koleksi', subcategory: 'Action Figure' }
    }
    if (t.includes('puzzle') || t.includes('board game') || t.includes('kartu uno') || t.includes('monopoli') || t.includes('kartu remi')) {
        return { category: 'Hobi & Koleksi', subcategory: 'Puzzle & Board Game' }
    }
    if (t.includes('gitar') || t.includes('ukulele') || t.includes('kalimba') || t.includes('piano') || t.includes('biola') || t.includes('organ') || t.includes('alat musik')) {
        return { category: 'Hobi & Koleksi', subcategory: 'Alat Musik' }
    }

    // 16. Souvenir & Perlengkapan Pesta
    if (t.includes('balon') || t.includes('balon foil') || t.includes('balon latex')) {
        return { category: 'Souvenir & Perlengkapan Pesta', subcategory: 'Balon' }
    }
    if (t.includes('bunga buatan') || t.includes('artificial flower') || t.includes('bunga kering') || t.includes('buket bunga') || t.includes('bunga hiasan') || t.includes('bunga plastik')) {
        return { category: 'Souvenir & Perlengkapan Pesta', subcategory: 'Bunga' }
    }
    if (t.includes('paper bag') || t.includes('paperbag') || t.includes('dus kado') || t.includes('pita kado') || t.includes('wrapping paper') || t.includes('kertas kado')) {
        return { category: 'Souvenir & Perlengkapan Pesta', subcategory: 'Pembungkus Kado & Kemasan' }
    }
    if (t.includes('lilin ulang tahun') || t.includes('banner birthday') || t.includes('topeng pesta') || t.includes('backdrop pesta') || t.includes('perlengkapan ulang tahun')) {
        return { category: 'Souvenir & Perlengkapan Pesta', subcategory: 'Perlengkapan Pesta' }
    }
    if (t.includes('souvenir pernikahan') || t.includes('hampers') || t.includes('gantungan kunci souvenir') || t.includes('kado pernikahan')) {
        return { category: 'Souvenir & Perlengkapan Pesta', subcategory: 'Souvenir & Hadiah' }
    }

    // 17. Fashion Bayi & Anak
    if (t.includes('anak perempuan') || t.includes('setelan anak cewek') || t.includes('oneset anak perempuan') || t.includes('dress anak cewek') || t.includes('baju anak perempuan')) {
        return { category: 'Fashion Bayi & Anak', subcategory: 'Pakaian Anak Perempuan' }
    }
    if (t.includes('anak laki-laki') || t.includes('setelan anak cowok') || t.includes('oneset anak laki-laki') || t.includes('baju anak cowok') || t.includes('kaos anak laki')) {
        return { category: 'Fashion Bayi & Anak', subcategory: 'Pakaian Anak Laki-Laki' }
    }
    if (t.includes('setelan anak') || t.includes('oneset anak') || t.includes('kaos anak') || t.includes('jilbab anak') || t.includes('hijab anak') || t.includes('baju anak') || t.includes('pakaian anak')) {
        return { category: 'Fashion Bayi & Anak', subcategory: 'Pakaian Anak Perempuan' } // Default to perempuan as fallback
    }

    // 18. Pakaian Wanita (Generic Fallback)
    if (t.includes('wanita') || t.includes('cewek') || t.includes('perempuan') || t.includes('bra') || t.includes('bh') || t.includes('daster') || t.includes('tunik') || t.includes('kemben') || t.includes('blouse') || t.includes('gamis') || t.includes('kulot') || t.includes('rok') || t.includes('lingerie') || t.includes('korset') || t.includes('legging') || t.includes('hotpants') || t.includes('dress') || t.includes('cardigan') || t.includes('blazer wanita')) {
        if (t.includes('bra') || t.includes('bh') || t.includes('sport bra') || t.includes('celana dalam wanita') || t.includes('korset') || t.includes('underwear wanita') || t.includes('lingerie') || t.includes('cd wanita') || t.includes('bralette') || t.includes('tanktop wanita') || t.includes('pantyd') || t.includes('kemben')) {
            return { category: 'Pakaian Wanita', subcategory: 'Pakaian Dalam' }
        }
        if (t.includes('piyama') || t.includes('daster') || t.includes('baju tidur') || t.includes('nightgown') || t.includes('sleepwear')) {
            return { category: 'Pakaian Wanita', subcategory: 'Pakaian Tidur & Piyama' }
        }
        if (t.includes('celana panjang') || t.includes('kulot') || t.includes('legging') || t.includes('sweatpants') || t.includes('jogger')) {
            return { category: 'Pakaian Wanita', subcategory: 'Celana Panjang & Legging' }
        }
        if (t.includes('celana pendek') || t.includes('hotpants') || t.includes('short')) {
            return { category: 'Pakaian Wanita', subcategory: 'Celana Pendek' }
        }
        if (t.includes('rok') || t.includes('skirt')) {
            return { category: 'Pakaian Wanita', subcategory: 'Rok' }
        }
        if (t.includes('dress') || t.includes('gaun') || t.includes('maxi') || t.includes('midi') || t.includes('mini dress')) {
            return { category: 'Pakaian Wanita', subcategory: 'Dress' }
        }
        if (t.includes('cardigan') || t.includes('sweater') || t.includes('rajut') || t.includes('knitwear') || t.includes('outer rajut')) {
            return { category: 'Pakaian Wanita', subcategory: 'Sweater & Cardigan' }
        }
        if (t.includes('hoodie') || t.includes('sweatshirt')) {
            return { category: 'Pakaian Wanita', subcategory: 'Hoodie & Sweatshirt' }
        }
        if (t.includes('jaket') || t.includes('bomber') || t.includes('parka') || t.includes('rompi') || t.includes('blazer') || t.includes('coat')) {
            return { category: 'Pakaian Wanita', subcategory: 'Jaket, Mantel, & Rompi' }
        }
        if (t.includes('set') || t.includes('setelan') || t.includes('oneset') || t.includes('one set')) {
            return { category: 'Pakaian Wanita', subcategory: 'Set' }
        }
        if (t.includes('jeans') || t.includes('denim')) {
            return { category: 'Pakaian Wanita', subcategory: 'Denim' }
        }
        if (t.includes('hamil') || t.includes('menyusui')) {
            return { category: 'Pakaian Wanita', subcategory: 'Baju Hamil' }
        }
        // Fallback for Tops
        if (t.includes('blouse') || t.includes('kemeja') || t.includes('atasan') || t.includes('kaos') || t.includes('t-shirt') || t.includes('crop top') || t.includes('tunik')) {
            return { category: 'Pakaian Wanita', subcategory: 'Atasan' }
        }
        return { category: 'Pakaian Wanita', subcategory: 'Pakaian Wanita Lainnya' }
    }

    // 19. Pakaian Pria (Generic Fallback)
    if (t.includes('pria') || t.includes('cowok') || t.includes('laki-laki') || t.includes('koko') || t.includes('sarung') || t.includes('peci') || t.includes('chino') || t.includes('boxer') || t.includes('singlet')) {
        if (t.includes('kaos') || t.includes('kemeja') || t.includes('polo') || t.includes('t-shirt') || t.includes('kaos oblong')) {
            if (t.includes('batik')) {
                return { category: 'Pakaian Pria', subcategory: 'Batik' }
            }
            return { category: 'Pakaian Pria', subcategory: 'Atasan' }
        }
        if (t.includes('celana panjang') || t.includes('chino') || t.includes('jogger') || t.includes('sweatpants') || t.includes('celana bahan')) {
            return { category: 'Pakaian Pria', subcategory: 'Celana Panjang' }
        }
        if (t.includes('celana pendek') || t.includes('boardshorts') || t.includes('kolor')) {
            return { category: 'Pakaian Pria', subcategory: 'Celana Pendek' }
        }
        if (t.includes('jaket') || t.includes('bomber') || t.includes('rompi') || t.includes('windbreaker') || t.includes('blazer') || t.includes('parka')) {
            return { category: 'Pakaian Pria', subcategory: 'Jaket, Mantel, & Rompi' }
        }
        if (t.includes('hoodie') || t.includes('sweater') || t.includes('sweatshirt')) {
            return { category: 'Pakaian Pria', subcategory: 'Hoodie & Sweatshirt' }
        }
        if (t.includes('cardigan') || t.includes('rajut')) {
            return { category: 'Pakaian Pria', subcategory: 'Sweater & Cardigan' }
        }
        if (t.includes('boxer') || t.includes('celana dalam') || t.includes('cd pria') || t.includes('singlet') || t.includes('underwear') || t.includes('briefs')) {
            return { category: 'Pakaian Pria', subcategory: 'Pakaian Dalam' }
        }
        if (t.includes('piyama') || t.includes('baju tidur')) {
            return { category: 'Pakaian Pria', subcategory: 'Pakaian Tidur' }
        }
        if (t.includes('batik') || t.includes('kemko')) {
            return { category: 'Pakaian Pria', subcategory: 'Batik' }
        }
        if (t.includes('jeans') || t.includes('denim')) {
            return { category: 'Pakaian Pria', subcategory: 'Denim' }
        }
        if (t.includes('setelan') || t.includes('set pakaian')) {
            return { category: 'Pakaian Pria', subcategory: 'Set Pakaian Pria' }
        }
        return { category: 'Pakaian Pria', subcategory: 'Pakaian Pria Lainnya' }
    }

    // 20. Gender-neutral Fashion Catch-all
    // Products without explicit gender keywords but with clear clothing terms
    // Default to Pakaian Wanita since Roxy Store is primarily women's fashion

    // Underwear / innerwear (no gender specified)
    if (t.includes('celana dalam') || t.includes('cd ') || t.includes('panty') || t.includes('pantie') || t.includes('g-string') || t.includes('thong') || t.includes('shaper') || t.includes('korset') || t.includes('pengangkat pantat') || t.includes('bokong')) {
        return { category: 'Pakaian Wanita', subcategory: 'Pakaian Dalam' }
    }

    // Maternity (no gender needed — always women)
    if (t.includes('hamil') || t.includes('maternity') || t.includes('pregnant') || t.includes('menyusui')) {
        return { category: 'Pakaian Wanita', subcategory: 'Baju Hamil' }
    }

    // Jeans / denim (no gender specified)
    if (t.includes('jeans') || t.includes('denim') || t.includes('baggy') || t.includes('highwaist') || t.includes('high waist')) {
        return { category: 'Pakaian Wanita', subcategory: 'Denim' }
    }

    // Kebaya / traditional
    if (t.includes('kebaya') || t.includes('kutubaru') || t.includes('kutu baru')) {
        return { category: 'Pakaian Wanita', subcategory: 'Atasan' }
    }

    // Piyama / sleepwear (no gender)
    if (t.includes('piyama') || t.includes('pyjama') || t.includes('pajama') || t.includes('baju tidur') || t.includes('sleepwear') || t.includes('nightgown') || t.includes('daster')) {
        return { category: 'Pakaian Wanita', subcategory: 'Pakaian Tidur & Piyama' }
    }

    // Kaos kaki / socks
    if (t.includes('kaos kaki') || t.includes('kaus kaki') || t.includes('socks') || t.includes('ankle socks') || t.includes('jempol')) {
        return { category: 'Aksesoris', subcategory: 'Aksesoris Lainnya' }
    }

    // Generic tops (crop top, t-shirt, bodysuit, kemeja, blouse, atasan, knit top)
    if (t.includes('crop top') || t.includes('bodysuit') || t.includes('tube top') || t.includes('tank top') || t.includes('tanktop') || t.includes('knit top') || t.includes('plisket') || t.includes('pleats')) {
        return { category: 'Pakaian Wanita', subcategory: 'Atasan' }
    }
    if (t.includes('t-shirt') || t.includes('tshirt') || t.includes('t shirt') || t.includes('kaos') || t.includes('kaus')) {
        return { category: 'Pakaian Wanita', subcategory: 'Atasan' }
    }
    if (t.includes('kemeja') || t.includes('blouse') || t.includes('shirt') || t.includes('polo')) {
        return { category: 'Pakaian Wanita', subcategory: 'Atasan' }
    }
    if (t.includes('atasan') || t.includes('top') || t.includes('longsleeve') || t.includes('long sleeve')) {
        return { category: 'Pakaian Wanita', subcategory: 'Atasan' }
    }

    // Generic outerwear (jaket, blazer, cardigan, sweater, hoodie, coat)
    if (t.includes('jaket') || t.includes('jacket') || t.includes('blazer') || t.includes('coat') || t.includes('bomber') || t.includes('parka') || t.includes('overcoat')) {
        return { category: 'Pakaian Wanita', subcategory: 'Jaket, Mantel, & Rompi' }
    }
    if (t.includes('cardigan') || t.includes('sweater') || t.includes('rajut') || t.includes('knit') || t.includes('knitwear')) {
        return { category: 'Pakaian Wanita', subcategory: 'Sweater & Cardigan' }
    }
    if (t.includes('hoodie') || t.includes('sweatshirt') || t.includes('oversized') || t.includes('oversize')) {
        return { category: 'Pakaian Wanita', subcategory: 'Hoodie & Sweatshirt' }
    }

    // Generic bottoms
    if (t.includes('celana') || t.includes('pants') || t.includes('trousers')) {
        return { category: 'Pakaian Wanita', subcategory: 'Celana Panjang & Legging' }
    }
    if (t.includes('rok') || t.includes('skirt')) {
        return { category: 'Pakaian Wanita', subcategory: 'Rok' }
    }

    // Sets
    if (t.includes('setelan') || t.includes('set ') || t.includes('oneset') || t.includes('one set') || t.includes('bundling') || t.includes('paket')) {
        return { category: 'Pakaian Wanita', subcategory: 'Set' }
    }

    // Jumpsuit / overall / romper
    if (t.includes('jumpsuit') || t.includes('overall') || t.includes('romper') || t.includes('playsuit')) {
        return { category: 'Pakaian Wanita', subcategory: 'Dress' }
    }

    // Outer / rompi (vest/outerwear without specific gender)
    if (t.includes('outer') || t.includes('rompi') || t.includes('vest')) {
        return { category: 'Pakaian Wanita', subcategory: 'Jaket, Mantel, & Rompi' }
    }

    // Baby tee / slimfit tee / basic tee
    if (t.includes('baby tee') || t.includes('slim fit') || t.includes('slimfit') || t.includes('basic tee') || t.includes('outfit')) {
        return { category: 'Pakaian Wanita', subcategory: 'Atasan' }
    }

    // Generic bag/backpack/ransel (without gender keyword)
    if (t.includes('ransel') || t.includes('backpack') || t.includes('tas ') || t.includes('bag ') || t.includes('drawstring')) {
        return { category: 'Tas Wanita', subcategory: 'Ransel Wanita' }
    }

    return null
}
