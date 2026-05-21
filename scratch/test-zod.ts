import { ProductSchema } from '../lib/validations'

const testPayloads = [
  // 1. Valid payload with empty shopeeUrl
  {
    title: 'Gantungan Kunci Lucu',
    slug: 'gantungan-kunci-lucu',
    description: 'Ini deskripsi gantungan kunci lucu yang sangat panjang dan memadai.',
    price: 15000,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [],
    shopeeUrl: '',
    categoryId: 'some-category-id',
    badge: null,
    isActive: true,
  },
  // 2. Valid payload with shopeeUrl
  {
    title: 'Gantungan Kunci Lucu 2',
    slug: 'gantungan-kunci-lucu-2',
    description: 'Ini deskripsi gantungan kunci lucu yang sangat panjang dan memadai.',
    price: 15000,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
    shopeeUrl: 'https://shopee.co.id/product-i.123.456',
    categoryId: 'some-category-id',
    badge: 'NEW',
    isActive: true,
  },
  // 3. Invalid payload - invalid shopeeUrl format
  {
    title: 'Gantungan Kunci Lucu 3',
    slug: 'gantungan-kunci-lucu-3',
    description: 'Ini deskripsi gantungan kunci lucu yang sangat panjang dan memadai.',
    price: 15000,
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    images: [],
    shopeeUrl: 'invalid-url',
    categoryId: 'some-category-id',
    badge: null,
    isActive: true,
  }
]

for (const [index, payload] of testPayloads.entries()) {
  const result = ProductSchema.safeParse(payload)
  console.log(`Payload ${index + 1} Success:`, result.success)
  if (!result.success) {
    console.log(`Payload ${index + 1} Errors:`, result.error.issues)
  }
}
