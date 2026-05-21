const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const product = await prisma.product.findFirst({
        where: {
            title: {
                contains: "Dove",
                mode: "insensitive"
            }
        },
        select: {
            title: true,
            shopeeSold: true,
            shopeeSoldStr: true
        }
    });

    console.log("Detail penjualan Dove:");
    console.log(JSON.stringify(product, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
