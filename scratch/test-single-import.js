const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');
const cloudinary = require('cloudinary').v2;

function loadEnv() {
    const paths = ['.env', '.env.local'];
    paths.forEach(p => {
        const fullPath = path.resolve(process.cwd(), p);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            content.split('\n').forEach(line => {
                const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
                if (match) {
                    const key = match[1];
                    let value = match[2] || '';
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.substring(1, value.length - 1);
                    } else if (value.startsWith("'") && value.endsWith("'")) {
                        value = value.substring(1, value.length - 1);
                    }
                    process.env[key] = value.trim();
                }
            });
        }
    });
}

loadEnv();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const prisma = new PrismaClient();

function decodeHtmlEntities(str) {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

function getMetaContent(html, propertyOrName) {
    const metaTags = html.match(/<meta[^>]+>/gi) || [];
    for (const tag of metaTags) {
        const hasProp = tag.includes(`property="${propertyOrName}"`) || 
                        tag.includes(`property='${propertyOrName}'`) ||
                        tag.includes(`name="${propertyOrName}"`) ||
                        tag.includes(`name='${propertyOrName}'`);
        if (hasProp) {
            const contentMatch = tag.match(/content="([^"]+)"/i) || tag.match(/content='([^']+)'/i);
            if (contentMatch) {
                return decodeHtmlEntities(contentMatch[1]);
            }
        }
    }
    return null;
}

function cleanShopeeTitle(title) {
    let clean = title.trim();
    if (clean.toLowerCase().startsWith('jual ')) {
        clean = clean.substring(5);
    }
    const suffix = ' | Shopee Indonesia';
    if (clean.toLowerCase().endsWith(suffix.toLowerCase())) {
        clean = clean.substring(0, clean.length - suffix.length);
    }
    return clean.trim();
}

async function scrapeShopeeProduct(url) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_codedoc.html)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        },
        redirect: 'follow'
    });

    if (!response.ok) {
        throw new Error(`Gagal mengambil halaman Shopee (Status: ${response.status})`);
    }

    const html = await response.text();

    const rawTitle = getMetaContent(html, 'og:title') || getMetaContent(html, 'twitter:title') || '';
    const title = cleanShopeeTitle(rawTitle);
    const description = getMetaContent(html, 'og:description') || getMetaContent(html, 'description') || '';
    const rawImageUrl = getMetaContent(html, 'og:square_image') || getMetaContent(html, 'og:image') || '';

    let imageUrl = '';
    if (rawImageUrl) {
        try {
            console.log(`Uploading ${rawImageUrl} to Cloudinary...`);
            const uploadRes = await cloudinary.uploader.upload(rawImageUrl, {
                folder: 'Roxy-lay/products',
                transformation: [
                    { width: 1200, height: 1200, crop: 'limit' },
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' },
                ],
            });
            imageUrl = uploadRes.secure_url;
            console.log(`Cloudinary Upload Success: ${imageUrl}`);
        } catch (err) {
            console.error('Failed to upload image to Cloudinary:', err.message);
            imageUrl = rawImageUrl; // Fallback
        }
    }

    return {
        title,
        description,
        imageUrl,
        rawImageUrl
    };
}

async function main() {
    const shopeeUrl = 'https://s.shopee.co.id/1BJLxhR2uv';
    console.log(`1. Cleaning up database records matching: ${shopeeUrl}`);
    
    const deleteResult = await prisma.product.deleteMany({
        where: { shopeeUrl }
    });
    console.log(`Deleted ${deleteResult.count} matching product(s).`);

    console.log(`2. Scraping Shopee URL: ${shopeeUrl}`);
    const scraped = await scrapeShopeeProduct(shopeeUrl);
    console.log('Scraped Data:', scraped);

    // Resolve category id
    let category = await prisma.category.findFirst({
        where: { name: 'Other' }
    });
    if (!category) {
        category = await prisma.category.create({
            data: {
                name: 'Other',
                slug: 'other'
            }
        });
        console.log('Created default "Other" category.');
    }

    const slug = slugify(scraped.title, { lower: true, locale: 'id', strict: true });
    
    // Clean up slug if exists
    let finalSlug = slug;
    const existingProduct = await prisma.product.findUnique({
        where: { slug: finalSlug }
    });
    if (existingProduct) {
        await prisma.product.delete({
            where: { id: existingProduct.id }
        });
        console.log(`Deleted existing product with conflicting slug: ${finalSlug}`);
    }

    console.log(`3. Creating product in database with title: ${scraped.title}`);
    const newProduct = await prisma.product.create({
        data: {
            title: scraped.title,
            slug: finalSlug,
            description: scraped.description || 'Deskripsi tidak tersedia',
            price: 45000, // mock price as user would fill in manually
            image: scraped.imageUrl,
            shopeeUrl: shopeeUrl,
            categoryId: category.id,
            badge: 'NEW',
            isActive: true
        }
    });

    console.log('Product created successfully:', {
        id: newProduct.id,
        title: newProduct.title,
        slug: newProduct.slug,
        image: newProduct.image,
        shopeeUrl: newProduct.shopeeUrl
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
