import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // Buat akun admin default
    const passwordHash = await bcrypt.hash('RoxyLay@2026', 12)

    await prisma.admin.upsert({
        where: { email: 'admin@Roxylay.com' },
        update: {},
        create: {
            email: 'admin@Roxylay.com',
            passwordHash,
            name: 'Admin Roxy Lay',
            role: 'admin',
        },
    })

    // Buat SiteSettings default
    const defaultSettings = [
        { key: 'tagline', value: 'Aksesori Wanita Colorful & Lucu' },
        { key: 'logo_url', value: '' },
        { key: 'hero_title', value: 'Koleksi Aksesori Wanita Terbaik' },
        {
            key: 'hero_subtitle',
            value: 'Temukan gantungan kunci, beads bracelet, dan aksesori lucu lainnya'
        },
        { key: 'hero_image', value: '' },
        {
            key: 'about_text',
            value: 'Roxy Lay adalah toko aksesori wanita yang menyediakan produk handmade berkualitas.'
        },
        { key: 'wa_number', value: '6281234567890' },
    ]

    for (const setting of defaultSettings) {
        await prisma.siteSettings.upsert({
            where: { key: setting.key },
            update: {},
            create: setting,
        })
    }

    // Buat beberapa kategori contoh
    const categories = [
        { name: 'Gantungan Kunci', slug: 'gantungan-kunci' },
        { name: 'Beads Bracelet', slug: 'beads-bracelet' },
        { name: 'Beads HP', slug: 'beads-hp' },
        { name: 'Kalung', slug: 'kalung' },
        { name: 'Anting', slug: 'anting' },
    ]

    for (const category of categories) {
        await prisma.category.upsert({
            where: { slug: category.slug },
            update: {},
            create: category,
        })
    }

    console.log('✅ Seed berhasil!')
    console.log('📧 Email admin : admin@Roxylay.com')
    console.log('🔑 Password    : RoxyLay@2026')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
