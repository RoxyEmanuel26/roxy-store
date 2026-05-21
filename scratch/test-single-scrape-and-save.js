const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');
const { scrapeShopeeProduct } = require('../lib/shopee-scraper');

const prisma = new PrismaClient();

async function run() {
    const url = 'https://s.shopee.co.id/1BJLxhR2uv';
    console.log('Testing Smart Add for URL:', url);

    // 1. Delete existing product with this URL to ensure a clean create
    const deleted = await prisma.product.deleteMany({
        where: {
            shopeeUrl: url
        }
    });
    console.log(`Deleted ${deleted.count} existing products with url ${url}`);

    // 2. Scrape product
    console.log('Scraping product from Shopee...');
    const scraped = await scrapeShopeeProduct(url);
    console.log('Scraped Data:', {
        title: scraped.title,
        description: scraped.description,
        category: scraped.category,
        imageUrl: scraped.imageUrl
    });

    // 3. Resolve category (simulate route.ts logic)
    const categoryName = scraped.category || 'Other';
    let category = await prisma.category.findFirst({
        where: {
            name: {
                equals: categoryName,
                mode: 'insensitive'
            }
        }
    });

    if (!category) {
        const catSlug = slugify(categoryName, { lower: true, locale: 'id', strict: true });
        category = await prisma.category.create({
            data: {
                name: categoryName,
                slug: catSlug || `cat-${Date.now()}`
            }
        });
        console.log(`Created new category: ${category.name}`);
    } else {
        console.log(`Matched existing category: ${category.name}`);
    }

    // 4. Save to database (simulate create product)
    const slug = slugify(scraped.title, { lower: true, locale: 'id', strict: true });
    let finalSlug = slug;
    const slugCheck = await prisma.product.findUnique({ where: { slug: finalSlug } });
    if (slugCheck) {
        finalSlug = `${slug}-${Date.now()}`;
    }

    const newProduct = await prisma.product.create({
        data: {
            title: scraped.title,
            slug: finalSlug,
            description: scraped.description || 'Deskripsi belum tersedia',
            price: 45000, // dummy price
            image: scraped.imageUrl,
            shopeeUrl: url,
            categoryId: category.id,
            isActive: true
        },
        include: {
            category: true
        }
    });

    console.log('\nSaved Product Details:');
    console.log('ID:', newProduct.id);
    console.log('Title:', newProduct.title);
    console.log('Description:', JSON.stringify(newProduct.description));
    console.log('Category:', newProduct.category.name);
    console.log('Image:', newProduct.image);
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
