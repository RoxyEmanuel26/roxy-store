import { scrapeShopeeProduct } from '../lib/shopee-scraper'

async function run() {
  const url = 'https://s.shopee.co.id/1BJLxhR2uv'
  console.log('Scraping URL:', url)
  try {
    const result = await scrapeShopeeProduct(url)
    console.log('Scrape Result:', result)
  } catch (error) {
    console.error('Scrape Error:', error)
  }
}

run()
