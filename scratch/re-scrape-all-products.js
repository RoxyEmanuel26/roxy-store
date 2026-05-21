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

console.log('--- ENV LOGS ---');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded' : 'Not Loaded');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);

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
    console.log('\nFetching all products from the database...');
    const products = await prisma.product.findMany({
        select: {
            id: true,
            title: true,
            shopeeUrl: true,
            image: true,
            images: true
        }
    });

    console.log(`Found ${products.length} products total in the database.`);
    
    // Filter products that need updating (either images array is empty, or has 0/1 elements)
    const productsToUpdate = products.filter(p => !p.images || p.images.length === 0);
    console.log(`Found ${productsToUpdate.length} products that have no additional images.`);

    if (productsToUpdate.length === 0) {
        console.log('All products already have multiple images. Nothing to do!');
        return;
    }

    for (let i = 0; i < productsToUpdate.length; i++) {
        const product = productsToUpdate[i];
        console.log(`\n[${i + 1}/${productsToUpdate.length}] Processing product: "${product.title}"`);
        
        if (!product.shopeeUrl) {
            console.log(`- Skip: Product does not have a Shopee URL.`);
            continue;
        }

        console.log(`- Shopee URL: ${product.shopeeUrl}`);
        console.log(`- Scraping and uploading images to Cloudinary...`);
        
        try {
            const scraped = await scrapeShopeeProduct(product.shopeeUrl);
            
            console.log(`- Scraped successfully. Total images found & uploaded: ${scraped.images.length}`);
            
            if (scraped.images.length > 0) {
                const mainImage = scraped.images[0];
                const additionalImages = scraped.images.slice(1); // skip main image
                
                console.log(`- Main image: ${mainImage}`);
                console.log(`- Additional images count: ${additionalImages.length}`);
                
                await prisma.product.update({
                    where: { id: product.id },
                    data: {
                        image: mainImage,
                        images: additionalImages
                    }
                });
                
                console.log(`- SUCCESS: Database updated successfully!`);
            } else {
                console.log(`- Warning: Scraper returned 0 images.`);
            }
        } catch (err) {
            console.error(`- ERROR scraping/updating product "${product.title}":`, err.message || err);
        }
        
        // Wait 1 second between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n--- ALL PRODUCTS PROCESSED ---');
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
