const fs = require('fs');
const Papa = require('papaparse');

// Simple mock functions mimicking route.ts
function cleanNumberString(val) {
    let str = val.trim();
    str = str.replace(/^(rp|idr|usd|sgd)\.?\s*/i, '');
    str = str.replace(/[^\d.,-]/g, '');
    if (!str) return '0';
    return str;
}

function parseStringWithMultipliers(val) {
    if (val === '' || val === undefined || val === null) return 0;
    let str = String(val).trim().toLowerCase();
    str = str.replace(/^(rp|idr|usd|sgd)\.?\s*/i, '');
    str = str.replace(/terjual/g, '').trim();
    
    let multiplier = 1;
    if (str.includes('ribu') || str.includes('rb') || str.includes('k')) {
        multiplier = 1000;
        str = str.replace(/ribu|rb|\+/g, '').replace(/k/g, '').trim();
    } else if (str.includes('juta') || str.includes('jt')) {
        multiplier = 1000000;
        str = str.replace(/juta|jt|\+/g, '').trim();
    } else {
        str = str.replace(/\+/g, '').trim();
    }
    
    if (multiplier > 1) {
        str = cleanNumberString(str);
    } else {
        str = cleanNumberString(str);
    }
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed * multiplier;
}

function parseCsvSold(val) {
    if (val === '' || val === undefined || val === null) return undefined;
    const sold = Math.round(parseStringWithMultipliers(val));
    return sold >= 0 ? sold : undefined;
}

const fileContent = fs.readFileSync('test program/LinkProdukSekaligus20260521193146-b9ffa90b0d64446a98da889bd4b75c8c.csv', 'utf-8');
const result = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true
});

const fieldMap = {
    title: 'title',
    description: 'description',
    price: 'price',
    originalPrice: 'originalPrice',
    image: 'image',
    images: 'images',
    shopeeUrl: 'shopeeUrl',
    shopeeRating: 'shopeeRating',
    shopeeSold: 'shopeeSold',
    category: 'category',
    badge: 'badge',
    isActive: 'isActive',
    // Indonesian
    judul: 'title',
    nama: 'title',
    deskripsi: 'description',
    harga: 'price',
    terjual: 'shopeeSold',
    kategori: 'category',
    // Shopee mass affiliate CSV
    'nama produk': 'title',
    'penjualan': 'shopeeSold',
    'link komisi ekstra': 'shopeeUrl',
};

const normalizedData = result.data.map((row) => {
    const normalized = {};
    for (const [key, value] of Object.entries(row)) {
        const cleanKey = key.trim();
        const mappedKey = fieldMap[cleanKey] || fieldMap[cleanKey.toLowerCase()] || cleanKey;
        normalized[mappedKey] = value;
    }
    return normalized;
});

console.log('FIRST ROW NORMALIZED:', normalizedData[0]);
console.log('THIRD ROW NORMALIZED:', normalizedData[2]); // Basreng or Angola with "10RB+"

// Test evaluation like in route.ts
const rawProduct = normalizedData[2];
const shopeeSoldVal = rawProduct.shopeeSold || rawProduct.penjualan;
const shopeeSoldParsed = parseCsvSold(shopeeSoldVal);
const shopeeSoldStr = rawProduct.shopeeSoldStr ? String(rawProduct.shopeeSoldStr).trim() : (rawProduct.shopeeSold ? String(rawProduct.shopeeSold).trim() : (rawProduct.penjualan ? String(rawProduct.penjualan).trim() : ''));

console.log('EVALUATION RESULTS FOR THIRD ROW:');
console.log('rawProduct.shopeeSold:', rawProduct.shopeeSold);
console.log('shopeeSoldVal:', shopeeSoldVal);
console.log('shopeeSoldParsed:', shopeeSoldParsed);
console.log('shopeeSoldStr:', shopeeSoldStr);
