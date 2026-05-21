const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const Papa = require('papaparse');
const prisma = new PrismaClient();

async function run() {
    const csvPath = path.resolve(process.cwd(), 'test program/LinkProdukSekaligus20260521193146-b9ffa90b0d64446a98da889bd4b75c8c.csv');
    console.log('Reading CSV file:', csvPath);
    const fileContent = fs.readFileSync(csvPath, 'utf8');

    const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
    });

    const shopeeUrls = parseResult.data.map(row => {
        return row['Link Komisi Ekstra'] || row['link komisi ekstra'] || '';
    }).filter(Boolean);

    console.log(`Found ${shopeeUrls.length} Shopee URLs in CSV.`);

    const deleted = await prisma.product.deleteMany({
        where: {
            shopeeUrl: {
                in: shopeeUrls
            }
        }
    });

    console.log(`Deleted ${deleted.count} products from database.`);
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
