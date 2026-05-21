// Quick test to verify scraper extracts multiple images, description, and category
// Run with: npx tsx scratch/test-full-scrape.ts

import { scrapeShopeeProduct } from '../lib/shopee-scraper'

async function run() {
    // Test with the ZYHA bag link from the CSV
    const url = 'https://s.shopee.co.id/5fllK6nJ0v'
    console.log('=== Scraping URL:', url, '===')
    
    try {
        const result = await scrapeShopeeProduct(url)
        console.log('\n--- RESULT ---')
        console.log('Title:', result.title)
        console.log('Description:', result.description?.substring(0, 100) + '...')
        console.log('Category:', result.category)
        console.log('Image URL:', result.imageUrl)
        console.log('Total images:', result.images.length)
        console.log('Images:')
        result.images.forEach((img, i) => console.log(`  [${i}] ${img}`))
    } catch (error) {
        console.error('Error:', error)
    }
}

run()
