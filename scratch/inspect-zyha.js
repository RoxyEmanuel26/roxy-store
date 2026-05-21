const fs = require('fs');
const html = fs.readFileSync('scratch/zyha-desktop.html', 'utf8');

const idx = html.indexOf('Penilaian');
if (idx !== -1) {
    console.log('Snippet around Penilaian:');
    console.log(html.substring(idx - 200, idx + 400));
} else {
    console.log('Penilaian not found');
}
