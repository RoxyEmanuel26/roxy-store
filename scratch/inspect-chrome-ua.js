const fs = require('fs');

async function run() {
    const url = 'https://shopee.co.id/product/1505191648/26681173222';
    console.log('Fetching:', url);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache'
            }
        });
        console.log('Status:', res.status);
        console.log('Final URL:', res.url);
        const html = await res.text();
        fs.writeFileSync('scratch/chrome-desktop.html', html);
        console.log('Saved to scratch/chrome-desktop.html (length:', html.length, ')');
        
        // Check for captcha/robot
        console.log('Contains captcha?', html.toLowerCase().includes('captcha'));
        console.log('Contains robot?', html.toLowerCase().includes('robot'));
        console.log('Contains verification?', html.toLowerCase().includes('verification'));
        console.log('Contains login?', html.toLowerCase().includes('login'));
        console.log('Contains title?', html.match(/<title[^>]*>([\s\S]*?)<\/title>/i));
    } catch (e) {
        console.error(e);
    }
}

run();
