const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Memperbarui data terjual untuk Highwaist Kulot Jeans...");
    const updated = await prisma.product.update({
        where: {
            slug: "highwaist-kulot-jeans-wanita-loose"
        },
        data: {
            shopeeSold: 10000,
            shopeeSoldStr: "10RB+"
        }
    });

    console.log("Pembaruan sukses!");
    console.log(JSON.stringify(updated, null, 2));
}

main()
    .catch(e => {
        console.error("Gagal memperbarui:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
