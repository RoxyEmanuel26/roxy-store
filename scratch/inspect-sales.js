const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        take: 5,
        select: {
            title: true,
            shopeeSold: true,
            shopeeSoldStr: true
        }
    });

    console.log("5 Produk Teratas di Database:");
    console.log(JSON.stringify(products, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
