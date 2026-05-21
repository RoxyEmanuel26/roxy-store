const fs = require('fs');

async function testScrape() {
    const url = 'https://s.shopee.co.id/1BJLxhR2uv';
    console.log('Fetching Shopee URL:', url);
    
    try {
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

        console.log('Response Status:', response.status);
        console.log('Response OK:', response.ok);
        console.log('Final URL after redirect:', response.url);

        const html = await response.text();
        fs.writeFileSync('scratch/response-shopee.html', html, 'utf8');
        console.log('Saved response to scratch/response-shopee.html (length:', html.length, ')');

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

        const rawTitle = getMetaContent(html, 'og:title') || getMetaContent(html, 'twitter:title') || '';
        const title = cleanShopeeTitle(rawTitle);
        const description = getMetaContent(html, 'og:description') || getMetaContent(html, 'description') || '';
        const rawImageUrl = getMetaContent(html, 'og:square_image') || getMetaContent(html, 'og:image') || '';

        console.log('\n--- Extracted Data ---');
        console.log('Title:', title);
        console.log('Description:', description.slice(0, 150) + '...');
        console.log('Raw Image URL:', rawImageUrl);

    } catch (error) {
        console.error('Error occurred:', error);
    }
}

testScrape();
