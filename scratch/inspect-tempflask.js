const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Mencari produk Tempflask...");
    const products = await prisma.product.findMany({
        where: {
            title: {
                contains: "Tempflask",
                mode: "insensitive"
            }
        },
        select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            shopeeSold: true,
            shopeeSoldStr: true,
            viewCount: true,
            image: true,
            images: true
        }
    });

    console.log("Hasil pencarian:");
    console.log(JSON.stringify(products, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
