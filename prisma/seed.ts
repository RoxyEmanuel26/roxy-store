import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // ───────────────────────────────────────────
    // ADMIN
    // ───────────────────────────────────────────
    // Gunakan password dari .env, wajibkan env var
    const initialEmail = process.env.ADMIN_INITIAL_EMAIL
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD

    if (!initialEmail || !initialPassword) {
        throw new Error(
            'CRITICAL SECURITY ERROR: ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD environment variables must be defined in your .env file to seed the database!'
        )
    }

    const passwordHash = await bcrypt.hash(initialPassword, 12)

    await prisma.admin.upsert({
        where: { email: initialEmail },
        update: {},
        create: {
            email: initialEmail,
            passwordHash,
            name: 'Roxy Store Admin',
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
        { name: 'Elektronik', slug: 'elektronik', description: 'Kumpulan produk Elektronik pilihan terbaik.', icon: '💻' },
        { name: 'Makanan & Minuman', slug: 'makanan-minuman', description: 'Kumpulan produk Makanan & Minuman pilihan terbaik.', icon: '🍔' },
        { name: 'Komputer & Aksesoris', slug: 'komputer-aksesoris', description: 'Kumpulan produk Komputer & Aksesoris pilihan terbaik.', icon: '💻' },
        { name: 'Perawatan & Kecantikan', slug: 'perawatan-kecantikan', description: 'Kumpulan produk Perawatan & Kecantikan pilihan terbaik.', icon: '💊' },
        { name: 'Handphone & Aksesoris', slug: 'handphone-aksesoris', description: 'Kumpulan produk Handphone & Aksesoris pilihan terbaik.', icon: '📱' },
        { name: 'Perlengkapan Rumah', slug: 'perlengkapan-rumah', description: 'Kumpulan produk Perlengkapan Rumah pilihan terbaik.', icon: '🏠' },
        { name: 'Pakaian Pria', slug: 'pakaian-pria', description: 'Kumpulan produk Pakaian Pria pilihan terbaik.', icon: '👕' },
        { name: 'Pakaian Wanita', slug: 'pakaian-wanita', description: 'Kumpulan produk Pakaian Wanita pilihan terbaik.', icon: '👗' },
        { name: 'Sepatu Pria', slug: 'sepatu-pria', description: 'Kumpulan produk Sepatu Pria pilihan terbaik.', icon: '👟' },
        { name: 'Fashion Muslim', slug: 'fashion-muslim', description: 'Kumpulan produk Fashion Muslim pilihan terbaik.', icon: '🧕' },
        { name: 'Tas Pria', slug: 'tas-pria', description: 'Kumpulan produk Tas Pria pilihan terbaik.', icon: '🎒' },
        { name: 'Fashion Bayi & Anak', slug: 'fashion-bayi-anak', description: 'Kumpulan produk Fashion Bayi & Anak pilihan terbaik.', icon: '👶' },
        { name: 'Aksesoris Fashion', slug: 'aksesoris-fashion', description: 'Kumpulan produk Aksesoris Fashion pilihan terbaik.', icon: '💍' },
        { name: 'Ibu & Bayi', slug: 'ibu-bayi', description: 'Kumpulan produk Ibu & Bayi pilihan terbaik.', icon: '🍼' },
        { name: 'Jam Tangan', slug: 'jam-tangan', description: 'Kumpulan produk Jam Tangan pilihan terbaik.', icon: '⌚' },
        { name: 'Sepatu Wanita', slug: 'sepatu-wanita', description: 'Kumpulan produk Sepatu Wanita pilihan terbaik.', icon: '👠' },
        { name: 'Kesehatan', slug: 'kesehatan', description: 'Kumpulan produk Kesehatan pilihan terbaik.', icon: '🩺' },
        { name: 'Tas Wanita', slug: 'tas-wanita', description: 'Kumpulan produk Tas Wanita pilihan terbaik.', icon: '👜' },
        { name: 'Hobi & Koleksi', slug: 'hobi-koleksi', description: 'Kumpulan produk Hobi & Koleksi pilihan terbaik.', icon: '🎨' },
        { name: 'Otomotif', slug: 'otomotif', description: 'Kumpulan produk Otomotif pilihan terbaik.', icon: '🚗' },
        { name: 'Olahraga & Outdoor', slug: 'olahraga-outdoor', description: 'Kumpulan produk Olahraga & Outdoor pilihan terbaik.', icon: '⚽' },
        { name: 'Buku & Alat Tulis', slug: 'buku-alat-tulis', description: 'Kumpulan produk Buku & Alat Tulis pilihan terbaik.', icon: '📚' },
        { name: 'Souvenir & Perlengkapan Pesta', slug: 'souvenir-perlengkapan-pesta', description: 'Kumpulan produk Souvenir & Perlengkapan Pesta pilihan terbaik.', icon: '🎁' },
        { name: 'Fotografi', slug: 'fotografi', description: 'Kumpulan produk Fotografi pilihan terbaik.', icon: '📷' },
        { name: 'Voucher', slug: 'voucher', description: 'Kumpulan produk Voucher pilihan terbaik.', icon: '🎟️' }
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
    console.log(`📧 Email admin       : ${initialEmail}`)
    console.log('🔑 Password          : ******** (dari .env)')
    console.log('🌐 Jenis website     : Shopee Affiliate')
    console.log('📦 Total kategori    :', categories.length)
    console.log('⚙️  Total settings    :', defaultSettings.length)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('⚠️  Isi shopee_affiliate_id di SiteSettings setelah daftar!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
