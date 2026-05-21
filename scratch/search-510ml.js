const fs = require('fs');
const html = fs.readFileSync('scratch/desktop-shopee.html', 'utf8');

const term = '510ml';
let idx = 0;
while (true) {
    idx = html.toLowerCase().indexOf(term, idx);
    if (idx === -1) break;
    console.log(`Found "${term}" at index ${idx}:`);
    console.log(html.substring(idx - 100, idx + 100));
    idx += term.length;
}
