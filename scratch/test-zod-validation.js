const { z } = require('zod');

const ProductSchema = z.object({
    title: z.string()
        .min(3, 'Judul minimal 3 karakter')
        .max(100, 'Judul maksimal 100 karakter')
        .trim(),
    slug: z.string()
        .min(3, 'Slug minimal 3 karakter')
        .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda -'),
    description: z.string()
        .min(10, 'Deskripsi minimal 10 karakter')
        .max(5000, 'Deskripsi maksimal 5000 karakter'),
    price: z.number()
        .positive('Harga harus lebih dari 0')
        .max(100000000, 'Harga terlalu besar'),
    image: z.string().url('URL foto utama tidak valid'),
    images: z.array(z.string().url()).max(20, 'Maksimal 20 foto tambahan').optional().default([]),
    shopeeUrl: z.string()
        .url('URL Shopee tidak valid')
        .refine(
            (url) => url.includes('shopee.co.id'),
            'Harus berupa link Shopee Indonesia'
        )
        .or(z.literal('')),
    categoryId: z.string().min(1, 'Kategori wajib dipilih'),
    badge: z.enum(['NEW', 'HOT', 'BEST SELLER']).nullable().optional(),
    isActive: z.boolean().default(true),
});

const sampleData = {
    title: 'Gantungan Kunci Hello Kitty',
    slug: 'gantungan-kunci-hello-kitty',
    description: 'Deskripsi produk gantungan kunci hello kitty lucu sekali.',
    price: 15000,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [],
    shopeeUrl: '',
    categoryId: 'cat-123',
    badge: null,
    isActive: true
};

try {
    const res = ProductSchema.parse(sampleData);
    console.log('✅ Validation successful:', res);
} catch (err) {
    console.error('❌ Validation failed:', err.errors);
}
