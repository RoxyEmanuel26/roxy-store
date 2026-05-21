async function test() {
    const shopid = '1735322618';
    const itemid = '53158294918';
    const url = `https://shopee.co.id/api/v4/item/get?itemid=${itemid}&shopid=${shopid}`;
    
    console.log('Fetching:', url);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_codedoc.html)',
                'Accept': 'application/json',
                'Accept-Language': 'id-ID,id;q=0.9'
            }
        });
        
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response Length:', text.length);
        console.log('Response:', text.slice(0, 1000));
    } catch (e) {
        console.error(e);
    }
}

test();
