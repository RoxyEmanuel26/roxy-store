const fs = require('fs');
const html = fs.readFileSync('scratch/zyha-desktop.html', 'utf8');

// Search for any large blocks of text
console.log('HTML contains "premium"?', html.toLowerCase().includes('premium'));
console.log('HTML contains "korea"?', html.toLowerCase().includes('korea'));
console.log('HTML contains "totebag"?', html.toLowerCase().includes('totebag'));
console.log('HTML contains "buku"?', html.toLowerCase().includes('buku'));
console.log('HTML contains "kopi"?', html.toLowerCase().includes('kopi'));

// Let's print out all script tags again but completely, not truncated
const scriptTags = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
console.log('Total script tags:', scriptTags.length);
scriptTags.forEach((s, i) => {
    console.log(`Script #${i + 1} length: ${s.length}`);
});
