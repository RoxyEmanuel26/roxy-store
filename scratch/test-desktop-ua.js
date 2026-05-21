const fs = require('fs');

const url = 'https://shopee.co.id/product/1505191648/26681173222';

const uas = {
    googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    facebook: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_codedoc.html)',
    chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    whatsapp: 'WhatsApp/2.24.4.76 A'
};

async function test() {
    for (const [name, ua] of Object.entries(uas)) {
        console.log(`\n=== Testing UA: ${name} ===`);
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': ua,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'id-ID,id;q=0.9',
                    'Cache-Control': 'no-cache'
                }
            });
            console.log('Status:', res.status);
            console.log('Redirected to:', res.url);
            const html = await res.text();
            console.log('HTML Length:', html.length);
            
            // Search for some description content
            // Let's assume the description contains "Spesifikasi" or "BPA FREE" or "Termos" or "kopi"
            const keywords = ['BPA FREE', 'Termos', 'Spesifikasi', 'Kapasitas', '510ml'];
            keywords.forEach(kw => {
                const found = html.toLowerCase().includes(kw.toLowerCase());
                console.log(`  Contains "${kw}"?`, found);
            });
            
            // Also print any ld+json scripts
            const ldJsons = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
            console.log('  ld+json tags:', ldJsons.length);
            ldJsons.forEach((tag, idx) => {
                console.log(`    Tag #${idx}:`, tag.slice(0, 200) + '...');
            });
            
        } catch (e) {
            console.error('Error:', e);
        }
    }
}

test();
