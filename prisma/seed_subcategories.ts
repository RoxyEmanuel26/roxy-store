import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import slugify from 'slugify'

const prisma = new PrismaClient()

// Map category names to their icons from the original seed
const categoryIcons: Record<string, string> = {
    'Elektronik': '💻',
    'Makanan & Minuman': '🍔',
    'Komputer & Aksesoris': '💻',
    'Perawatan & Kecantikan': '💊',
    'Handphone & Aksesoris': '📱',
    'Perlengkapan Rumah': '🏠',
    'Pakaian Pria': '👕',
    'Pakaian Wanita': '👗',
    'Sepatu Pria': '👟',
    'Fashion Muslim': '🧕',
    'Tas Pria': '🎒',
    'Fashion Bayi & Anak': '👶',
    'Aksesoris Fashion': '💍',
    'Ibu & Bayi': '🍼',
    'Jam Tangan': '⌚',
    'Sepatu Wanita': '👠',
    'Kesehatan': '🩺',
    'Tas Wanita': '👜',
    'Hobi & Koleksi': '🎨',
    'Otomotif': '🚗',
    'Olahraga & Outdoor': '⚽',
    'Buku & Alat Tulis': '📚',
    'Souvenir & Perlengkapan Pesta': '🎁',
    'Fotografi': '📷',
    'Voucher': '🎟️'
}

async function main() {
    console.log('🌱 Menjalankan pembibitan sub-kategori...')

    const filePath = path.join(process.cwd(), 'csv_produk', 'sub_kategori.txt')
    if (!fs.existsSync(filePath)) {
        throw new Error(`File sub_kategori.txt tidak ditemukan di: ${filePath}`)
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    let currentCategory: any = null
    let categoryCount = 0
    let subcategoryCount = 0

    for (let line of lines) {
        line = line.trim()
        if (!line) continue

        if (line.startsWith('#')) {
            // Ini adalah Kategori Utama
            const categoryName = line.replace('#', '').trim()
            const categorySlug = slugify(categoryName, { lower: true, locale: 'id', strict: true })
            const icon = categoryIcons[categoryName] || '🛍️'

            console.log(`\n📂 Memproses Kategori Utama: "${categoryName}"`)

            // Upsert Category agar selalu ada
            currentCategory = await prisma.category.upsert({
                where: { slug: categorySlug },
                update: { name: categoryName },
                create: {
                    name: categoryName,
                    slug: categorySlug,
                    icon,
                    description: `Kumpulan produk ${categoryName} pilihan terbaik.`
                }
            })
            categoryCount++
        } else if (currentCategory) {
            // Ini adalah Sub-kategori dari kategori aktif
            const subName = line
            const subSlug = slugify(subName, { lower: true, locale: 'id', strict: true })

            // Upsert Subcategory
            await prisma.subcategory.upsert({
                where: {
                    categoryId_slug: {
                        categoryId: currentCategory.id,
                        slug: subSlug
                    }
                },
                update: { name: subName },
                create: {
                    name: subName,
                    slug: subSlug,
                    categoryId: currentCategory.id,
                    description: `Kumpulan produk ${subName} di kategori ${currentCategory.name}.`
                }
            })
            subcategoryCount++
        }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Pembibitan Sub-kategori Selesai!')
    console.log(`📂 Total Kategori Utama : ${categoryCount}`)
    console.log(`🏷️  Total Sub-kategori  : ${subcategoryCount}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
    .catch((err) => {
        console.error('❌ Terjadi kesalahan saat pembibitan:', err)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
