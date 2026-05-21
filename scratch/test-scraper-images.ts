import fs from 'fs';
import path from 'path';

// Load env files handling Windows carriage returns
function loadEnv(filePath: string) {
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

console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Loaded (starts with ' + process.env.CLOUDINARY_API_SECRET.slice(0, 3) + ')' : 'Not Loaded');

import { scrapeShopeeProduct } from '../lib/shopee-scraper';

async function test() {
    const url = 'https://s.shopee.co.id/1BJLxhR2uv';
    console.log('Testing scrapeShopeeProduct for URL with Cloudinary upload:', url);
    const result = await scrapeShopeeProduct(url);
    console.log('--- SCRAPING RESULT ---');
    console.log('Title:', result.title);
    console.log('ImageUrl:', result.imageUrl);
    console.log('Images List (Total:', result.images.length, '):');
    result.images.forEach((img, idx) => console.log(`  [${idx}]: ${img}`));
}

test().catch(console.error);
