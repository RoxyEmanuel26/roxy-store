const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log('Querying Termos Kopi product...');
    const product = await prisma.product.findFirst({
        where: {
            title: {
                contains: 'ZYHA'
            }
        },
        include: {
            category: true
        }
    });

    if (product) {
        console.log('Product Found:');
        console.log('ID:', product.id);
        console.log('Title:', product.title);
        console.log('Slug:', product.slug);
        console.log('Description:', JSON.stringify(product.description));
        console.log('Category:', product.category ? product.category.name : 'No category');
        console.log('Image:', product.image);
        console.log('Shopee URL:', product.shopeeUrl);
    } else {
        console.log('Product not found!');
    }
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
