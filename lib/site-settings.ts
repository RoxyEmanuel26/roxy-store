import { prisma } from './prisma'
import { SiteSettingsType } from '@/types'
import { unstable_cache } from 'next/cache'

export const getSiteSettings = unstable_cache(
    async (): Promise<SiteSettingsType> => {
        const settings = await prisma.siteSettings.findMany()

        const defaults: SiteSettingsType = {
            tagline: 'Rekomendasi Produk Terbaik & Terlaris',
            logo_url: '',
            hero_title: 'Temukan Produk Terlaris dengan Harga Terbaik',
            hero_subtitle: 'Temukan produk favoritmu',
            hero_image: '',
            about_text: 'Roxy Store adalah website rekomendasi produk terlaris.',
            wa_number: '6281234567890',
            home_banners: [],
        }

        return settings.reduce((acc, s) => {
            if (s.key === 'home_banners') {
                try {
                    const parsed = JSON.parse(s.value)
                    acc.home_banners = (parsed || []).map((b: any) => {
                        if (typeof b === 'string') {
                            return { url: b, link: null }
                        }
                        return { url: b.url || '', link: b.link || null }
                    })
                } catch {
                    acc.home_banners = []
                }
            } else {
                acc[s.key as keyof SiteSettingsType] = s.value as any
            }
            return acc
        }, defaults)
    },
    ['site-settings-data'],
    { revalidate: 3600, tags: ['settings'] }
)
