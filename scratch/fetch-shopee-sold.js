const fetch = require('node-fetch');

async function main() {
    const url = 'https://s.shopee.co.id/1BJLxhR2uv';
    console.log(`Fetching Shopee URL: ${url}`);
    
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

    console.log(`Response Status: ${response.status}`);
    console.log(`Final URL after redirects: ${response.url}`);
    
    const html = await response.text();
    console.log(`HTML Length: ${html.length} bytes`);
    
    // Look for occurrences of "terjual", "sold", or similar patterns
    const matches = [];
    const regexes = [
        /terjual/gi,
        /sold/gi,
        /"historical_sold"\s*:\s*\d+/gi,
        /"sold"\s*:\s*\d+/gi
    ];
    
    for (const r of regexes) {
        let match;
        while ((match = r.exec(html)) !== null) {
            matches.push({
                matched: match[0],
                index: match.index,
                context: html.substring(Math.max(0, match.index - 50), Math.min(html.length, match.index + 50))
            });
        }
    }
    
    console.log(`Found ${matches.length} keyword matches in HTML:`);
    console.log(JSON.stringify(matches.slice(0, 15), null, 2));
}

main().catch(console.error);
