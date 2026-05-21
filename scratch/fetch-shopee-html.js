const fetch = require('node-fetch');
const fs = require('fs');

async function main() {
    const url = 'https://s.shopee.co.id/1BJLxhR2uv';
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

    const html = await response.text();
    fs.writeFileSync('scratch/temp-shopee.html', html);
    console.log("HTML saved to scratch/temp-shopee.html");
}

main().catch(console.error);
