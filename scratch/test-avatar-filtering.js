const fs = require('fs');

const files = ['scratch/desktop-shopee.html', 'scratch/specific-shopee.html', 'scratch/zyha-desktop.html'];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    console.log(`\n=== File: ${file} ===`);
    
    // Find shop avatar or seller image
    // 1. Look for images with class containing OUM_RU or avatar-like classes
    const avatarMatches = [];
    const avatarRegex = /<img[^>]+(?:class=["'][^"']*(?:OUM_RU|avatar|shop-avatar|shopee-avatar)[^"']*["'])[^>]+src=["'](https:\/\/[a-z0-9-]+\.img\.susercontent\.com\/file\/[a-zA-Z0-9_-]+)["']/gi;
    let match;
    while ((match = avatarRegex.exec(html)) !== null) {
        avatarMatches.push(match[1]);
    }
    
    // 2. Also check if there's any other shop avatar structure
    const otherAvatarRegex = /src=["'](https:\/\/[a-z0-9-]+\.img\.susercontent\.com\/file\/[a-zA-Z0-9_-]+)["'][^>]+class=["'][^"']*(?:OUM_RU|avatar|shop-avatar|shopee-avatar)[^"']*["']/gi;
    while ((match = otherAvatarRegex.exec(html)) !== null) {
        avatarMatches.push(match[1]);
    }

    console.log('Identified shop avatars:', avatarMatches);

    // List all unique susercontent images
    const imgRegex = /https:\/\/[a-z0-9-]+\.img\.susercontent\.com\/file\/([a-zA-Z0-9_-]+)/g;
    const allMatches = html.match(imgRegex) || [];
    const uniqueBases = [...new Set(allMatches)];
    
    // Filter out shop avatars
    const filtered = uniqueBases.filter(img => {
        // Exclude if it is in avatarMatches
        return !avatarMatches.some(avatar => img.includes(avatar));
    });

    console.log(`Original count: ${uniqueBases.length}, Filtered count: ${filtered.length}`);
    console.log('Filtered Sample:', filtered.slice(0, 5));
}
