const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        select: {
            id: true,
            title: true,
            image: true,
            images: true,
            shopeeUrl: true,
            shopeeSold: true,
            shopeeSoldStr: true,
        }
    });
    console.log(`Total products: ${products.length}`);
    products.forEach(p => {
        console.log(`- Title: ${p.title}`);
        console.log(`  Shopee URL: ${p.shopeeUrl}`);
        console.log(`  Main Image: ${p.image ? 'Yes' : 'No'}`);
        console.log(`  Additional Images Count: ${p.images.length}`);
        console.log(`  Images:`, p.images);
        console.log(`  Sold: ${p.shopeeSold} (${p.shopeeSoldStr})`);
        console.log(`-----------------------------------`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
