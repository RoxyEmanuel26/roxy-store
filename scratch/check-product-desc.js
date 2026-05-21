const fs = require('fs');
const path = require('path');

// Load env files
function loadEnv(filePath) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
        const trimmed = line.replace(/\r$/, '').trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const index = trimmed.indexOf('=');
        if (index === -1) return;
        const key = trimmed.slice(0, index).trim();
        let value = trimmed.slice(index + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        process.env[key] = value;
    });
}

loadEnv(path.join(__dirname, '../.env'));
loadEnv(path.join(__dirname, '../.env.local'));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const product = await prisma.product.findFirst({
        where: { slug: 'zyha-or-hanna-tas-fashion-korea-wanita-totebag-shoulder-bag-wanita-or-tas-kerja-and-kuliah' }
    });
    if (product) {
        console.log('Product Found:', product.title);
        console.log('Description:', product.description);
        console.log('Images Count:', product.images.length);
        console.log('Image:', product.image);
    } else {
        console.log('Product not found!');
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
