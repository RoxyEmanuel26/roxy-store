// E2E Test: Call the actual /api/admin/products/import endpoint
// with data from the Shopee CSV

const fs = require('fs')
const path = require('path')

const BASE_URL = 'http://localhost:3000'

// Read and parse CSV
function parseCsv(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''))
    
    const fieldMap: Record<string, string> = {
        'id produk': '_ignore',
        'nama produk': 'title',
        'harga': 'price',
        'penjualan': 'shopeeSold',
        'nama toko': '_ignore',
        'komisi hingga': '_ignore',
        'komisi': '_ignore',
        'link produk': '_ignore',
        'link komisi ekstra': 'shopeeUrl',
    }
    
    const rows = []
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue
        
        const values: string[] = []
        let current = ''
        let inQuotes = false
        for (const char of lines[i]) {
            if (char === '"') {
                inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim())
                current = ''
            } else {
                current += char
            }
        }
        values.push(current.trim())
        
        const row: Record<string, string> = {}
        headers.forEach((h: string, idx: number) => {
            const key = fieldMap[h.toLowerCase()]
            if (key && key !== '_ignore') {
                row[key] = values[idx] || ''
            }
        })
        rows.push(row)
    }
    return rows
}

async function testSingleLink() {
    console.log('========================================')
    console.log('TEST: Single Link Add via API')
    console.log('========================================')
    
    // Simulate what LinkImportDialog does: scrape and create product
    const shopeeUrl = 'https://s.shopee.co.id/1BJLxhR2uv'
    
    const res = await fetch(`${BASE_URL}/api/admin/products/scrape-shopee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: shopeeUrl })
    })
    
    if (res.ok) {
        const data = await res.json()
        console.log('Scrape result:')
        console.log('  Title:', data.title)
        console.log('  Description:', data.description?.substring(0, 100))
        console.log('  Images:', data.images?.length)
        console.log('  Category:', data.category)
        console.log('  Image URL:', data.imageUrl?.substring(0, 80))
    } else {
        console.log('Scrape failed:', res.status, await res.text())
    }
}

async function testCsvImport() {
    console.log('\n========================================')
    console.log('TEST: CSV Import (first 3 rows)')
    console.log('========================================')
    
    const csvPath = path.join(__dirname, '..', 'test program', 'LinkProdukSekaligus20260521193146-b9ffa90b0d64446a98da889bd4b75c8c.csv')
    const rows = parseCsv(csvPath)
    
    console.log(`Total rows: ${rows.length}`)
    console.log('First 3 rows:')
    rows.slice(0, 3).forEach((row, i) => {
        console.log(`  [${i}] title="${row.title?.substring(0, 50)}" price="${row.price}" sold="${row.shopeeSold}" url="${row.shopeeUrl?.substring(0, 40)}"`)
    })
    
    // Only send first 3 rows to test
    const testRows = rows.slice(0, 3)
    
    const res = await fetch(`${BASE_URL}/api/admin/products/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: testRows })
    })
    
    if (res.ok) {
        const result = await res.json()
        console.log('\nImport result:')
        console.log('  Summary:', JSON.stringify(result.summary))
        result.results?.forEach((r: any) => {
            console.log(`  Row ${r.row}: ${r.status} - "${r.title?.substring(0, 50)}"`)
            if (r.error) console.log(`    Error: ${r.error}`)
        })
    } else {
        console.log('Import failed:', res.status, await res.text())
    }
}

async function main() {
    // Wait for server
    console.log('Checking server...')
    for (let i = 0; i < 10; i++) {
        try {
            const r = await fetch(BASE_URL)
            if (r.ok || r.status === 200) {
                console.log('Server is up!')
                break
            }
        } catch {
            console.log(`Waiting... (${i + 1}/10)`)
            await new Promise(r => setTimeout(r, 2000))
        }
    }
    
    try {
        await testSingleLink()
    } catch (err: any) {
        console.error('Single link test error:', err.message)
    }
    
    try {
        await testCsvImport()
    } catch (err: any) {
        console.error('CSV import test error:', err.message)
    }
}

main()
