const fs = require('fs');
const html = fs.readFileSync('scratch/zyha-desktop.html', 'utf8');

const matches = [];
// search for numbers with decimals like 4.9 or similar
const numRegex = /\b\d+[.,]\d+\b/g;
let match;
while ((match = numRegex.exec(html)) !== null) {
    matches.push(match[0]);
}
console.log('Decimal numbers in HTML:', [...new Set(matches)]);

// search for words containing "RB" or similar
const rbRegex = /\b\d+[.,]?\d*RB[+]*\b/gi;
const rbMatches = html.match(rbRegex) || [];
console.log('RB matches in HTML:', [...new Set(rbMatches)]);

// search for numbers like 18800 or similar
const bigNumRegex = /\b\d{4,}\b/g;
const bigNumMatches = html.match(bigNumRegex) || [];
console.log('Big numbers in HTML:', [...new Set(bigNumMatches)].slice(0, 20));
