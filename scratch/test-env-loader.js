const fs = require('fs');
const path = require('path');

// Manually parse env files
function loadEnv(filePath) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const index = trimmed.indexOf('=');
        if (index === -1) return;
        const key = trimmed.slice(0, index).trim();
        let value = trimmed.slice(index + 1).trim();
        // Strip quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        process.env[key] = value;
    });
}

// Load env files
loadEnv(path.join(__dirname, '../.env'));
loadEnv(path.join(__dirname, '../.env.local'));

console.log('Database URL loaded:', process.env.DATABASE_URL ? 'Yes' : 'No');
console.log('Cloudinary URL loaded:', process.env.CLOUDINARY_URL || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? 'Yes' : 'No');

const { scrapeShopeeProduct } = require('../dist-lib/shopee-scraper'); // wait, let's use the actual file path or run via ts-node!
