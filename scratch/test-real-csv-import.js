const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');
const Papa = require('papaparse');
const cloudinary = require('cloudinary').v2;

// Load environment variables manually from .env and .env.local
function loadEnv() {
    const paths = ['.env', '.env.local'];
    paths.forEach(p => {
        const fullPath = path.resolve(process.cwd(), p);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            content.split('\n').forEach(line => {
                const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
                if (match) {
                    const key = match[1];
                    let value = match[2] || '';
                    // Remove quotes if present
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.substring(1, value.length - 1);
                    } else if (value.startsWith("'") && value.endsWith("'")) {
                        value = value.substring(1, value.length - 1);
                    }
                    process.env[key] = value.trim();
                }
            });
            console.log(`Loaded env from ${p}`);
        }
    });
}

loadEnv();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const prisma = new PrismaClient();

// Helper functions copied from app/api/admin/products/import/route.ts
function cleanNumberString(val) {
    let str = val.trim();
    str = str.replace(/^(rp|idr|usd|sgd)\.?\s*/i, '');
    str = str.replace(/[^\d.,-]/g, '');
    if (!str) return '0';

    const hasDot = str.includes('.');
    const hasComma = str.includes(',');

    if (hasDot && hasComma) {
        const dotIndex = str.lastIndexOf('.');
        const commaIndex = str.lastIndexOf(',');
        if (dotIndex > commaIndex) {
            str = str.replace(/,/g, '');
        } else {
            str = str.replace(/\./g, '').replace(/,/g, '.');
        }
    } else if (hasComma) {
        const parts = str.split(',');
        const lastPart = parts[parts.length - 1];
        if (lastPart.length === 3 && parts.length > 1) {
            str = str.replace(/,/g, '');
        } else {
            str = str.replace(/,/g, '.');
        }
    } else if (hasDot) {
        const parts = str.split('.');
        const lastPart = parts[parts.length - 1];
        if (lastPart.length === 3 && parts.length > 1) {
            str = str.replace(/\./g, '');
        }
    }
    return str;
}

function parseStringWithMultipliers(val) {
    if (val === '' || val === undefined || val === null) return 0;
    let str = String(val).trim().toLowerCase();
    str = str.replace(/^(rp|idr|usd|sgd)\.?\s*/i, '');
    
    let multiplier = 1;
    if (str.includes('ribu') || str.endsWith('rb') || str.endsWith('k')) {
        multiplier = 1000;
        str = str.replace(/ribu|rb|\+/g, '').replace(/k/g, '').trim();
    } else if (str.includes('juta') || str.endsWith('jt')) {
        multiplier = 1000000;
        str = str.replace(/juta|jt|\+/g, '').trim();
    } else {
        str = str.replace(/\+/g, '').trim();
    }
    
    if (multiplier > 1) {
        const partsComma = str.split(',');
        const partsDot = str.split('.');
        if (partsComma.length === 2 && partsDot.length === 1) {
            str = str.replace(',', '.');
        } else {
            str = cleanNumberString(str);
        }
    } else {
        str = cleanNumberString(str);
    }
    
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed * multiplier;
}

function parseCsvPrice(val) {
    return parseStringWithMultipliers(val);
}

function parseCsvPriceOrUndefined(val) {
    if (val === '' || val === undefined || val === null) return undefined;
    const price = parseCsvPrice(val);
    return price > 0 ? price : undefined;
}

function parseCsvSold(val) {
    if (val === '' || val === undefined || val === null) return undefined;
    const sold = Math.round(parseStringWithMultipliers(val));
    return sold >= 0 ? sold : undefined;
}

function parseCsvFloat(val) {
    if (val === '' || val === undefined || val === null) return undefined;
    const cleaned = cleanNumberString(String(val));
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? undefined : parsed;
}

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
        } catch (e) {}
    }
    return '';
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

    const alWebUrl = getMetaContent(html, 'al:web:url');
    let ids = extractShopeeIds(url) || extractShopeeIds(finalUrl);
    if (!ids && alWebUrl) {
        ids = extractShopeeIds(alWebUrl);
    }

    if (ids) {
        const desktopUrl = `https://shopee.co.id/product/${ids.shopId}/${ids.itemId}`;
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
            }
        } catch (err) {
            console.error('Failed to fetch desktop URL for extra details:', err.message);
        }
    }

    let imageUrl = '';
    if (rawImageUrl) {
        try {
            console.log(`Uploading ${rawImageUrl} to Cloudinary...`);
            const uploadRes = await cloudinary.uploader.upload(rawImageUrl, {
                folder: 'Roxy-lay/products',
                transformation: [
                    { width: 1200, height: 1200, crop: 'limit' },
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' },
                ],
            });
            imageUrl = uploadRes.secure_url;
            console.log(`Cloudinary Upload Success: ${imageUrl}`);
        } catch (err) {
            console.error('Failed to upload image to Cloudinary during scraping:', err.message);
            imageUrl = rawImageUrl;
        }
    }

    return {
        title,
        description,
        imageUrl,
        rawImageUrl,
        category
    };
}


