// COMPREHENSIVE TEST: Test both single link scraping and CSV import logic
// This tests the actual scrapeShopeeProduct function without Cloudinary upload

import { 
    extractShopeeImages, 
    extractCategoryFromHtml, 
    cleanShopeeTitle, 
    cleanShopeeDescription, 
    getMetaContent,
    extractShopeeIds,
    cleanShopeeImageUrl
} from '../lib/shopee-scraper'

// === TEST 1: Single Link Scraping ===
async function testSingleLinkScraping() {
    console.log('========================================')
    console.log('TEST 1: Single Link Scraping')
    console.log('========================================')
    
    const url = 'https://s.shopee.co.id/1BJLxhR2uv'
    console.log('URL:', url)
    
    // Step 1: Follow redirect
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_codedoc.html)',
            'Accept': 'text/html',
        },
        redirect: 'follow'
    })
    
    const html = await response.text()
    const finalUrl = response.url
    console.log('Final URL:', finalUrl)
    console.log('HTML length:', html.length)
    
    // Step 2: Extract title
    const rawTitle = getMetaContent(html, 'og:title') || getMetaContent(html, 'twitter:title') || ''
    const title = cleanShopeeTitle(rawTitle)
    console.log('\n✅ Title:', title)
    
    // Step 3: Extract description (will likely be empty/boilerplate)
    const rawDesc = getMetaContent(html, 'og:description') || ''
    const cleanDesc = cleanShopeeDescription(rawDesc)
    console.log('✅ Description:', cleanDesc || '(boilerplate filtered - will use fallback)')
    
    // Step 4: Extract images
    const images = extractShopeeImages(html)
    console.log(`✅ Images found: ${images.length}`)
    images.slice(0, 5).forEach((img, i) => console.log(`  [${i}] ${img.substring(0, 80)}`))
    if (images.length > 5) console.log(`  ... and ${images.length - 5} more`)
    
    // Step 5: Extract category
    const category = extractCategoryFromHtml(html)
    console.log('✅ Category:', category || '(not found in this HTML)')
    
    // Step 6: Extract IDs and try desktop URL
    const ids = extractShopeeIds(finalUrl) || extractShopeeIds(getMetaContent(html, 'al:web:url') || '')
    console.log('✅ IDs:', ids)
    
    if (ids) {
        const desktopUrl = `https://shopee.co.id/product/${ids.shopId}/${ids.itemId}`
        console.log('\nFetching desktop URL:', desktopUrl)
        
        const desktopRes = await fetch(desktopUrl, {
            headers: {
                'User-Agent': 'facebookexternalhit/1.1',
                'Accept': 'text/html',
            },
            redirect: 'follow'
        })
        
        if (desktopRes.ok) {
            const desktopHtml = await desktopRes.text()
            const desktopCategory = extractCategoryFromHtml(desktopHtml)
            const desktopImages = extractShopeeImages(desktopHtml)
            console.log('✅ Desktop category:', desktopCategory)
            console.log(`✅ Desktop images: ${desktopImages.length}`)
            
            // Combine images
            const allImages = [...images]
            for (const img of desktopImages) {
                if (!allImages.includes(img)) allImages.push(img)
            }
            console.log(`✅ Total unique images: ${allImages.length}`)
        }
    }
    
    console.log('\n--- Summary ---')
    console.log('Title:', title ? '✅' : '❌')
    console.log('Images:', images.length > 1 ? `✅ (${images.length})` : '❌')
    console.log('Category:', category ? '✅' : '❌ (needs desktop URL)')
    console.log('Description: ❌ (Shopee blocks server-side access)')
    console.log('Rating: ❌ (Shopee blocks server-side access)')
}

// === TEST 2: CSV Import Logic ===
async function testCsvImport() {
    console.log('\n\n========================================')
    console.log('TEST 2: CSV Import Logic')
    console.log('========================================')
    
    const fs = require('fs')
    const path = require('path')
    
    const csvPath = path.join(__dirname, '..', 'test program', 'LinkProdukSekaligus20260521193146-b9ffa90b0d64446a98da889bd4b75c8c.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    console.log('CSV file loaded, length:', csvContent.length)
    
    // Parse CSV headers
    const lines = csvContent.split('\n')
    const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''))
    console.log('Headers:', headers)
    
    // Parse first 3 rows for testing
    const fieldMap: Record<string, string> = {
        'nama produk': 'title',
        'penjualan': 'shopeeSold',
        'link komisi ekstra': 'shopeeUrl',
        'harga': 'price',
        'id produk': '_ignore',
        'nama toko': '_ignore',
        'komisi hingga': '_ignore',
        'komisi': '_ignore',
        'link produk': '_ignore',
    }
    
    console.log('\nColumn mapping:')
    for (const header of headers) {
        const mapped = fieldMap[header.toLowerCase()] || 'UNMAPPED'
        console.log(`  "${header}" → ${mapped}`)
    }
    
    // Parse each row
    console.log('\nParsed rows:')
    for (let i = 1; i < Math.min(lines.length, 4); i++) {
        if (!lines[i].trim()) continue
        
        // Simple CSV parse (handle quotes)
        const values: string[] = []
        let current = ''
        let inQuotes = false
        for (const char of lines[i]) {
            if (char === '"') {
                inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim())
                current = ''
            } else {
                current += char
            }
        }
        values.push(current.trim())
        
        const row: Record<string, string> = {}
        headers.forEach((h: string, idx: number) => {
            const key = fieldMap[h.toLowerCase()]
            if (key && key !== '_ignore') {
                row[key] = values[idx] || ''
            }
        })
        
        console.log(`\n  Row ${i + 1}:`)
        console.log(`    title: "${row.title?.substring(0, 60)}..."`)
        console.log(`    price: "${row.price}"`)
        console.log(`    shopeeSold: "${row.shopeeSold}"`)
        console.log(`    shopeeUrl: "${row.shopeeUrl?.substring(0, 60)}..."`)
        
        // Test scraping for first row
        if (i === 1 && row.shopeeUrl) {
            console.log('\n    >> Testing scrape for row 1...')
            try {
                const res = await fetch(row.shopeeUrl, {
                    headers: {
                        'User-Agent': 'facebookexternalhit/1.1',
                        'Accept': 'text/html',
                    },
                    redirect: 'follow'
                })
                const html = await res.text()
                const images = extractShopeeImages(html)
                const title = cleanShopeeTitle(getMetaContent(html, 'og:title') || '')
                const category = extractCategoryFromHtml(html)
                
                console.log(`    >> Scraped title: "${title}"`)
                console.log(`    >> Scraped images: ${images.length}`)
                console.log(`    >> Scraped category: "${category}"`)
            } catch (err: any) {
                console.log(`    >> Scrape error: ${err.message}`)
            }
        }
    }
    
    // Count total rows
    const dataRows = lines.filter((l: string) => l.trim() && l !== lines[0]).length
    console.log(`\nTotal data rows in CSV: ${dataRows}`)
}

// Run both tests
async function main() {
    try {
        await testSingleLinkScraping()
    } catch (err: any) {
        console.error('Test 1 failed:', err.message)
    }
    
    try {
        await testCsvImport()
    } catch (err: any) {
        console.error('Test 2 failed:', err.message)
    }
}

main()
