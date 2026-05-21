const fs = require('fs');
const html = fs.readFileSync('scratch/desktop-shopee.html', 'utf8');

const regex = /https:\/\/(?:[a-zA-Z0-9-.]+\.img\.susercontent\.com|cf\.shopee\.[a-z.]+)\/file\/[a-zA-Z0-9_-]+/gi;
const matches = html.match(regex) || [];
console.log('Total matches found:', matches.length);
const unique = Array.from(new Set(matches));
console.log('Unique image URLs found:', unique.length);
console.log(unique);
