// Test Puppeteer with stealth plugin to bypass anti-bot detection
const puppeteerExtra = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteerExtra.use(StealthPlugin())

async function scrapeWithStealth(url: string) {
    console.log('=== Launching Stealth Puppeteer for:', url, '===')
    
    const browser = await puppeteerExtra.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
        ],
    })
    
    try {
        const page = await browser.newPage()
        
        await page.setViewport({ width: 1280, height: 800 })
        
        // Block unnecessary resources
        await page.setRequestInterception(true)
        page.on('request', (req: any) => {
            const type = req.resourceType()
            if (['font', 'media'].includes(type)) {
                req.abort()
            } else {
                req.continue()
            }
        })
        
        console.log('Navigating to page...')
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
        
        // Wait for product content to appear
        console.log('Waiting for product content...')
        await page.waitForFunction(
            () => {
                const body = document.body?.innerText || ''
                return body.includes('Terjual') || body.includes('terjual') || body.includes('penilaian') || document.querySelectorAll('img[src*="susercontent"]').length > 2
            },
            { timeout: 15000 }
        ).catch(() => {
            console.log('Content wait timeout, extracting whatever is available...')
        })
        
        // Extra wait for dynamic content
        await new Promise(r => setTimeout(r, 3000))
        
        // Take a screenshot for debugging
        await page.screenshot({ path: 'scratch/shopee-debug.png', fullPage: false })
        console.log('Screenshot saved to scratch/shopee-debug.png')
        
        // Get the page text for debugging
        const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 2000) || '')
        console.log('\n--- PAGE TEXT (first 2000 chars) ---')
        console.log(bodyText)
        
        // Extract data
        const data = await page.evaluate(() => {
            const body = document.body
            const allText = body?.innerText || ''
            
            // Title
            let title = ''
            const h1 = document.querySelector('h1')
            if (h1) title = h1.textContent?.trim() || ''
            
            // Description
            let description = ''
            // Look for all text content sections
            const sections = document.querySelectorAll('div, section, article')
            for (const section of sections) {
                const text = section.textContent?.trim() || ''
                if (text.length > 100 && text.length < 5000 && !text.includes('Shopee') && !text.includes('SPC_') && section.children.length < 5) {
                    // Check if this looks like a description
                    if (text.split('\n').length < 50) {
                        description = text
                    }
                }
            }
            
            // Rating
            let rating = 0
            const ratingMatch = allText.match(/(\d\.\d)\s*(?:out of|\/\s*5|dari|\s+\d)/i)
            if (ratingMatch) rating = parseFloat(ratingMatch[1])
            
            // Rating count
            let ratingCount = ''
            const ratingCountMatch = allText.match(/([\d.,]+(?:\s*(?:RB|K|ribu))?)\s*(?:Penilaian|penilaian)/i)
            if (ratingCountMatch) ratingCount = ratingCountMatch[1].trim()
            
            // Sold
            let soldStr = ''
            const soldMatch = allText.match(/([\d.,]+(?:\s*(?:RB\+?|K\+?|ribu\+?))?)\s*(?:Terjual|terjual)/i)
            if (soldMatch) soldStr = soldMatch[1].trim()
            
            // Images
            const images: string[] = []
            document.querySelectorAll('img').forEach(img => {
                const src = img.src || ''
                if (src.includes('susercontent.com/file/') && !images.includes(src)) {
                    images.push(src.split('?')[0])
                }
            })
            
            return { title, description, rating, ratingCount, soldStr, images, allTextLength: allText.length }
        })
        
        console.log('\n--- EXTRACTED DATA ---')
        console.log('Title:', data.title)
        console.log('Description:', data.description?.substring(0, 300))
        console.log('Rating:', data.rating)
        console.log('Rating Count:', data.ratingCount)
        console.log('Sold:', data.soldStr)
        console.log('Images:', data.images.length)
        console.log('All text length:', data.allTextLength)
        data.images.forEach((img: string, i: number) => console.log(`  [${i}] ${img.substring(0, 80)}...`))
        
    } finally {
        await browser.close()
    }
}

scrapeWithStealth('https://shopee.co.id/product/1480220415/26786215269')
    .then(() => console.log('\n=== DONE ==='))
    .catch(err => console.error('Error:', err))
