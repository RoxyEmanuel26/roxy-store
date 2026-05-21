const fs = require('fs');
const path = require('path');

function decodeHtmlEntities(str) {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

function cleanShopeeTitle(title) {
    let clean = title.trim();
    if (clean.toLowerCase().startsWith('jual ')) {
        clean = clean.substring(5);
    }
    const suffix = ' | Shopee Indonesia';
    if (clean.toLowerCase().endsWith(suffix.toLowerCase())) {
        clean = clean.substring(0, clean.length - suffix.length);
    }
    return clean.trim();
}

function getMetaContent(html, propertyOrName) {
    const metaTags = html.match(/<meta[^>]+>/gi) || [];
    for (const tag of metaTags) {
        const hasProp = tag.includes(`property="${propertyOrName}"`) || 
                        tag.includes(`property='${propertyOrName}'`) ||
                        tag.includes(`name="${propertyOrName}"`) ||
                        tag.includes(`name='${propertyOrName}'`);
        if (hasProp) {
            const contentMatch = tag.match(/content="([^"]+)"/i) || tag.match(/content='([^']+)'/i);
            if (contentMatch) {
                return decodeHtmlEntities(contentMatch[1]);
            }
        }
    }
    return null;
}

function cleanShopeeDescription(description) {
    if (!description) return '';
    const lower = description.toLowerCase();
    if (
        lower.includes('terbaru harga murah di shopee') ||
        lower.includes('beli produk ini di shopee') ||
        (lower.startsWith('beli ') && lower.includes('di shopee.'))
    ) {
        return '';
    }
    return description.trim();
}

function extractCategoryFromHtml(html) {
    const ldJsons = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const tag of ldJsons) {
        try {
            const cleanJson = tag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
            const obj = JSON.parse(cleanJson);
            if (obj['@type'] === 'BreadcrumbList' && obj.itemListElement && Array.isArray(obj.itemListElement)) {
                const secondItem = obj.itemListElement.find(el => el.position === 2) || obj.itemListElement[1];
                if (secondItem) {
                    if (secondItem.item && secondItem.item.name) {
                        return secondItem.item.name.trim();
                    } else if (secondItem.name) {
                        return secondItem.name.trim();
                    }
                }
            }
        } catch {
            // ignore
        }
    }
    return '';
}

function extractShopeeIds(url) {
    const productMatch = url.match(/\/product\/(\d+)\/(\d+)/i);
    if (productMatch) {
        return { shopId: productMatch[1], itemId: productMatch[2] };
    }
    const hyphenIMatch = url.match(/-i\.(\d+)\.(\d+)/i);
    if (hyphenIMatch) {
        return { shopId: hyphenIMatch[1], itemId: hyphenIMatch[2] };
    }
    const userMatch = url.match(/shopee\.co\.id\/([^/]+)\/(\d+)\/(\d+)/i);
    if (userMatch) {
        const reserved = ['product', 'api', 'cart', 'checkout', 'buyer', 'user', 'search', 'category'];
        if (!reserved.includes(userMatch[1].toLowerCase())) {
            return { shopId: userMatch[2], itemId: userMatch[3] };
        }
    }
    return null;
}

function cleanShopeeImageUrl(url) {
    if (!url) return '';
    let cleaned = url.split('?')[0];
    cleaned = cleaned.replace(/(_tn|@resize.*)$/i, '');
    return cleaned;
}

function extractShopeeImages(html) {
    const images = [];

    // 1. Extract from JSON-LD Product schema
    const ldJsons = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const tag of ldJsons) {
        try {
            const cleanJson = tag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
            const obj = JSON.parse(cleanJson);
            if (obj['@type'] === 'Product' && obj.image) {
                const imgArr = Array.isArray(obj.image) ? obj.image : [obj.image];
                for (const imgUrl of imgArr) {
                    if (typeof imgUrl === 'string' && imgUrl.includes('susercontent.com')) {
                        const cleaned = cleanShopeeImageUrl(imgUrl);
                        if (cleaned && !images.includes(cleaned)) {
                            images.push(cleaned);
                        }
                    }
                }
            }
        } catch {
            // ignore
        }
    }

    // 2. Extract from <img> and <source> tags
    const tags = html.match(/<(?:img|source)\b[^>]*>/gi) || [];
    const cdnUrlRegex = /https:\/\/(?:[a-z0-9-.]+\.img\.susercontent\.com|cf\.shopee\.[a-z.]+)\/file\/[a-zA-Z0-9_-]+/gi;
    
    for (const tag of tags) {
        const isAvatar = /class=["'][^"']*(?:avatar|OUM_RU|shop-avatar|shopee-avatar)[^"']*["']/i.test(tag);
        if (isAvatar) continue;
        
        let match;
        cdnUrlRegex.lastIndex = 0;
        while ((match = cdnUrlRegex.exec(tag)) !== null) {
            const cleaned = cleanShopeeImageUrl(match[0]);
            if (cleaned && !images.includes(cleaned)) {
                images.push(cleaned);
            }
        }
    }

    // 3. Scan entire HTML for CDN URLs
    const globalCdnRegex = /https:\/\/(?:[a-zA-Z0-9-.]+\.img\.susercontent\.com|cf\.shopee\.[a-z.]+)\/file\/[a-zA-Z0-9_-]+/gi;
    let globalMatch;
    while ((globalMatch = globalCdnRegex.exec(html)) !== null) {
        const cleaned = cleanShopeeImageUrl(globalMatch[0]);
        if (cleaned && !images.includes(cleaned)) {
            images.push(cleaned);
        }
    }

    return images;
}

