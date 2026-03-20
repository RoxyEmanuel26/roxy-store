import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

import { DEFAULT_DESCRIPTION, BASE_URL } from '@/lib/metadata'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FF6B9D' },
    { media: '(prefers-color-scheme: dark)', color: '#1C0D18' },
  ],
}

export const metadata: Metadata = {
  title: {
    default: 'Roxy Lay - Aksesori Wanita Colorful',
    template: '%s - Roxy Lay',
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(BASE_URL),
  keywords: [
    'aksesori wanita',
    'gantungan kunci',
    'beads bracelet',
    'beads hp',
    'aksesori handmade',
    'aksesori colorful',
    'Roxy lay',
    'toko aksesori online',
  ],
  authors: [{ name: 'Roxy Lay' }],
  creator: 'Roxy Lay',
  publisher: 'Roxy Lay',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { MicrosoftClarity } from '@/components/analytics/MicrosoftClarity'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={poppins.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://www.clarity.ms" crossOrigin="anonymous" />
      </head>
      <body className="font-sans bg-brand-bg dark:bg-dark-bg text-brand-text dark:text-dark-text antialiased">
        <GoogleAnalytics />
        <MicrosoftClarity />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              className: 'font-sans',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
