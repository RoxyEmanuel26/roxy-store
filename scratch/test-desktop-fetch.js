const fs = require('fs');

async function testDesktopFetch() {
    // The desktop product URL extracted from the mobile/redirect meta of s.shopee.co.id/1BJLxhR2uv
    const url = 'https://shopee.co.id/product/1505191648/26681173222';
    console.log('Fetching Desktop URL:', url);
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_codedoc.html)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            redirect: 'follow'
        });

        console.log('Response Status:', response.status);
        console.log('Final URL:', response.url);

        const html = await response.text();
        fs.writeFileSync('scratch/desktop-shopee.html', html, 'utf8');
        console.log('Saved to scratch/desktop-shopee.html (length:', html.length, ')');

        // Let's search for "Perlengkapan Rumah"
        console.log('Does HTML contain "Perlengkapan Rumah"?', html.includes('Perlengkapan Rumah'));
        
        // Let's search if the word "description" or other tags exist
        // Often Shopee has script tags with type "application/ld+json" or window.__PRELOADED_STATE__
        const ldJsonRegex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
        let match;
        let index = 1;
        while ((match = ldJsonRegex.exec(html)) !== null) {
            console.log(`\n--- LD+JSON Script #${index} ---`);
            console.log(match[1].slice(0, 500) + '...');
            index++;
        }

        // Also check window.__PRELOADED_STATE__ or similar
        const scriptTags = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
        console.log(`\nTotal script tags: ${scriptTags.length}`);
        
        // Let's search for some text patterns inside script tags
        for (let i = 0; i < scriptTags.length; i++) {
            const script = scriptTags[i];
            if (script.includes('Perlengkapan') || script.includes('description') || script.includes('category')) {
                console.log(`Script #${i} matches query, length: ${script.length}`);
                fs.writeFileSync(`scratch/matching-script-${i}.txt`, script, 'utf8');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testDesktopFetch();
