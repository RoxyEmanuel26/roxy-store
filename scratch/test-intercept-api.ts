// Test: Intercept Shopee's internal API calls made by their JavaScript
// when loading a product page via the short URL redirect
const puppeteerExtra = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteerExtra.use(StealthPlugin())

async function interceptShopeeApi(url: string) {
    console.log('=== Intercepting Shopee API calls for:', url, '===')
    
    const browser = await puppeteerExtra.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    
    try {
        const page = await browser.newPage()
        await page.setViewport({ width: 1280, height: 800 })
        
        // Intercept API responses
        const apiResponses: any[] = []
        page.on('response', async (response: any) => {
            const url = response.url()
            // Look for product detail API calls
            if (url.includes('/api/v4/item/get') || url.includes('/api/v4/pdp/get') || url.includes('/api/v2/item/get')) {
                console.log(`\n>>> API HIT: ${url.substring(0, 120)}`)
                try {
                    const json = await response.json()
                    apiResponses.push({ url, data: json })
                    
                    const item = json?.data || json?.item
                    if (item) {
                        console.log('  Title:', item.name || item.title)
                        console.log('  Description:', (item.description || '').substring(0, 200))
                        console.log('  Rating:', item.item_rating?.rating_star)
                        console.log('  RatingCount:', item.cmt_count || item.item_rating?.rating_count?.[0])
                        console.log('  Historical Sold:', item.historical_sold || item.sold)
                        console.log('  Price:', item.price_min ? item.price_min / 100000 : item.price)
                        console.log('  Images:', item.images?.length, 'hashes')
                    }
                } catch (e) {
                    // Not JSON or error
                }
            }
        })
        
        // Navigate to the short URL which should redirect to product page
        console.log('Navigating...')
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
        
        // Wait for API calls to happen
        await new Promise(r => setTimeout(r, 5000))
        
        console.log(`\n--- Total API responses captured: ${apiResponses.length} ---`)
        
        // Also check the visible page content
        const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '')
        console.log('\nPage text:', bodyText)
        
        // Try to get document title
        const docTitle = await page.evaluate(() => document.title)
        console.log('Document title:', docTitle)
        
    } finally {
        await browser.close()
    }
}

// Try with the short URL - this often redirects to the regular product page
interceptShopeeApi('https://s.shopee.co.id/5fllK6nJ0v')
    .then(() => console.log('\n=== DONE ==='))
    .catch(err => console.error('Error:', err))
