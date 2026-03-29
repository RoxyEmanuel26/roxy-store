import type { NextConfig } from 'next'
import withPWAInit from 'next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: { maxEntries: 10, maxAgeSeconds: 31536000 },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        cacheableResponse: { statuses: [0, 200] },
        expiration: { maxEntries: 30, maxAgeSeconds: 31536000 },
      },
    },
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'cloudinary-images',
        cacheableResponse: { statuses: [0, 200] },
        expiration: { maxEntries: 100, maxAgeSeconds: 2592000 },
      },
    },
    {
      urlPattern: /^https?.+\/api\/(?!auth|admin|upload).*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-responses',
        expiration: { maxEntries: 50, maxAgeSeconds: 300 },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\.(?:png|gif|jpg|jpeg|webp|svg)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-images',
        expiration: { maxEntries: 100, maxAgeSeconds: 2592000 },
      },
    },
    {
      urlPattern: /\/_next\/image\?url/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image-cache',
        expiration: { maxEntries: 100, maxAgeSeconds: 2592000 },
      },
    },
    {
      urlPattern: ({ request }: any) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
        networkTimeoutSeconds: 5,
        precacheFallback: {
          fallbackURL: '/offline',
        },
      },
    },
  ],
})

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' https: data: blob:",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://www.clarity.ms https://vitals.vercel-insights.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  turbopack: {},

  // Production optimizations
  compress: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/icons/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/fonts/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

import withBundleAnalyzerInit from '@next/bundle-analyzer'

const withBundleAnalyzer = withBundleAnalyzerInit({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(withPWA(nextConfig))
