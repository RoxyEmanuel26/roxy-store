const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Memperbarui data terjual untuk Tempflask...");
    const updated = await prisma.product.update({
        where: {
            slug: "tempflask-and-pashlinc-tumbler-botol-mug-kopi-teh-stainless-steel-380510ml-campaign-innerless-steel"
        },
        data: {
            shopeeSold: 1200,
            shopeeSoldStr: "1.2rb"
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
