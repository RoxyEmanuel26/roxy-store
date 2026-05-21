const fs = require('fs');
const html = fs.readFileSync('scratch/zyha-desktop.html', 'utf8');
const imgRegex = /https:\/\/down-id\.img\.susercontent\.com\/file\/[a-zA-Z0-9_-]+/g;
const imgMatches = html.match(imgRegex) || [];
const uniqueImgs = [...new Set(imgMatches)];

for (const img of uniqueImgs) {
    const idx = html.indexOf(img);
    console.log(`\nURL: ${img}`);
    console.log('Snippet:', html.substring(idx - 100, idx + img.length + 100));
}
