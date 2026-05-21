const fs = require('fs');

function extractShopeeIds(url) {
    const productMatch = url.match(/\/product\/(\d+)\/(\d+)/i);
    if (productMatch) {
        return { shopId: productMatch[1], itemId: productMatch[2] };
    }
    const hyphenIMatch = url.match(/-i\.(\d+)\.(\d+)/i);
    if (hyphenIMatch) {
        return { shopId: hyphenIMatch[1], itemId: hyphenIMatch[2] };
    }
    const userMatch = url.match(/shopee\.co\.id\/([^/]+)\/(\d+)\/(\d+)/i);
    if (userMatch) {
        const reserved = ['product', 'api', 'cart', 'checkout', 'buyer', 'user', 'search', 'category'];
        if (!reserved.includes(userMatch[1].toLowerCase())) {
            return { shopId: userMatch[2], itemId: userMatch[3] };
        }
    }
    return null;
}

async function run() {
    const url = 'https://s.shopee.co.id/5fllK6nJ0v';
    console.log('Fetching mobile:', url);

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_codedoc.html)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9'
        },
        redirect: 'follow'
    });

    const html = await response.text();
    const finalUrl = response.url;

    // Get al:web:url content
    let alWebUrl = '';
    const alMatch = html.match(/property="al:web:url"\s+content="([^"]+)"/i);
    if (alMatch) alWebUrl = alMatch[1].replace(/&amp;/g, '&');

    console.log('alWebUrl:', alWebUrl);
    console.log('finalUrl:', finalUrl);

    let ids = extractShopeeIds(url) || extractShopeeIds(finalUrl);
    if (!ids && alWebUrl) {
        ids = extractShopeeIds(alWebUrl);
    }

    if (ids) {
        console.log('Resolved ids:', ids);
        const desktopUrl = `https://shopee.co.id/product/${ids.shopId}/${ids.itemId}`;
        console.log('Fetching desktop:', desktopUrl);

        const dRes = await fetch(desktopUrl, {
            headers: {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_codedoc.html)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9'
            },
            redirect: 'follow'
        });

        const dHtml = await dRes.text();
        fs.writeFileSync('scratch/zyha-desktop.html', dHtml);
        console.log('Saved desktop HTML (length:', dHtml.length, ')');

        // Look for application/ld+json tags
        const ldJsons = dHtml.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
        console.log(`Found ${ldJsons.length} LD+JSON blocks.`);
        ldJsons.forEach((tag, idx) => {
            const cleanJson = tag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
            console.log(`\nLD+JSON #${idx + 1}:`);
            try {
                const obj = JSON.parse(cleanJson);
                console.log(JSON.stringify(obj, null, 2));
            } catch (e) {
                console.log('JSON parse failed:', e.message);
                console.log(cleanJson.slice(0, 1000));
            }
        });

    } else {
        console.log('Could not resolve shopId/itemId!');
    }
}

run().catch(console.error);