async function scrapeShopeeProduct(url) {
    if (!url || !url.includes('shopee.co.id')) {
        throw new Error('URL harus berupa link Shopee Indonesia');
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
    });

    if (!response.ok) {
        throw new Error(`Gagal mengambil halaman Shopee (Status: ${response.status})`);
    }

    const html = await response.text();
    const finalUrl = response.url;

    const rawTitle = getMetaContent(html, 'og:title') || getMetaContent(html, 'twitter:title') || '';
    let title = cleanShopeeTitle(rawTitle);

    const rawDescription = getMetaContent(html, 'og:description') || getMetaContent(html, 'description') || '';
    let description = cleanShopeeDescription(rawDescription);
    
    let rawImageUrl = getMetaContent(html, 'og:square_image') || getMetaContent(html, 'og:image') || '';
    let category = extractCategoryFromHtml(html);

    let extractedImages = extractShopeeImages(html);

    const alWebUrl = getMetaContent(html, 'al:web:url');
    let ids = extractShopeeIds(url) || extractShopeeIds(finalUrl);
    if (!ids && alWebUrl) {
        ids = extractShopeeIds(alWebUrl);
    }

    if (ids) {
        const desktopUrl = `https://shopee.co.id/product/${ids.shopId}/${ids.itemId}`;
        console.log('Fetching Desktop URL to get extra details:', desktopUrl);
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
            });
            if (desktopResponse.ok) {
                const desktopHtml = await desktopResponse.text();
                
                if (!category) {
                    category = extractCategoryFromHtml(desktopHtml);
                }
                if (!title) {
                    const desktopRawTitle = getMetaContent(desktopHtml, 'og:title') || getMetaContent(desktopHtml, 'twitter:title') || '';
                    title = cleanShopeeTitle(desktopRawTitle);
                }
                if (!description) {
                    const desktopRawDesc = getMetaContent(desktopHtml, 'og:description') || getMetaContent(desktopHtml, 'description') || '';
                    description = cleanShopeeDescription(desktopRawDesc);
                }
                if (!rawImageUrl) {
                    rawImageUrl = getMetaContent(desktopHtml, 'og:square_image') || getMetaContent(desktopHtml, 'og:image') || '';
                }

                const desktopImages = extractShopeeImages(desktopHtml);
                console.log(`Found ${desktopImages.length} images on Desktop URL`);
                for (const img of desktopImages) {
                    if (!extractedImages.includes(img)) {
                        extractedImages.push(img);
                    }
                }
            } else {
                console.log(`Desktop URL fetch returned non-200 status: ${desktopResponse.status}`);
            }
        } catch (err) {
            console.error('Failed to fetch desktop URL:', err);
        }
    }

    const cleanedRawImageUrl = cleanShopeeImageUrl(rawImageUrl);
    extractedImages = extractedImages.filter(img => cleanShopeeImageUrl(img) !== cleanedRawImageUrl);

    const finalUniqueImages = [cleanedRawImageUrl || rawImageUrl, ...extractedImages].filter(Boolean);
    const uniqueImagesSet = Array.from(new Set(finalUniqueImages));

    return {
        title,
        description,
        imageUrl: cleanedRawImageUrl || rawImageUrl,
        category,
        images: uniqueImagesSet
    };
}

async function run() {
    const url = 'https://s.shopee.co.id/1BJLxhR2uv';
    console.log('Testing scraper self-contained on URL:', url);
    const result = await scrapeShopeeProduct(url);
    console.log('\n--- SCRAPE RESULTS ---');
    console.log('Title:', result.title);
    console.log('Category:', result.category);
    console.log('Main Image:', result.imageUrl);
    console.log('All Scraped Images (Total:', result.images.length, '):');
    result.images.forEach((img, index) => {
        console.log(`  [${index}]: ${img}`);
    });
}

run().catch(console.error);
