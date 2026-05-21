const fs = require('fs');
const html = fs.readFileSync('scratch/specific-shopee.html', 'utf8');
const ldJsons = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
console.log('ld+json count:', ldJsons.length);
ldJsons.forEach((tag, idx) => {
    console.log(`Tag #${idx}:`, tag);
    try {
        const cleanJson = tag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
        const obj = JSON.parse(cleanJson);
        console.log('Parsed successfully:', obj['@type']);
        if (obj['@type'] === 'BreadcrumbList') {
            console.log('BreadcrumbList items:');
            obj.itemListElement.forEach(item => {
                console.log(item.position, ':', item.item ? item.item.name || item.item['@id'] : 'no item name', 'or name:', item.name);
            });
        }
    } catch (e) {
        console.error('Failed to parse:', e.message);
    }
});
