const fs = require('fs');

async function testRedirect() {
    const url = 'https://s.shopee.co.id/5q5BHF9n24';
    console.log('Resolving short URL:', url);
    try {
        const followResponse = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });
        const html = await followResponse.text();
        console.log('Final HTML length:', html.length);
        fs.writeFileSync('scratch/follow-redirect-output.html', html, 'utf8');
        
        // Let's print out if it contains "opaanlp" or "Gantungan" or anything
        console.log('Contains "opaanlp"?', html.includes('opaanlp'));
        console.log('Contains "Gantungan"?', html.includes('Gantungan'));
        console.log('Contains "shopee"?', html.includes('shopee'));
        
        // Check for scripts
        const scriptTags = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
        console.log('Total script tags:', scriptTags.length);
        scriptTags.forEach((s, idx) => {
            console.log(`Script #${idx}: length = ${s.length}, tag = ${s.substring(0, 100)}...`);
            if (s.includes('window.') || s.includes('dataset') || s.includes('json')) {
                console.log('  Preview:', s.substring(0, 500));
            }
        });

        // Let's check for any meta tags
        const metaTags = html.match(/<meta[^>]+>/gi) || [];
        console.log('Total meta tags:', metaTags.length);
        metaTags.forEach(m => console.log('  ', m));

    } catch (e) {
        console.error(e);
    }
}

testRedirect();
