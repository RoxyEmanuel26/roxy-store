const fs = require('fs');
const files = ['scratch/desktop-shopee.html', 'scratch/specific-shopee.html', 'scratch/zyha-desktop.html'];

for (const file of files) {
    if (!fs.existsSync(file)) {
        console.log(`File ${file} does not exist.`);
        continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    console.log(`\n=== Analyzing ${file} ===`);
    const imgRegex = /https:\/\/[a-z0-9-]+\.img\.susercontent\.com\/file\/[a-zA-Z0-9_-]+/g;
    const matches = html.match(imgRegex) || [];
    const unique = [...new Set(matches)];
    console.log(`Unique susercontent images (${unique.length}):`);
    unique.slice(0, 5).forEach(img => console.log(' -', img));
    
    const ldJsons = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    console.log(`LD+JSON count: ${ldJsons.length}`);
    for (const tag of ldJsons) {
        const clean = tag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
        try {
            const obj = JSON.parse(clean);
            console.log(` - Type: ${obj['@type'] || obj['@context']}`);
        } catch(e) {
            console.log(` - Parse failed: ${clean.slice(0, 100)}`);
        }
    }
}
