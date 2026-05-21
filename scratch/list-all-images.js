const fs = require('fs');
const html = fs.readFileSync('scratch/zyha-desktop.html', 'utf8');
const imgRegex = /https:\/\/down-id\.img\.susercontent\.com\/file\/[a-zA-Z0-9_-]+/g;
const imgMatches = html.match(imgRegex) || [];
const uniqueImgs = [...new Set(imgMatches)];
console.log('Unique images:', uniqueImgs);
