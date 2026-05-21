// Test different Shopee API approaches
async function run() {
    const shopId = '1480220415'
    const itemId = '26786215269'
    
    // Approach 1: v2 item API
    const urls = [
        `https://shopee.co.id/api/v2/item/get?shopid=${shopId}&itemid=${itemId}`,
        `https://shopee.co.id/api/v4/pdp/get_pc?shop_id=${shopId}&item_id=${itemId}`,
    ]
    
    for (const apiUrl of urls) {
        console.log('\n=== Trying:', apiUrl, '===')
        try {
            const res = await fetch(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'id-ID,id;q=0.9',
                    'Referer': 'https://shopee.co.id/',
                },
            })
            console.log('Status:', res.status)
            const text = await res.text()
            // Try to parse as JSON
            try {
                const data = JSON.parse(text)
                const item = data?.item || data?.data
                if (item) {
                    console.log('Title:', item.name || item.title)
                    console.log('Description:', (item.description || '').substring(0, 300))
                    console.log('Rating:', item.item_rating?.rating_star || item.rating_star)
                    console.log('Rating Count:', item.cmt_count || item.item_rating?.rating_count?.[0])
                    console.log('Sold:', item.historical_sold || item.sold)
                    console.log('Images:', item.images?.length)
                } else {
                    console.log('Response keys:', Object.keys(data).join(', '))
                    console.log('Response (first 300):', text.substring(0, 300))
                }
            } catch {
                console.log('Not JSON. First 300 chars:', text.substring(0, 300))
            }
        } catch (error) {
            console.error('Error:', error instanceof Error ? error.message : error)
        }
    }
}

run()
