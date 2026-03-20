import { Suspense } from 'react'
import { Header } from '@/components/public/Header'
import { Footer } from '@/components/public/Footer'
import { FloatingWhatsApp } from '@/components/public/FloatingWhatsApp'
import { PageTransition } from '@/components/animations/PageTransition'
import { InstallPWA } from '@/components/public/InstallPWA'
import { getSiteSettings } from '@/lib/site-settings'
import { PageViewTracker } from '@/components/analytics/PageViewTracker'

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const settings = await getSiteSettings()

    return (
        <div className="min-h-screen flex flex-col bg-brand-bg dark:bg-dark-bg">
            <Suspense fallback={null}>
                <PageViewTracker />
            </Suspense>
            <Header settings={settings} />
            <main className="flex-1">
                <PageTransition>{children}</PageTransition>
            </main>
            <Footer settings={settings} />
            <FloatingWhatsApp waNumber={settings.wa_number} />
            <InstallPWA />
        </div>
    )
}
