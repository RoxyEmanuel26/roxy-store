import { AnalyticsRepository } from '@/repositories/analytics.repository'
import { captureError } from '@/lib/sentry-helpers'

const VALID_EVENTS = ['view', 'shopee_click'] as const

export class AnalyticsService {
    private analyticsRepository: AnalyticsRepository

    constructor() {
        this.analyticsRepository = new AnalyticsRepository()
    }

    isValidEvent(eventType: string): boolean {
        return (VALID_EVENTS as readonly string[]).includes(eventType)
    }

    async trackEvent(eventType: string, productId?: string, userAgent?: string | null) {
        try {
            await this.analyticsRepository.createEvent({ eventType, productId, userAgent })

            if (eventType === 'shopee_click' && productId) {
                await this.analyticsRepository.incrementShopeeClicks(productId)
            }
        } catch (err) {
            console.error('Analytics tracking error:', err)
            captureError(err, { endpoint: '/api/analytics/track', bgTask: true })
        }
    }

    async getDashboardSummary() {
        const { totalProducts, totalCategories, topProducts, todayEvents, latestProducts } =
            await this.analyticsRepository.getDashboardStats()

        const todayStats: Record<string, number> = {
            view: 0,
            shopee_click: 0,
        }
        for (const event of todayEvents) {
            todayStats[event.eventType] = event._count
        }

        return { totalProducts, totalCategories, topProducts, todayStats, latestProducts }
    }
}

export const analyticsService = new AnalyticsService()
