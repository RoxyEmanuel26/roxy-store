const fs = require('fs');

const html = fs.readFileSync('scratch/desktop-shopee.html', 'utf8');

console.log('HTML length:', html.length);

// Search for any script tags containing "description" or "detailed" or product info
const scriptTags = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
console.log('Total script tags:', scriptTags.length);

scriptTags.forEach((script, idx) => {
    if (script.includes('detail') || script.includes('description') || script.includes('spesifikasi') || script.includes('stainless')) {
        console.log(`\nScript #${idx} (length: ${script.length}):`);
        console.log(script.substring(0, 1000));
    }
});

// Let's check if there is an window.__PRELOADED_STATE__ or similar state object
const preloadedMatches = html.match(/window\.__PRELOADED_STATE__\s*=\s*([\s\S]*?);/);
if (preloadedMatches) {
    console.log('Found preloaded state!');
    console.log(preloadedMatches[1].substring(0, 2000));
} else {
    console.log('No window.__PRELOADED_STATE__ found.');
}
