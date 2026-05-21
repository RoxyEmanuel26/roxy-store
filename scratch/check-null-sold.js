const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        where: {
            shopeeSold: null
        },
        select: {
            id: true,
            title: true,
            slug: true,
            shopeeUrl: true
        }
    });

    console.log(`Ditemukan ${products.length} produk dengan data terjual kosong:`);
    console.log(JSON.stringify(products, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
