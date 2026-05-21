// Test with Googlebot UA to see if Shopee serves richer data
async function run() {
    const url = 'https://shopee.co.id/product/1480220415/26786215269'
    
    const agents = [
        ['Googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
        ['Twitterbot', 'Twitterbot/1.0'],
        ['Google Structured Data', 'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36 (compatible; Google-Structured-Data-Testing-Tool +http://developers.google.com/search)'],
    ]
    
    for (const [name, ua] of agents) {
        console.log(`\n=== ${name} ===`)
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': ua,
                    'Accept': 'text/html',
                    'Accept-Language': 'id-ID,id;q=0.9',
                },
                redirect: 'follow'
            })
            
            const html = await res.text()
            console.log('Status:', res.status, '| HTML length:', html.length)
            
            // Check JSON-LD
            const ldJsons = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || []
            for (const block of ldJsons) {
                const cleanJson = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim()
                try {
                    const obj = JSON.parse(cleanJson)
                    if (obj['@type'] === 'Product') {
                        console.log('PRODUCT JSON-LD FOUND!')
                        console.log('  Name:', obj.name)
                        console.log('  Description:', (obj.description || '').substring(0, 200))
                        console.log('  Images:', Array.isArray(obj.image) ? obj.image.length : 'single')
                        console.log('  AggregateRating:', JSON.stringify(obj.aggregateRating))
                    } else {
                        console.log('JSON-LD type:', obj['@type'])
                    }
                } catch { /* skip */ }
            }
            
            // Check meta description
            const metaDesc = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)
            if (metaDesc) {
                console.log('Meta description:', metaDesc[1].substring(0, 200))
            }
        } catch (error) {
            console.error('Error:', error instanceof Error ? error.message : error)
        }
    }
}

run()
