const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const envLocalPath = path.join(__dirname, '../.env.local');

console.log('__dirname:', __dirname);
console.log('.env exists:', fs.existsSync(envPath));
console.log('.env.local exists:', fs.existsSync(envLocalPath));

if (fs.existsSync(envLocalPath)) {
    const lines = fs.readFileSync(envLocalPath, 'utf8').split('\n');
    console.log(`Read ${lines.length} lines from .env.local`);
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const eq = trimmed.indexOf('=');
            if (eq !== -1) {
                console.log(`Line ${index + 1}: Key = "${trimmed.slice(0, eq).trim()}"`);
            } else {
                console.log(`Line ${index + 1}: No equals sign: "${trimmed}"`);
            }
        }
    });
}
