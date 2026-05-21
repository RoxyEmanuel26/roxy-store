const fs = require('fs');

async function testUA(uaName, uaString) {
    const url = 'https://shopee.co.id/product/1480220415/26786215269';
    console.log(`\nTesting UA: ${uaName}`);
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': uaString,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            redirect: 'follow'
        });
        console.log('Status:', response.status);
        const html = await response.text();
        console.log('HTML Length:', html.length);
        
        // Check for common indicators
        const hasTitle = html.includes('<title');
        const hasDescription = html.toLowerCase().includes('hey ladies') || html.toLowerCase().includes('pu leather');
        const hasAggregateRating = html.includes('aggregateRating') || html.includes('ratingValue');
        const hasImages = html.includes('image') && html.includes('down-id.img.susercontent.com');
        
        console.log('Has Title:', hasTitle);
        console.log('Has Description:', hasDescription);
        console.log('Has AggregateRating:', hasAggregateRating);
        console.log('Has Images:', hasImages);

        if (hasDescription || html.includes('window.__PRELOADED_STATE__')) {
            console.log('FOUND DATA! Saving HTML to scratch/' + uaName + '.html');
            fs.writeFileSync('scratch/' + uaName + '.html', html);
        }
    } catch (e) {
        console.error('Error for UA', uaName, ':', e.message);
    }
}

const UAs = {
    'googlebot': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'bingbot': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'whatsapp': 'WhatsApp/2.21.12.21 A',
    'chrome': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'facebook': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_codedoc.html)'
};

async function main() {
    for (const [name, ua] of Object.entries(UAs)) {
        await testUA(name, ua);
    }
}

main().catch(console.error);
