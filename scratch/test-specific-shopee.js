const fs = require('fs');

const url = 'https://shopee.co.id/product/1735322618/53158294918';

async function run() {
    console.log('Fetching:', url);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_codedoc.html)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9',
                'Cache-Control': 'no-cache'
            }
        });
        
        console.log('Status:', res.status);
        console.log('Redirected to:', res.url);
        const html = await res.text();
        console.log('HTML Length:', html.length);
        
        fs.writeFileSync('scratch/specific-shopee.html', html, 'utf8');
        
        // Search breadcrumbs
        const ldJsons = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
        console.log('ld+json count:', ldJsons.length);
        ldJsons.forEach((tag, idx) => {
            console.log(`Tag #${idx}:`, tag);
        });

        // Let's search if the word "Termos" or "Kopi" is in the HTML somewhere else besides title/og:title
        // Let's see if there is another script tag containing description
        const scriptTags = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
        console.log('Total script tags:', scriptTags.length);
        scriptTags.forEach((s, idx) => {
            if (s.includes('spesifikasi') || s.includes('tahan panas') || s.includes('vacuum') || s.includes('deskripsi')) {
                console.log(`Script #${idx} matches description query! Length:`, s.length);
                console.log(s.substring(0, 1000));
            }
        });

    } catch (e) {
        console.error(e);
    }
}

run();
