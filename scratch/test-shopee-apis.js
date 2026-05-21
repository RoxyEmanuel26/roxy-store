const fs = require('fs');

async function testApi(url, headers, label) {
    console.log(`\n--- [${label}] Fetching: ${url}`);
    try {
        const response = await fetch(url, { headers });
        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Length: ${text.length}`);
        console.log(`Preview: ${text.slice(0, 300)}`);
        if (response.ok && text.includes('item')) {
            console.log(`SUCCESS on [${label}]! Saving response...`);
            fs.writeFileSync(`scratch/api-success-${label.replace(/[^a-zA-Z0-9]/g, '_')}.json`, text);
        }
    } catch (e) {
        console.error(`Error on [${label}]:`, e.message);
    }
}

async function run() {
    const shopId = '1480220415';
    const itemId = '26786215269';
    
    const endpoints = [
        `https://shopee.co.id/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`,
        `https://shopee.co.id/api/v2/item/get?itemid=${itemId}&shopid=${shopId}`,
        `https://shopee.co.id/api/v4/pdp/get_pc?itemid=${itemId}&shopid=${shopId}`,
        `https://shopee.co.id/api/v4/pdp/get_mobile?itemid=${itemId}&shopid=${shopId}`
    ];
    
    const uas = {
        facebook: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_codedoc.html)',
        chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        mobile: 'Mozilla/5.0 (Linux; Android 10; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        okhttp: 'okhttp/3.14.9'
    };

    for (const url of endpoints) {
        for (const [uaName, uaVal] of Object.entries(uas)) {
            const headers = {
                'User-Agent': uaVal,
                'Accept': 'application/json',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': `https://shopee.co.id/product/${shopId}/${itemId}`
            };
            await testApi(url, headers, `${uaName}-${url.includes('v2') ? 'v2' : url.includes('pdp') ? 'pdp' : 'v4'}`);
        }
    }
}

run();
