const fs = require('fs');
const html = fs.readFileSync('scratch/zyha-desktop.html', 'utf8');

const scriptTags = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
console.log(`Found ${scriptTags.length} script tags.`);

for (let i = 0; i < scriptTags.length; i++) {
    const content = scriptTags[i];
    if (content.includes('Hanna') || content.includes('description') || content.includes('rating') || content.includes('sold')) {
        console.log(`\nScript #${i + 1} (length: ${content.length}):`);
        console.log(content.slice(0, 500) + '...');
    }
}
