import { z } from 'zod'

// Auth
export const LoginSchema = z.object({
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
})

// Produk
export const ProductSchema = z.object({
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
    tokopediaUrl: z.string()
        .url('URL Tokopedia tidak valid')
        .refine(
            (url) => url.includes('tokopedia.com'),
            'Harus berupa link Tokopedia'
        )
        .or(z.literal('')),
    categoryId: z.string().min(1, 'Kategori wajib dipilih'),
    badge: z.enum(['NEW', 'HOT', 'BEST SELLER']).nullable().optional(),
    isActive: z.boolean().default(true),
})

// Kategori
export const CategorySchema = z.object({
    name: z.string()
        .min(2, 'Nama minimal 2 karakter')
        .max(50, 'Nama maksimal 50 karakter')
        .trim(),
    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional().or(z.literal('')),
    icon: z.string().max(10, 'Icon terlalu panjang').optional().or(z.literal('')),
})

// Settings
export const SettingsSchema = z.object({
    tagline: z.string().max(200).optional(),
    logo_url: z.string().url().optional().or(z.literal('')),
    hero_title: z.string().max(100).optional(),
    hero_subtitle: z.string().max(200).optional(),
    hero_image: z.string().url().optional().or(z.literal('')),
    about_text: z.string().max(5000).optional(),
    wa_number: z.string()
        .regex(/^628\d{8,12}$/, 'Format: 628xxxxxxxxxx (8-12 digit setelah 628)')
        .optional()
        .or(z.literal('')),
})

// Analytics tracking
export const TrackEventSchema = z.object({
    eventType: z.enum(['view', 'shopee_click', 'tokopedia_click', 'wa_click']),
    productId: z.string().optional(),
})

// Upload
export const UploadQuerySchema = z.object({
    folder: z.string()
        .regex(/^[a-z0-9/-]+$/)
        .optional()
        .default('Roxy-lay/products'),
})

// Pagination
export const PaginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    search: z.string().max(100).optional(),
    categoryId: z.string().optional(),
    badge: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    sort: z.enum(['newest', 'price-asc', 'price-desc', 'popular']).default('newest'),
})

// CSV Import Produk (lebih longgar dari ProductSchema)
export const CsvProductSchema = z.object({
    title: z.string()
        .min(3, 'Judul minimal 3 karakter')
        .max(200, 'Judul maksimal 200 karakter')
        .trim(),
    description: z.string().default(''),
    price: z.number().min(0).default(0),
    image: z.string().url('URL gambar utama tidak valid').or(z.literal('')).default(''),
    images: z.string().default(''), // pipe-separated URLs
    shopeeUrl: z.string().url().or(z.literal('')).default(''),
    tokopediaUrl: z.string().url().or(z.literal('')).default(''),
    category: z.string().default('Other'),
    badge: z.enum(['NEW', 'HOT', 'BEST SELLER', '']).default(''),
    isActive: z.preprocess(
        (val) => val === 'true' || val === true || val === '1',
        z.boolean().default(true)
    ),
})

// Type exports
export type LoginInput = z.infer<typeof LoginSchema>
export type ProductInput = z.infer<typeof ProductSchema>
export type CategoryInput = z.infer<typeof CategorySchema>
export type SettingsInput = z.infer<typeof SettingsSchema>
export type TrackEventInput = z.infer<typeof TrackEventSchema>
export type PaginationInput = z.infer<typeof PaginationSchema>
export type CsvProductInput = z.infer<typeof CsvProductSchema>
