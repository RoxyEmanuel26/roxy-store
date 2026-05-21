// Test: Print the FULL API response from Shopee's internal pdp/get_pc call
const puppeteerExtra = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteerExtra.use(StealthPlugin())

async function interceptFullApi(url: string) {
    console.log('=== Intercepting FULL Shopee API for:', url, '===')
    
    const browser = await puppeteerExtra.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    
    try {
        const page = await browser.newPage()
        await page.setViewport({ width: 1280, height: 800 })
        
        page.on('response', async (response: any) => {
            const url = response.url()
            if (url.includes('/api/v4/pdp/get') || url.includes('/api/v4/item/get') || url.includes('/api/v2/item/get')) {
                console.log(`\n>>> API: ${url.substring(0, 150)}`)
                console.log('Status:', response.status())
                try {
                    const text = await response.text()
                    // Print first 3000 chars of response
                    console.log('Response (first 3000):', text.substring(0, 3000))
                    
                    // Try parse and extract key fields
                    try {
                        const json = JSON.parse(text)
                        if (json.data) {
                            console.log('\n=== PARSED DATA ===')
                            console.log('Keys:', Object.keys(json.data).join(', '))
                            if (json.data.name) console.log('Name:', json.data.name)
                            if (json.data.description) console.log('Description:', json.data.description.substring(0, 500))
                            if (json.data.item_rating) console.log('Rating:', JSON.stringify(json.data.item_rating).substring(0, 300))
                            if (json.data.historical_sold) console.log('Historical Sold:', json.data.historical_sold)
                            if (json.data.sold) console.log('Sold:', json.data.sold)
                            if (json.data.images) console.log('Images:', json.data.images)
                        }
                        if (json.error) console.log('Error:', json.error)
                    } catch { /* not JSON */ }
                } catch (e: any) {
                    console.log('Could not read response:', e.message)
                }
            }
        })
        
        console.log('Navigating...')
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
        await new Promise(r => setTimeout(r, 3000))
        
    } finally {
        await browser.close()
    }
}

interceptFullApi('https://s.shopee.co.id/5fllK6nJ0v')
    .then(() => console.log('\n=== DONE ==='))
    .catch(err => console.error('Error:', err))
