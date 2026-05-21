// Test scraper function directly (without Cloudinary)
// This mimics what the import route does

import { 
    extractShopeeImages, 
    extractCategoryFromHtml, 
    cleanShopeeTitle, 
    cleanShopeeDescription, 
    getMetaContent,
    extractShopeeIds,
    cleanShopeeImageUrl,
    generateFallbackDescription,
} from '../lib/shopee-scraper'

const fs = require('fs')
const path = require('path')

interface ScrapedData {
    title: string
    description: string
    category: string
    images: string[]
    imageUrl: string
}

async function scrapeWithoutCloudinary(url: string): Promise<ScrapedData> {
    // Step 1: Fetch short URL
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_codedoc.html)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9',
        },
        redirect: 'follow'
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const html = await response.text()
    const finalUrl = response.url

    let title = cleanShopeeTitle(getMetaContent(html, 'og:title') || getMetaContent(html, 'twitter:title') || '')
    let description = cleanShopeeDescription(getMetaContent(html, 'og:description') || '')
    let rawImageUrl = getMetaContent(html, 'og:square_image') || getMetaContent(html, 'og:image') || ''
    let category = extractCategoryFromHtml(html)
    let extractedImages = extractShopeeImages(html)

    // Step 2: Desktop URL
    const alWebUrl = getMetaContent(html, 'al:web:url')
    let ids = extractShopeeIds(url) || extractShopeeIds(finalUrl)
    if (!ids && alWebUrl) ids = extractShopeeIds(alWebUrl)

    if (ids) {
        const desktopUrl = `https://shopee.co.id/product/${ids.shopId}/${ids.itemId}`
        try {
            const dRes = await fetch(desktopUrl, {
                headers: {
                    'User-Agent': 'facebookexternalhit/1.1',
                    'Accept': 'text/html',
                },
                redirect: 'follow'
            })
            if (dRes.ok) {
                const dHtml = await dRes.text()
                if (!category) category = extractCategoryFromHtml(dHtml)
                if (!title) title = cleanShopeeTitle(getMetaContent(dHtml, 'og:title') || '')
                if (!description) description = cleanShopeeDescription(getMetaContent(dHtml, 'og:description') || '')
                if (!rawImageUrl) rawImageUrl = getMetaContent(dHtml, 'og:image') || ''
                const dImages = extractShopeeImages(dHtml)
                for (const img of dImages) {
                    if (!extractedImages.includes(img)) extractedImages.push(img)
                }
            }
        } catch {}
    }

    if (!description && title) description = generateFallbackDescription(title)

    const cleanedImage = cleanShopeeImageUrl(rawImageUrl)
    extractedImages = extractedImages.filter(img => cleanShopeeImageUrl(img) !== cleanedImage)
    const allImages = [cleanedImage || rawImageUrl, ...extractedImages].filter(Boolean)
    const uniqueImages = Array.from(new Set(allImages))

    return {
        title,
        description,
        category,
        images: uniqueImages,
        imageUrl: uniqueImages[0] || ''
    }
}

// ===== TEST 1: Single Link =====
async function testSingleLink() {
    console.log('========================================')
    console.log('TEST 1: Single Link - https://s.shopee.co.id/1BJLxhR2uv')
    console.log('========================================\n')

    const result = await scrapeWithoutCloudinary('https://s.shopee.co.id/1BJLxhR2uv')
    
    console.log('✅ Title:', result.title)
    console.log('✅ Category:', result.category)
    console.log('✅ Description (first 150 chars):', result.description.substring(0, 150))
    console.log('✅ Main Image:', result.imageUrl.substring(0, 80))
    console.log(`✅ Total Images: ${result.images.length}`)
    result.images.slice(0, 5).forEach((img, i) => console.log(`   [${i}] ${img.substring(0, 80)}`))
    if (result.images.length > 5) console.log(`   ... and ${result.images.length - 5} more`)
    
    return result
}

// ===== TEST 2: CSV Import Simulation =====
async function testCsvImport() {
    console.log('\n\n========================================')
    console.log('TEST 2: CSV Import - First 3 rows')
    console.log('========================================\n')

    const csvPath = path.join(__dirname, '..', 'test program', 'LinkProdukSekaligus20260521193146-b9ffa90b0d64446a98da889bd4b75c8c.csv')
    const content = fs.readFileSync(csvPath, 'utf-8')
    const lines = content.split('\n')
    
    // Parse header
    const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''))
    
    // Parse rows (CSV with quotes)
    function parseRow(line: string) {
        const values: string[] = []
        let current = ''
        let inQuotes = false
        for (const char of line) {
            if (char === '"') inQuotes = !inQuotes
            else if (char === ',' && !inQuotes) { values.push(current.trim()); current = '' }
            else current += char
        }
        values.push(current.trim())
        return values
    }
    
    const fieldMap: Record<string, string> = {
        'nama produk': 'title',
        'harga': 'price',
        'penjualan': 'shopeeSold',
        'link komisi ekstra': 'shopeeUrl',
    }
    
    // Test first 3 products
    for (let i = 1; i <= 3; i++) {
        if (!lines[i]?.trim()) continue
        
        const values = parseRow(lines[i])
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => {
            const key = fieldMap[h.toLowerCase()]
            if (key) row[key] = values[idx] || ''
        })
        
        console.log(`\n--- Product ${i} ---`)
        console.log(`CSV title: "${row.title?.substring(0, 60)}..."`)
        console.log(`CSV price: "${row.price}"`)
        console.log(`CSV sold: "${row.shopeeSold}"`)
        console.log(`CSV shopeeUrl: "${row.shopeeUrl}"`)
        
        if (row.shopeeUrl) {
            try {
                const scraped = await scrapeWithoutCloudinary(row.shopeeUrl)
                console.log(`\n  Scraped title: "${scraped.title?.substring(0, 60)}"`)
                console.log(`  Scraped category: "${scraped.category}"`)
                console.log(`  Scraped images: ${scraped.images.length}`)
                console.log(`  Scraped description (first 100): "${scraped.description?.substring(0, 100)}"`)
                console.log('  ✅ SUCCESS')
            } catch (err: any) {
                console.log(`  ❌ SCRAPE ERROR: ${err.message}`)
            }
        }
    }
    
    // Count total
    console.log(`\n✅ Total products in CSV: ${lines.filter(l => l.trim()).length - 1}`)
}

async function main() {
    try { await testSingleLink() } catch (e: any) { console.error('TEST 1 FAILED:', e.message) }
    try { await testCsvImport() } catch (e: any) { console.error('TEST 2 FAILED:', e.message) }
    console.log('\n=== ALL TESTS COMPLETE ===')
}

main()
