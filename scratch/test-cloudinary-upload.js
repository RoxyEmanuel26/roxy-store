const fs = require('fs');
const path = require('path');

// Load env files handling Windows carriage returns
function loadEnv(filePath) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
        const trimmed = line.replace(/\r$/, '').trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const index = trimmed.indexOf('=');
        if (index === -1) return;
        const key = trimmed.slice(0, index).trim();
        let value = trimmed.slice(index + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        process.env[key] = value;
    });
}

loadEnv(path.join(__dirname, '../.env'));
loadEnv(path.join(__dirname, '../.env.local'));

console.log('--- ENV LOGS (CommonJS) ---');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Loaded' : 'Not Loaded');

// Register ts-node programmatically to compile TS files on the fly as CommonJS
require('ts-node').register({
    compilerOptions: {
        module: 'CommonJS',
        target: 'ES2017'
    }
});

// Register tsconfig-paths so path mapping like '@/lib/...' works
const tsConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../tsconfig.json'), 'utf8'));
const tsConfigPaths = require('tsconfig-paths');
tsConfigPaths.register({
    baseUrl: path.join(__dirname, '../'),
    paths: tsConfig.compilerOptions.paths
});

const { scrapeShopeeProduct } = require('../lib/shopee-scraper');

async function test() {
    const url = 'https://s.shopee.co.id/1BJLxhR2uv';
    console.log('\nTesting scrapeShopeeProduct with Cloudinary upload for URL:', url);
    const result = await scrapeShopeeProduct(url);
    console.log('\n--- SUCCESS SCRAPING AND UPLOADING ---');
    console.log('Title:', result.title);
    console.log('Category:', result.category);
    console.log('Main Image:', result.imageUrl);
    console.log('Uploaded Images Count:', result.images.length);
    console.log('Images List:');
    result.images.forEach((img, idx) => {
        console.log(`  [${idx}]: ${img}`);
    });
}

test().catch(console.error);
