import { prisma } from './prisma'
import { SiteSettingsType } from '@/types'

export async function getSiteSettings(): Promise<SiteSettingsType> {
    const settings = await prisma.siteSettings.findMany()

    const defaults: SiteSettingsType = {
        tagline: 'Rekomendasi Produk Terbaik & Terlaris',
        logo_url: '',
        hero_title: 'Temukan Produk Terlaris dengan Harga Terbaik',
        hero_subtitle: 'Temukan produk favoritmu',
        hero_image: '',
        about_text: 'Roxy Store adalah website rekomendasi produk terlaris.',
        wa_number: '6281234567890',
    }

    return settings.reduce((acc, s) => {
        acc[s.key as keyof SiteSettingsType] = s.value
        return acc
    }, defaults)
}
