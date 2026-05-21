const fs = require('fs');

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
                return contentMatch[1];
            }
        }
    }
    return null;
}

async function run() {
  const url = 'https://s.shopee.co.id/5q5BHF9n24';
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

  const html = await response.text();
  const alWebUrl = getMetaContent(html, 'al:web:url');
  console.log('alWebUrl:', alWebUrl);
  
  if (alWebUrl) {
    const realResponse = await fetch(alWebUrl, {
        headers: {
            'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_codedoc.html)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        },
        redirect: 'follow'
    });
    
    console.log('Real Response status:', realResponse.status);
    console.log('Real Response OK:', realResponse.ok);
    console.log('Real Response URL:', realResponse.url);
    const realHtml = await realResponse.text();
    console.log('Real HTML length:', realHtml.length);
    fs.writeFileSync('scratch/parfum-real.html', realHtml, 'utf8');
    
    const title = getMetaContent(realHtml, 'og:title');
    console.log('Title:', title);
  }
}

run();
