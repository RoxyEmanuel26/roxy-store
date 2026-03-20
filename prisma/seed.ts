import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // ───────────────────────────────────────────
    // ADMIN
    // ───────────────────────────────────────────
    const passwordHash = await bcrypt.hash('RoxyLay@2026', 12)

    await prisma.admin.upsert({
        where: { email: 'admin@roxylay.com' },
        update: {},
        create: {
            email: 'admin@roxylay.com',
            passwordHash,
            name: 'Roxy Emanuel',
            role: 'admin',
        },
    })

    // ───────────────────────────────────────────
    // SITE SETTINGS
    // ───────────────────────────────────────────
    const defaultSettings = [
        {
            key: 'site_name',
            value: 'Roxy Store',
        },
        {
            key: 'tagline',
            value: 'Rekomendasi Produk Terbaik & Terlaris di Shopee 🛍️',
        },
        {
            key: 'logo_url',
            value: '',
        },
        {
            key: 'favicon_url',
            value: '',
        },
        {
            key: 'hero_title',
            value: 'Temukan Produk Terlaris Shopee dengan Harga Terbaik ✨',
        },
        {
            key: 'hero_subtitle',
            value:
                'Kami mengumpulkan produk-produk pilihan terlaris dan terpercaya dari Shopee khusus untukmu — belanja lebih mudah, lebih hemat!',
        },
        {
            key: 'hero_image',
            value: '',
        },
        {
            key: 'hero_cta_text',
            value: 'Lihat Produk Pilihan',
        },
        {
            key: 'hero_cta_url',
            value: '/produk',
        },
        {
            key: 'about_title',
            value: 'Tentang Roxy Store',
        },
        {
            key: 'about_text',
            value:
                'Roxy Store adalah website rekomendasi produk terlaris Shopee yang dikurasi secara cermat. Kami membantu kamu menemukan produk terbaik dari berbagai kategori — skincare, fashion, rumah tangga, teknologi, dan banyak lagi — tanpa perlu riset panjang. Semua produk yang kami rekomendasikan sudah diseleksi berdasarkan rating, ulasan pembeli, dan tren belanja terkini.',
        },
        {
            key: 'about_image',
            value: '',
        },
        {
            key: 'affiliate_disclaimer',
            value:
                'Website ini mengandung link afiliasi. Kami mendapatkan komisi kecil dari setiap pembelian tanpa biaya tambahan bagimu.',
        },
        {
            key: 'shopee_affiliate_id',
            // ⚠️ Isi dengan Affiliate ID Shopee kamu setelah daftar
            value: '',
        },
        {
            key: 'cta_button_text',
            value: 'Beli di Shopee 🛒',
        },
        {
            key: 'instagram_url',
            value: '',
        },
        {
            key: 'tiktok_url',
            value: '',
        },
        {
            key: 'telegram_channel_url',
            value: '',
        },
        {
            key: 'facebook_group_url',
            value: '',
        },
        {
            key: 'meta_description',
            value:
                'Roxy Store — Rekomendasi produk terlaris dan terpercaya di Shopee. Temukan produk skincare, fashion, rumah tangga, gaming, dan lainnya dengan harga terbaik.',
        },
        {
            key: 'meta_keywords',
            value:
                'rekomendasi produk shopee, produk terlaris shopee, skincare murah shopee, fashion shopee, produk viral shopee 2026, shopee affiliate',
        },
        {
            key: 'footer_text',
            value:
                '© 2026 Roxy Store. Website Rekomendasi Produk Shopee Terpercaya 🛍️',
        },
        {
            key: 'products_per_page',
            value: '12',
        },
        {
            key: 'show_discount_badge',
            value: 'true',
        },
        {
            key: 'show_sold_count',
            value: 'true',
        },
        {
            key: 'show_rating',
            value: 'true',
        },
    ]

    for (const setting of defaultSettings) {
        await prisma.siteSettings.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: setting,
        })
    }

    // ───────────────────────────────────────────
    // KATEGORI PRODUK AFFILIATE
    // ───────────────────────────────────────────
    const categories = [
        {
            name: 'Skincare & Kecantikan',
            slug: 'skincare-kecantikan',
            description:
                'Produk skincare, makeup, dan perawatan diri terlaris di Shopee dengan harga terjangkau.',
            icon: '💄',
        },
        {
            name: 'Fashion Wanita',
            slug: 'fashion-wanita',
            description:
                'Pakaian, hijab, dan aksesori fashion wanita tren terkini yang laris di Shopee.',
            icon: '👗',
        },
        {
            name: 'Fashion Pria',
            slug: 'fashion-pria',
            description:
                'Pakaian, sepatu, dan aksesori fashion pria terlaris dan terpopuler di Shopee.',
            icon: '👕',
        },
        {
            name: 'Rumah Tangga',
            slug: 'rumah-tangga',
            description:
                'Perlengkapan dapur, peralatan rumah, dan produk kebersihan terlaris di Shopee.',
            icon: '🏠',
        },
        {
            name: 'Gadget & Elektronik',
            slug: 'gadget-elektronik',
            description:
                'Aksesoris HP, gadget, earphone, dan produk elektronik murah terlaris di Shopee.',
            icon: '📱',
        },
        {
            name: 'Gaming',
            slug: 'gaming',
            description:
                'Aksesoris gaming, mouse, keyboard, headset, dan perlengkapan gamer terlaris di Shopee.',
            icon: '🎮',
        },
        {
            name: 'Kesehatan & Suplemen',
            slug: 'kesehatan-suplemen',
            description:
                'Suplemen, vitamin, produk kesehatan, dan alat kesehatan terlaris di Shopee.',
            icon: '💊',
        },
        {
            name: 'Makanan & Minuman',
            slug: 'makanan-minuman',
            description:
                'Snack, minuman, bumbu masak, dan produk makanan terlaris yang bisa dikirim via Shopee.',
            icon: '🍜',
        },
        {
            name: 'Ibu & Bayi',
            slug: 'ibu-bayi',
            description:
                'Perlengkapan bayi, mainan edukatif, dan produk ibu hamil terlaris di Shopee.',
            icon: '👶',
        },
        {
            name: 'Olahraga',
            slug: 'olahraga',
            description:
                'Perlengkapan olahraga, fitness, dan outdoor terlaris dan terpercaya di Shopee.',
            icon: '🏋️',
        },
        {
            name: 'Tas & Dompet',
            slug: 'tas-dompet',
            description:
                'Tas wanita, tas pria, dompet, dan aksesoris travel terlaris di Shopee.',
            icon: '👜',
        },
        {
            name: 'Promo & Flash Sale',
            slug: 'promo-flash-sale',
            description:
                'Kumpulan produk Shopee yang sedang promo besar, flash sale, dan diskon spesial.',
            icon: '🔥',
        },
    ]

    for (const category of categories) {
        await prisma.category.upsert({
            where: { slug: category.slug },
            update: {
                name: category.name,
                description: category.description,
                icon: category.icon,
            },
            create: category,
        })
    }

    // ───────────────────────────────────────────
    // DONE
    // ───────────────────────────────────────────
    console.log('✅ Seed Roxy Store Affiliate berhasil!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email admin       : admin@roxylay.com')
    console.log('🔑 Password          : RoxyLay@2026')
    console.log('🌐 Jenis website     : Shopee Affiliate')
    console.log('📦 Total kategori    :', categories.length)
    console.log('⚙️  Total settings    :', defaultSettings.length)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('⚠️  Isi shopee_affiliate_id di SiteSettings setelah daftar!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
