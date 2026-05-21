const { z } = require('zod');

// Schema from validations.ts
const CsvProductSchema = z.object({
    title: z.string().min(3).max(200).trim(),
    description: z.string().default(''),
    price: z.number().min(0).default(0),
    originalPrice: z.number().min(0).optional(),
    image: z.string().or(z.literal('')).default(''),
    images: z.string().default(''),
    shopeeUrl: z.string().or(z.literal('')).default(''),
    shopeeRating: z.number().min(0).max(5).optional(),
    shopeeSold: z.number().min(0).optional(),
    shopeeRatingCountStr: z.string().optional().default(''),
    shopeeSoldStr: z.string().optional().default(''),
    category: z.string().default('Other'),
    badge: z.string().default(''),
    isActive: z.boolean().default(true),
});

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
    
    let multiplier = 1;
    if (str.includes('ribu') || str.endsWith('rb') || str.endsWith('k')) {
        multiplier = 1000;
        str = str.replace(/ribu|rb|\+/g, '').replace(/k/g, '').trim();
    } else if (str.includes('juta') || str.endsWith('jt')) {
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

function parseCsvFloat(val) {
    if (val === '' || val === undefined || val === null) return undefined;
    const cleaned = cleanNumberString(String(val));
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? undefined : parsed;
}

// Mock rawProduct from CSV for Angola product
const rawProduct = {
  title: 'ANGOLA Lemari Pakaian Anak 4 5 Tingkat C70-C71 Tempat Penyimpanan Mainan/Snack/Baju Serbaguna',
  price: '379,0RB',
  shopeeSold: '10RB+',
  shopeeUrl: 'https://s.shopee.co.id/8fPMtcbsvD'
};

const inputObj = {
    ...rawProduct,
    price: parseStringWithMultipliers(rawProduct.price),
    shopeeRating: parseCsvFloat(rawProduct.shopeeRating),
    shopeeSold: parseCsvSold(rawProduct.shopeeSold || rawProduct.penjualan),
    shopeeRatingCountStr: rawProduct.shopeeRatingCountStr ? String(rawProduct.shopeeRatingCountStr).trim() : '',
    shopeeSoldStr: rawProduct.shopeeSoldStr ? String(rawProduct.shopeeSoldStr).trim() : (rawProduct.shopeeSold ? String(rawProduct.shopeeSold).trim() : (rawProduct.penjualan ? String(rawProduct.penjualan).trim() : '')),
    description: rawProduct.description || '',
    image: rawProduct.image || '',
    images: rawProduct.images || '',
    shopeeUrl: rawProduct.shopeeUrl || '',
    category: rawProduct.category || 'Other',
    badge: rawProduct.badge || '',
};

console.log('INPUT TO SAFE_PARSE:', inputObj);

const parsed = CsvProductSchema.safeParse(inputObj);
if (!parsed.success) {
    console.error('PARSE FAILED:', parsed.error);
} else {
    console.log('PARSED DATA:', parsed.data);
}
