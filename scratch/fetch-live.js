const https = require('https');

function get(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function check() {
    try {
        const html = await get('https://www.roxystore.web.id/');
        console.log('Homepage contains "penilaian":', html.includes('penilaian'));
        console.log('Homepage contains "terjual":', html.includes('terjual'));
        console.log('Homepage contains "bintang":', html.includes('bintang'));
        console.log('Homepage contains "rating":', html.includes('rating'));
        
        // Let's also check a product page
        const prodHtml = await get('https://www.roxystore.web.id/produk/zyha-or-hanna-tas-fashion-korea-wanita-totebag-shoulder-bag-wanita-or-tas-kerja-and-kuliah');
        console.log('Product page contains "penilaian":', prodHtml.includes('penilaian'));
        console.log('Product page contains "terjual":', prodHtml.includes('terjual'));
        console.log('Product page contains "bintang":', prodHtml.includes('bintang'));
        console.log('Product page contains "rating":', prodHtml.includes('rating'));
        
        // Let's search for rating-related classes or strings in the product HTML
        const lines = prodHtml.split('\n');
        const ratingLines = lines.filter(l => l.includes('rating') || l.includes('penilaian') || l.includes('bintang') || l.includes('terjual'));
        console.log('Matching lines on product page (first 20):');
        ratingLines.slice(0, 20).forEach(line => console.log('  ', line.trim()));
    } catch (e) {
        console.error(e);
    }
}

check();
