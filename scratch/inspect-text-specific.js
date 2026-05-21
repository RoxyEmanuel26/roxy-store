const fs = require('fs');
const html = fs.readFileSync('scratch/specific-shopee.html', 'utf8');

console.log('HTML Length:', html.length);

const keywords = ['bahan', 'ukuran', 'warna', 'tahan', 'panas', 'dingin', 'vacuum', 'kopi', 'teh', 'stainless', 'bpa', 'free', '510ml', 'tumbler', 'mug'];

keywords.forEach(kw => {
    const regex = new RegExp(kw, 'gi');
    let match;
    let count = 0;
    while ((match = regex.exec(html)) !== null && count < 5) {
        const start = Math.max(0, match.index - 40);
        const end = Math.min(html.length, match.index + kw.length + 40);
        console.log(`Keyword "${kw}" at index ${match.index}: "...${html.slice(start, end).replace(/\s+/g, ' ')}..."`);
        count++;
    }
    console.log(`Total matches for "${kw}":`, (html.match(regex) || []).length);
    console.log('---');
});
