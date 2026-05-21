const fs = require('fs');
const html = fs.readFileSync('scratch/zyha-desktop.html', 'utf8');

const metaTags = html.match(/<meta[^>]+>/gi) || [];
console.log('--- ALL META TAGS ---');
for (const tag of metaTags) {
    if (tag.includes('description') || tag.includes('og:') || tag.includes('title')) {
        console.log(tag);
    }
}
