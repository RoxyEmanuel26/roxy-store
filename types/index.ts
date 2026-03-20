export type BadgeType = 'NEW' | 'HOT' | 'BEST SELLER' | null

export interface ProductType {
    id: string
    title: string
    slug: string
    description: string
    price: number
    image: string
    images: string[]
    shopeeUrl: string
    tokopediaUrl: string
    categoryId: string
    category: CategoryType
    badge: BadgeType
    isActive: boolean
    viewCount: number
    shopeeClicks: number
    tokopediaClicks: number
    createdAt: Date
    updatedAt: Date
}

export interface CategoryType {
    id: string
    name: string
    slug: string
    _count?: { products: number }
    createdAt: Date
    updatedAt: Date
}

export interface SiteSettingsType {
    tagline: string
    logo_url: string
    hero_title: string
    hero_subtitle: string
    hero_image: string
    about_text: string
    wa_number: string
}

export interface AnalyticsEvent {
    eventType: 'view' | 'shopee_click' | 'tokopedia_click' | 'wa_click'
    productId?: string
}