async function runImport() {
    const csvPath = path.resolve(process.cwd(), 'test program/LinkProdukSekaligus20260521193146-b9ffa90b0d64446a98da889bd4b75c8c.csv');
    console.log('Reading CSV file:', csvPath);

    const fileContent = fs.readFileSync(csvPath, 'utf8');

    // Parse CSV
    const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0) {
        console.error('Error parsing CSV:', parseResult.errors);
        return;
    }

    const data = parseResult.data;
    console.log(`Parsed ${data.length} rows from CSV`);

    // Field mapping
    const fieldMap = {
        title: 'title',
        description: 'description',
        price: 'price',
        originalprice: 'originalPrice',
        originalPrice: 'originalPrice',
        image: 'image',
        images: 'images',
        shopeeurl: 'shopeeUrl',
        shopeerating: 'shopeeRating',
        shopeeRating: 'shopeeRating',
        shopeesold: 'shopeeSold',
        shopeeSold: 'shopeeSold',
        category: 'category',
        badge: 'badge',
        isactive: 'isActive',
        isActive: 'isActive',
        shopeeUrl: 'shopeeUrl',

        // Indonesian
        judul: 'title',
        nama: 'title',
        deskripsi: 'description',
        detail: 'description',
        harga: 'price',
        harga_asal: 'originalPrice',
        hargaasal: 'originalPrice',
        harga_coret: 'originalPrice',
        hargacoret: 'originalPrice',
        gambar: 'image',
        foto: 'image',
        gambar_galeri: 'images',
        galeri: 'images',
        fotogaleri: 'images',
        shopee_url: 'shopeeUrl',
        link_shopee: 'shopeeUrl',
        shopee_rating: 'shopeeRating',
        rating_shopee: 'shopeeRating',
        shopee_terjual: 'shopeeSold',
        terjual_shopee: 'shopeeSold',
        terjual: 'shopeeSold',
        kategori: 'category',
        aktif: 'isActive',

        // Shopee mass affiliate CSV
        'nama produk': 'title',
        'penjualan': 'shopeeSold',
        'link komisi ekstra': 'shopeeUrl',
    };

    const normalizedData = data.map((row) => {
        const normalized = {};
        for (const [key, value] of Object.entries(row)) {
            const cleanKey = key.trim();
            const mappedKey = fieldMap[cleanKey] || fieldMap[cleanKey.toLowerCase()] || cleanKey;
            normalized[mappedKey] = value;
        }
        return normalized;
    });

    // We will only import 3 rows for testing first, to make sure it doesn't take forever, 
    // but wait! The user wants us to test adding the file to ensure the program has run appropriately.
    // Let's run all of them or run them sequentially, printing logs. Let's do it!
    console.log('Normalized first row:', normalizedData[0]);

    // Cache categories
    const existingCategories = await prisma.category.findMany();
    const categoryMap = new Map();
    for (const cat of existingCategories) {
        categoryMap.set(cat.name.toLowerCase(), cat.id);
    }

    let created = 0;
    let updated = 0;
    let errors = 0;
    const results = [];

    // Let's limit the scraping: if Cloudinary credentials are not present, or if scraping is too slow,
    // let's run them. Let's process the first 5 rows to be fully thorough without overloading resources, 
    // or run them all. Let's process all 29 rows but with concurrency or one by one.
    // Wait, let's process them one by one. To speed it up, let's add a timeout/concurrency or log progress clearly.
    // Let's print the status.
    for (let i = 0; i < normalizedData.length; i++) {
        const rawProduct = normalizedData[i];
        const rowNum = i + 2;
        const shopeeUrl = rawProduct.shopeeUrl || '';

        console.log(`\n--- Processing Row ${rowNum}/${normalizedData.length + 1}: ${rawProduct.title} ---`);

        try {
            // Price conversion
            const price = parseCsvPrice(rawProduct.price);
            const originalPrice = parseCsvPriceOrUndefined(rawProduct.originalPrice);
            const shopeeSold = parseCsvSold(rawProduct.shopeeSold);
            const shopeeRating = parseCsvFloat(rawProduct.shopeeRating);
            const categoryName = (rawProduct.category || 'Other').trim();
            const badge = rawProduct.badge || '';
            const isActive = rawProduct.isActive === undefined || rawProduct.isActive === '' ? true : (rawProduct.isActive === 'true' || rawProduct.isActive === '1');

            let title = rawProduct.title ? rawProduct.title.trim() : '';
            let description = rawProduct.description ? rawProduct.description.trim() : '';
            let imageUrl = rawProduct.image || '';

            if (!title) {
                results.push({ row: rowNum, title: '(kosong)', status: 'error', error: 'Judul wajib diisi' });
                errors++;
                continue;
            }

            // Duplication check based on shopeeUrl
            if (shopeeUrl) {
                const existingByShopeeUrl = await prisma.product.findFirst({
                    where: { shopeeUrl }
                });
                if (existingByShopeeUrl) {
                    console.log(`Duplicate found for URL: ${shopeeUrl}. Skipping.`);
                    results.push({
                        row: rowNum,
                        title,
                        status: 'error',
                        error: 'Duplikat (Tautan Shopee sudah ada)'
                    });
                    errors++;
                    continue;
                }
            }

            // Scraping on-the-fly for new products
            let scrapedCategory = '';
            if (shopeeUrl && (!description || !imageUrl || !categoryName || categoryName === 'Other')) {
                try {
                    console.log(`Scraping details for: ${shopeeUrl}`);
                    const scraped = await scrapeShopeeProduct(shopeeUrl);
                    if (!title && scraped.title) {
                        title = scraped.title;
                    }
                    if (!description && scraped.description) {
                        description = scraped.description;
                    }
                    if (!imageUrl && scraped.imageUrl) {
                        imageUrl = scraped.imageUrl;
                    }
                    if (scraped.category) {
                        scrapedCategory = scraped.category;
                    }
                } catch (err) {
                    console.error(`Failed scraping on-the-fly for URL: ${shopeeUrl}`, err.message);
                }
            }

            if (!description) {
                description = 'Deskripsi belum tersedia';
            }

            if (!imageUrl) {
                imageUrl = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'; // fallback image placeholder
            }

            const slug = slugify(title, { lower: true, locale: 'id', strict: true });

            // Resolve category
            const finalCategoryName = scrapedCategory || categoryName || 'Other';
            let categoryId = categoryMap.get(finalCategoryName.toLowerCase());
            if (!categoryId) {
                const catSlug = slugify(finalCategoryName, { lower: true, locale: 'id', strict: true });
                const newCategory = await prisma.category.create({
                    data: {
                        name: finalCategoryName,
                        slug: catSlug || `cat-${Date.now()}`,
                    },
                });
                categoryId = newCategory.id;
                categoryMap.set(finalCategoryName.toLowerCase(), categoryId);
                console.log(`Created new category: ${finalCategoryName}`);
            }

            const imageUrls = rawProduct.images
                ? rawProduct.images.split(/[|,;]/).map(u => u.trim()).filter(Boolean)
                : [];

            // Check if product with same slug exists
            const existing = await prisma.product.findUnique({
                where: { slug },
            });

            if (existing) {
                await prisma.product.update({
                    where: { id: existing.id },
                    data: {
                        title,
                        description: description || existing.description,
                        price: price || existing.price,
                        originalPrice: originalPrice ?? existing.originalPrice,
                        image: imageUrl || existing.image,
                        images: imageUrls.length > 0 ? imageUrls : existing.images,
                        shopeeUrl: shopeeUrl || existing.shopeeUrl,
                        shopeeRating: shopeeRating ?? existing.shopeeRating,
                        shopeeSold: shopeeSold ?? existing.shopeeSold,
                        categoryId,
                        badge: badge || existing.badge,
                        isActive,
                    },
                });
                console.log(`Updated existing product: ${title}`);
                results.push({ row: rowNum, title, status: 'updated' });
                updated++;
            } else {
                let finalSlug = slug;
                const slugCheck = await prisma.product.findUnique({ where: { slug: finalSlug } });
                if (slugCheck) {
                    finalSlug = `${slug}-${Date.now()}`;
                }

                await prisma.product.create({
                    data: {
                        title,
                        slug: finalSlug,
                        description,
                        price,
                        originalPrice: originalPrice ?? null,
                        image: imageUrl,
                        images: imageUrls,
                        shopeeUrl: shopeeUrl,
                        shopeeRating: shopeeRating ?? null,
                        shopeeSold: shopeeSold ?? null,
                        categoryId,
                        badge: badge || null,
                        isActive,
                    },
                });
                console.log(`Created new product: ${title}`);
                results.push({ row: rowNum, title, status: 'created' });
                created++;
            }

        } catch (err) {
            console.error(`Error at row ${rowNum}:`, err);
            results.push({ row: rowNum, title: rawProduct.title || '(kosong)', status: 'error', error: err.message });
            errors++;
        }
    }

    console.log('\n=================================');
    console.log('CSV Import Simulation Summary:');
    console.log(`Total rows processed: ${normalizedData.length}`);
    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);
    console.log(`Errors: ${errors}`);
    console.log('=================================');
}

runImport()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
