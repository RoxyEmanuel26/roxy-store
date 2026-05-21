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

// Register ts-node programmatically
require('ts-node').register({
    compilerOptions: {
        module: 'CommonJS',
        target: 'ES2017'
    }
});

// Register tsconfig-paths
const tsConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../tsconfig.json'), 'utf8'));
const tsConfigPaths = require('tsconfig-paths');
tsConfigPaths.register({
    baseUrl: path.join(__dirname, '../'),
    paths: tsConfig.compilerOptions.paths
});

const { PrismaClient } = require('@prisma/client');
const { scrapeShopeeProduct } = require('../lib/shopee-scraper');

const prisma = new PrismaClient();

async function run() {
    console.log('\nFetching products with missing/placeholder descriptions...');
    
    const products = await prisma.product.findMany({
        where: {
            OR: [
                { description: 'Deskripsi belum tersedia' },
                { description: 'Deskripsi belum tersedia.' },
                { description: '' }
            ]
        },
        select: {
            id: true,
            title: true,
            shopeeUrl: true,
            description: true
        }
    });

    console.log(`Found ${products.length} products with missing descriptions in the database.`);

    if (products.length === 0) {
        console.log('No products need description updates!');
        return;
    }

    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        console.log(`\n[${i + 1}/${products.length}] Processing product: "${product.title}"`);
        
        if (!product.shopeeUrl) {
            console.log(`- Skip: Product does not have a Shopee URL.`);
            continue;
        }

        console.log(`- Shopee URL: ${product.shopeeUrl}`);
        console.log(`- Scraping Shopee page for description...`);
        
        try {
            const scraped = await scrapeShopeeProduct(product.shopeeUrl);
            
            if (scraped.description && scraped.description !== 'Deskripsi belum tersedia' && scraped.description.trim() !== '') {
                console.log(`- Scraped successfully. Description length: ${scraped.description.length} chars.`);
                
                await prisma.product.update({
                    where: { id: product.id },
                    data: {
                        description: scraped.description
                    }
                });
                
                console.log(`- SUCCESS: Description updated in database!`);
            } else {
                console.log(`- Warning: Scraper returned empty or placeholder description.`);
            }
        } catch (err) {
            console.error(`- ERROR scraping product "${product.title}":`, err.message || err);
        }
        
        // Wait 1 second between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n--- ALL DESCRIPTIONS UPDATED ---');
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
