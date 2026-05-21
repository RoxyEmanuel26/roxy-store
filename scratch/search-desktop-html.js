const fs = require('fs');

const html = fs.readFileSync('scratch/zyha-desktop.html', 'utf8');

console.log('HTML length:', html.length);
console.log('Does HTML contain "Hey Ladies"?', html.toLowerCase().includes('hey ladies'));
console.log('Does HTML contain "Kualitas Premium"?', html.toLowerCase().includes('kualitas premium'));
console.log('Does HTML contain "ZYHA"?', html.toLowerCase().includes('zyha'));

// Let's find where the word "ZYHA" occurs
let idx = -1;
let occurrences = 0;
while ((idx = html.toLowerCase().indexOf('zyha', idx + 1)) !== -1) {
    occurrences++;
    console.log(`Occurrence #${occurrences} of ZYHA at index ${idx}:`);
    console.log(html.substring(Math.max(0, idx - 100), Math.min(html.length, idx + 150)));
    console.log('--------------------------------------------------');
}
