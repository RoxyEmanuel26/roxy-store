import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const settings = await prisma.siteSettings.findMany()
    console.log('Site Settings:')
    settings.forEach(s => {
        console.log(`Key: ${s.key}`);
        console.log(`Value: ${s.value}`);
        console.log('---');
    })
}

main().catch(console.error).finally(() => prisma.$disconnect())
