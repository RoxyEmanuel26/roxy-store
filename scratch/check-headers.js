const https = require('https');

https.get('https://www.roxystore.web.id/', (res) => {
    console.log('Headers:', res.headers);
});
