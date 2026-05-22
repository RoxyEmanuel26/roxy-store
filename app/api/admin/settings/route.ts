import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SettingsSchema } from '@/lib/validations'
import { validateOrigin } from '@/lib/csrf'
import { parseAndValidate } from '@/lib/api-helpers'
import { sanitizeText, sanitizeDescription, sanitizeUrl } from '@/lib/sanitize'
import { revalidateTag } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.siteSettings.findMany()

    const settingsObj: Record<string, any> = {}
    for (const s of settings) {
        if (s.key === 'home_banners') {
            try {
                const parsed = JSON.parse(s.value)
                settingsObj[s.key] = (parsed || []).map((b: any) => {
                    if (typeof b === 'string') {
                        return { url: b, link: '' }
                    }
                    return { url: b.url || '', link: b.link || '' }
                })
            } catch {
                settingsObj[s.key] = []
            }
        } else {
            settingsObj[s.key] = s.value
        }
    }

    return NextResponse.json(settingsObj)
}

export async function PUT(request: NextRequest) {
    if (!validateOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = await parseAndValidate(SettingsSchema, body)

    if (!validation.success) {
        return validation.response
    }

    const data = validation.data

    // Sanitize home banners
    const sanitizedBanners = (data.home_banners || []).map((b: any) => {
        if (typeof b === 'string') {
            return {
                url: sanitizeUrl(b) || '',
                link: '',
            }
        }
        return {
            url: sanitizeUrl(b.url || '') || '',
            link: b.link ? sanitizeText(b.link) : '',
        }
    }).filter((b: any) => b.url !== '')

    // Sanitize data
    const sanitizedData = {
        tagline: sanitizeText(data.tagline || ''),
        logo_url: sanitizeUrl(data.logo_url || '') || '',
        hero_title: sanitizeText(data.hero_title || ''),
        hero_subtitle: sanitizeText(data.hero_subtitle || ''),
        hero_image: sanitizeUrl(data.hero_image || '') || '',
        about_text: sanitizeDescription(data.about_text || ''),
        wa_number: data.wa_number || '',
        home_banners: JSON.stringify(sanitizedBanners),
    }

    for (const [key, value] of Object.entries(sanitizedData)) {
        await prisma.siteSettings.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        })
    }

    const settings = await prisma.siteSettings.findMany()
    const settingsObj: Record<string, any> = {}
    for (const s of settings) {
        if (s.key === 'home_banners') {
            try {
                const parsed = JSON.parse(s.value)
                settingsObj[s.key] = (parsed || []).map((b: any) => {
                    if (typeof b === 'string') {
                        return { url: b, link: '' }
                    }
                    return { url: b.url || '', link: b.link || '' }
                })
            } catch {
                settingsObj[s.key] = []
            }
        } else {
            settingsObj[s.key] = s.value
        }
    }

    revalidateTag('settings', { expire: 0 })

    return NextResponse.json(settingsObj)
}
