/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: (process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'https://www.roxystore.web.id').startsWith('http') 
        ? (process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'https://www.roxystore.web.id') 
        : `https://${process.env.NEXTAUTH_URL || process.env.VERCEL_URL}`,
    generateRobotsTxt: true,
    changefreq: 'weekly',
    priority: 0.7,
    sitemapSize: 5000,
    exclude: ['/admin', '/admin/*', '/api/*', '/offline'],
    additionalPaths: async () => {
        return [
            { loc: '/', changefreq: 'daily', priority: 1.0 },
            { loc: '/produk', changefreq: 'daily', priority: 0.9 },
            { loc: '/tentang', changefreq: 'monthly', priority: 0.5 },
            { loc: '/kontak', changefreq: 'monthly', priority: 0.4 },
            { loc: '/wishlist', changefreq: 'weekly', priority: 0.3 },
        ]
    },
    robotsTxtOptions: {
        policies: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin', '/api'],
            },
        ],
    },
    transform: async (config, path) => {
        if (path.startsWith('/produk/')) {
            return {
                loc: path,
                changefreq: 'weekly',
                priority: 0.8,
                lastmod: new Date().toISOString(),
            }
        }
        if (path.startsWith('/kategori/')) {
            return {
                loc: path,
                changefreq: 'weekly',
                priority: 0.7,
                lastmod: new Date().toISOString(),
            }
        }
        return {
            loc: path,
            changefreq: config.changefreq,
            priority: config.priority,
        }
    },
}
