const fs = require('fs');
const html = fs.readFileSync('scratch/zyha-desktop.html', 'utf8');

console.log('HTML length:', html.length);

// 1. Search for description keywords
const descKeywords = ['Hanna', 'PU Leather', 'Totebag', 'Embrace Your Elegance'];
for (const kw of descKeywords) {
    const count = (html.match(new RegExp(kw, 'gi')) || []).length;
    console.log(`Keyword "${kw}" found ${count} times.`);
}

// 2. Search for rating numbers
const ratings = ['18,8', '18.8', '18800', '10RB', '10.000', '10000'];
for (const r of ratings) {
    const count = (html.match(new RegExp(r, 'gi')) || []).length;
    console.log(`Rating term "${r}" found ${count} times.`);
}

// 3. Search for image patterns: down-id.img.susercontent.com
const imgRegex = /https:\/\/down-id\.img\.susercontent\.com\/file\/[a-zA-Z0-9_-]+/g;
const imgMatches = html.match(imgRegex) || [];
console.log(`Found ${imgMatches.length} susercontent image matches. Unique count: ${new Set(imgMatches).size}`);
console.log('Sample images:', [...new Set(imgMatches)].slice(0, 10));

// 4. Try parsing LD+JSON
const ldJsons = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
console.log(`Found ${ldJsons.length} LD+JSON blocks.`);
ldJsons.forEach((tag, idx) => {
    const cleanJson = tag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
    try {
        const obj = JSON.parse(cleanJson);
        console.log(`LD+JSON #${idx + 1} type:`, obj['@type'] || obj['@context']);
        if (obj['@type'] === 'Product') {
            console.log('Product LD+JSON details:', JSON.stringify(obj, null, 2));
        }
    } catch (e) {
        // Ignore
    }
});
