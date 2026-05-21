const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const product = await prisma.product.findFirst({
        where: {
            title: {
                contains: "Tempflask",
                mode: "insensitive"
            }
        }
    });

    console.log("Detail produk Tempflask lengkap:");
    console.log(JSON.stringify(product, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
