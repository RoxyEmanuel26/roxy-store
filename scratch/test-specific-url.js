const fs = require('fs');

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

function extractCategoryFromHtml(html) {
    const ldJsons = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const tag of ldJsons) {
        try {
            const cleanJson = tag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
            const obj = JSON.parse(cleanJson);
            if (obj['@type'] === 'BreadcrumbList' && obj.itemListElement && Array.isArray(obj.itemListElement)) {
                const secondItem = obj.itemListElement.find(el => el.position === 2) || obj.itemListElement[1];
                if (secondItem) {
                    if (secondItem.item && secondItem.item.name) {
                        return secondItem.item.name.trim();
                    } else if (secondItem.name) {
                        return secondItem.name.trim();
                    }
                }
            }
        } catch (e) {
            // ignore
        }
    }
    return '';
}

async function test() {
    // Standardize URL to: https://shopee.co.id/product/{shopId}/{itemId}
    // Mobile bridge page has al:web:url as:
    // https://shopee.co.id/opaanlp/489143675/43858959756?__mobile__=1&...
    const alWebUrl = 'https://shopee.co.id/opaanlp/489143675/43858959756?__mobile__=1&exp_group=rollout';
    
    // Parse shopId and itemId
    // Pattern: shopee.co.id/[^/]+/(\d+)/(\d+)
    const match = alWebUrl.match(/shopee\.co\.id\/[^/]+\/(\d+)\/(\d+)/);
    if (!match) {
        console.log('Regex did not match.');
        return;
    }
    const shopId = match[1];
    const itemId = match[2];
    const desktopUrl = `https://shopee.co.id/product/${shopId}/${itemId}`;
    console.log('Converted to desktop URL:', desktopUrl);
    
    try {
        const response = await fetch(desktopUrl, {
            headers: {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_codedoc.html)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            redirect: 'follow'
        });
        
        console.log('Response Status:', response.status);
        console.log('Response URL:', response.url);
        const html = await response.text();
        console.log('HTML Length:', html.length);
        
        const title = getMetaContent(html, 'og:title');
        const category = extractCategoryFromHtml(html);
        console.log('Title:', title);
        console.log('Category:', category);
        
        fs.writeFileSync('scratch/test-specific-result.html', html, 'utf8');
    } catch (e) {
        console.error(e);
    }
}

test();
