// Test Puppeteer-based Shopee scraping
// This uses a headless browser to execute JavaScript and get the FULL product data
import puppeteer from 'puppeteer'

async function scrapeWithPuppeteer(url: string) {
    console.log('=== Launching Puppeteer for:', url, '===')
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
    
    try {
        const page = await browser.newPage()
        
        // Set a realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36')
        
        // Set viewport
        await page.setViewport({ width: 1280, height: 800 })
        
        console.log('Navigating to page...')
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
        
        // Wait for product content to load
        console.log('Waiting for product content...')
        await page.waitForSelector('[class*="product-briefing"]', { timeout: 15000 }).catch(() => {
            console.log('product-briefing not found, trying alternatives...')
        })
        
        // Wait a bit more for dynamic content
        await new Promise(r => setTimeout(r, 3000))
        
        // Extract data from the rendered page
        const data = await page.evaluate(() => {
            // Title
            const titleEl = document.querySelector('h1') || document.querySelector('[class*="title"]')
            const title = titleEl?.textContent?.trim() || ''
            
            // Description - look for the product description section
            let description = ''
            const descSections = document.querySelectorAll('[class*="product-detail"] p, [class*="description"] p, [class*="detail"] .container')
            descSections.forEach(el => {
                const text = el.textContent?.trim()
                if (text && text.length > 20) {
                    description += text + '\n'
                }
            })
            
            // Also try the specific Shopee description container
            if (!description) {
                const descContainer = document.querySelector('[class*="f7AU53"]') // Shopee description class
                if (descContainer) {
                    description = descContainer.textContent?.trim() || ''
                }
            }
            
            // Rating
            let rating = 0
            let ratingCount = ''
            const ratingEl = document.querySelector('[class*="rating"] [class*="number"], [class*="star"] + span')
            if (ratingEl) {
                rating = parseFloat(ratingEl.textContent?.trim() || '0')
            }
            
            // Look for rating count text like "18,8RB penilaian"
            const allText = document.body.innerText
            const ratingCountMatch = allText.match(/([\d.,]+\s*(?:RB|K|ribu)?)\s*(?:penilaian|Penilaian|rating)/i)
            if (ratingCountMatch) {
                ratingCount = ratingCountMatch[1].trim()
            }
            
            // Sold count
            let soldStr = ''
            const soldMatch = allText.match(/([\d.,]+\s*(?:RB\+?|K\+?|ribu)?)[\s]*(?:Terjual|terjual)/i)
            if (soldMatch) {
                soldStr = soldMatch[1].trim()
            }
            
            // Price
            let price = 0
            const priceEl = document.querySelector('[class*="price"]')
            if (priceEl) {
                const priceText = priceEl.textContent?.trim() || ''
                const priceMatch = priceText.match(/[\d.,]+/)
                if (priceMatch) {
                    price = parseFloat(priceMatch[0].replace(/\./g, '').replace(',', '.'))
                }
            }
            
            // Images from carousel
            const images: string[] = []
            document.querySelectorAll('img[src*="susercontent.com"]').forEach(img => {
                const src = (img as HTMLImageElement).src
                if (src && !src.includes('avatar') && !images.includes(src)) {
                    images.push(src)
                }
            })
            
            return { title, description, rating, ratingCount, soldStr, price, images }
        })
        
        console.log('\n--- EXTRACTED DATA ---')
        console.log('Title:', data.title)
        console.log('Description (first 300 chars):', data.description?.substring(0, 300))
        console.log('Description length:', data.description?.length)
        console.log('Rating:', data.rating)
        console.log('Rating Count:', data.ratingCount)
        console.log('Sold:', data.soldStr)
        console.log('Price:', data.price)
        console.log('Images:', data.images.length)
        data.images.forEach((img, i) => console.log(`  [${i}] ${img.substring(0, 80)}...`))
        
        return data
    } finally {
        await browser.close()
    }
}

// Test with the provided link
scrapeWithPuppeteer('https://shopee.co.id/product/1480220415/26786215269')
    .then(() => console.log('\n=== DONE ==='))
    .catch(err => console.error('Error:', err))
