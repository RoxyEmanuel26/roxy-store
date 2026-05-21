const fs = require('fs');
const html = fs.readFileSync('scratch/desktop-shopee.html', 'utf8');

console.log('HTML Length:', html.length);

// Let's print the meta tags
const metaTags = html.match(/<meta[^>]+>/gi) || [];
console.log('\n--- Meta Tags ---');
metaTags.forEach(tag => {
    if (tag.includes('desc') || tag.includes('og:') || tag.includes('twitter:') || tag.includes('al:')) {
        console.log(tag);
    }
});

// Let's look for the word "deskripsi" or "spesifikasi" or "detail" in the text
const body = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                 .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

console.log('\n--- Cleaned HTML (first 2000 chars) ---');
console.log(body.slice(0, 2000));

console.log('\n--- Searching for substrings ---');
const keywords = ['kopi', 'teh', 'stainless', 'pashlinc', 'tempflask', 'ml', 'mug', 'botol', 'termos'];
keywords.forEach(kw => {
    const idx = body.toLowerCase().indexOf(kw.toLowerCase());
    if (idx !== -1) {
        console.log(`Keyword "${kw}" found at index ${idx}. Context:`);
        console.log(body.slice(Math.max(0, idx - 50), Math.min(body.length, idx + 150)).replace(/\s+/g, ' '));
        console.log('---');
    } else {
        console.log(`Keyword "${kw}" not found`);
    }
});
