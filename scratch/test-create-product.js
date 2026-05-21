const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        // Find a category to use
        const category = await prisma.category.findFirst();
        if (!category) {
            console.error('No category found, please create one first');
            return;
        }
        console.log('Using category:', category.name, 'id:', category.id);

        const slug = 'test-manual-product-' + Date.now();
        const product = await prisma.product.create({
            data: {
                title: 'Test Manual Product',
                slug: slug,
                description: 'This is a description that is long enough to pass validations.',
                price: 25000,
                image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
                images: [],
                shopeeUrl: '',
                categoryId: category.id,
                badge: null,
                isActive: true,
            }
        });
        console.log('✅ Product created successfully:', product.id);

        // Delete the test product
        await prisma.product.delete({ where: { id: product.id } });
        console.log('✅ Test product cleaned up');
    } catch (err) {
        console.error('❌ Error creating product:', err);
    } finally {
        await prisma.$disconnect();
    }
}

run();
