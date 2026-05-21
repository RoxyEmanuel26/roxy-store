const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log('Querying all products...');
    const products = await prisma.product.findMany({
        include: {
            category: true
        }
    });

    const categoryCounts = {};
    const details = [];

    for (const p of products) {
        const catName = p.category ? p.category.name : 'No category';
        categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
        details.push({
            title: p.title.substring(0, 40) + '...',
            category: catName,
            descriptionSnippet: p.description.substring(0, 50) + '...',
            shopeeUrl: p.shopeeUrl
        });
    }

    console.log('\nCategory Distribution:');
    console.log(categoryCounts);

    console.log('\nFirst 10 Products Details:');
    console.log(details.slice(0, 10));
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
