const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const Papa = require('papaparse');
const prisma = new PrismaClient();

// Helper to clean/normalize
function cleanNumberString(val) {
    let str = val.trim();
    str = str.replace(/^(rp|idr|usd|sgd)\.?\s*/i, '');
    str = str.replace(/[^\d.,-]/g, '');
    if (!str) return '0';
    return str;
}

function parseStringWithMultipliers(val) {
    if (val === '' || val === undefined || val === null) return 0;
    let str = String(val).trim().toLowerCase();
    str = str.replace(/^(rp|idr|usd|sgd)\.?\s*/i, '');
    str = str.replace(/terjual/g, '').trim();
    
    let multiplier = 1;
    if (str.includes('ribu') || str.includes('rb') || str.includes('k')) {
        multiplier = 1000;
        str = str.replace(/ribu|rb|\+/g, '').replace(/k/g, '').trim();
    } else if (str.includes('juta') || str.includes('jt')) {
        multiplier = 1000000;
        str = str.replace(/juta|jt|\+/g, '').trim();
    } else {
        str = str.replace(/\+/g, '').trim();
    }
    
    if (multiplier > 1) {
        str = cleanNumberString(str);
    } else {
        str = cleanNumberString(str);
    }
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed * multiplier;
}

async function main() {
    console.log("Starting database sold counts migration/update script...");
    
    // Read the CSV file
    const csvPath = 'test program/LinkProdukSekaligus20260521193146-b9ffa90b0d64446a98da889bd4b75c8c.csv';
    if (!fs.existsSync(csvPath)) {
        console.error(`CSV file not found at: ${csvPath}`);
        return;
    }
    
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const parsed = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true
    });
    
    console.log(`Parsed ${parsed.data.length} rows from CSV.`);
    
    let matched = 0;
    let updated = 0;
    
    for (const row of parsed.data) {
        const title = row['Nama Produk'] || row['nama produk'] || row['Title'] || row['title'];
        const shopeeUrl = row['Link Komisi Ekstra'] || row['link komisi ekstra'] || row['ShopeeUrl'] || row['shopeeUrl'];
        const penjualan = row['Penjualan'] || row['penjualan'] || row['ShopeeSold'] || row['shopeeSold'];
        
        if (!title) continue;
        
        // Find matching product in database by title or shopeeUrl
        let dbProduct = null;
        if (shopeeUrl) {
            dbProduct = await prisma.product.findFirst({
                where: { shopeeUrl: shopeeUrl.trim() }
            });
        }
        
        if (!dbProduct) {
            dbProduct = await prisma.product.findFirst({
                where: { title: title.trim() }
            });
        }
        
        if (dbProduct) {
            matched++;
            const parsedSold = Math.round(parseStringWithMultipliers(penjualan));
            const soldStr = penjualan ? String(penjualan).trim() : null;
            
            console.log(`Matching Product: "${dbProduct.title}"`);
            console.log(`  CSV Sold: "${penjualan}" -> Parsed: ${parsedSold}, Str: "${soldStr}"`);
            
            await prisma.product.update({
                where: { id: dbProduct.id },
                data: {
                    shopeeSold: parsedSold,
                    shopeeSoldStr: soldStr
                }
            });
            updated++;
        }
    }
    
    console.log(`\nMigration completed successfully.`);
    console.log(`Total CSV rows checked: ${parsed.data.length}`);
    console.log(`Total matched products: ${matched}`);
    console.log(`Total updated products: ${updated}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
