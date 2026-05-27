import { Redis } from '@upstash/redis'
import { prisma } from '@/lib/prisma'
import { getWibToday } from '@/lib/date'

const isUpstashConfigured =
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN

// Direct instance of Upstash Redis from Environment Variables
const redis = isUpstashConfigured ? Redis.fromEnv() : null

export interface BufferedEvent {
    eventType: string
    productId?: string | null
    userAgent?: string | null
    createdAt: string
}

/**
 * Buffers a product page view count in Upstash Redis.
 * Falls back to direct SQL write if Redis is not configured.
 */
export async function bufferProductView(productId: string) {
    if (!redis) {
        // Safe fallback to direct Postgres write
        await prisma.product.update({
            where: { id: productId },
            data: { viewCount: { increment: 1 } },
        })
        return false
    }

    try {
        // Increment product views hash map
        await redis.hincrby('roxy:product:views', productId, 1)

        // Queue individual event for detailed Analytics log
        const event: BufferedEvent = {
            eventType: 'view',
            productId,
            userAgent: 'Server-Buffered',
            createdAt: new Date().toISOString(),
        }
        await redis.rpush('roxy:analytics:queue', JSON.stringify(event))
        return true
    } catch (error) {
        console.error('Failed to buffer product view, writing to DB directly:', error)
        // Fallback on error
        await prisma.product.update({
            where: { id: productId },
            data: { viewCount: { increment: 1 } },
        })
        return false
    }
}

/**
 * Buffers a Shopee click aggregate counter in Upstash Redis.
 * The analytics event itself is already written to Postgres by the track API route.
 * This only buffers the product.shopeeClicks increment for batch processing.
 * Falls back to direct SQL write if Redis is not configured.
 */
export async function bufferShopeeClick(productId: string, userAgent?: string | null) {
    if (!redis) {
        // No Redis: increment product counter directly in Postgres
        await prisma.product.update({
            where: { id: productId },
            data: { shopeeClicks: { increment: 1 } },
        })
        return false
    }

    try {
        // Only buffer the aggregate counter — the analytics event
        // is already written to Postgres by analyticsService.trackEvent()
        await redis.hincrby('roxy:product:clicks', productId, 1)
        return true
    } catch (error) {
        console.error('Failed to buffer shopee click counter:', error)
        // Fallback: increment directly in Postgres
        await prisma.product.update({
            where: { id: productId },
            data: { shopeeClicks: { increment: 1 } },
        })
        return false
    }
}

/**
 * Buffers a WhatsApp click event.
 * The analytics event itself is already written to Postgres by the track API route.
 * WA clicks don't have an aggregate counter on the product model,
 * so this function is now a no-op when Redis is configured.
 * Kept for API compatibility.
 */
export async function bufferWaClick(productId?: string | null, userAgent?: string | null) {
    // WA clicks don't have an aggregate counter on the product model.
    // The analytics event is already written by analyticsService.trackEvent(),
    // so there's nothing extra to buffer here.
    return true
}

/**
 * Atomically pulls and flushes all buffered clicks, views, and analytics events
 * from Upstash Redis to PostgreSQL.
 */
export async function syncBufferedAnalytics() {
    if (!redis) {
        return { eventsSynced: 0, productsUpdated: 0, message: 'Redis not configured' }
    }

    let eventsSynced = 0
    let productsUpdated = 0
    const nowTimestamp = Date.now()

    try {
        // 1. ATOMIC QUEUE SYNC: Rename the queue to a temporary sync key to prevent race conditions with new writes
        const queueExists = await redis.exists('roxy:analytics:queue')
        if (queueExists) {
            const syncQueueKey = `roxy:analytics:queue:sync:${nowTimestamp}`
            await redis.rename('roxy:analytics:queue', syncQueueKey)

            const rawEvents = await redis.lrange(syncQueueKey, 0, -1)
            if (rawEvents && rawEvents.length > 0) {
                const events: BufferedEvent[] = rawEvents.map(e => JSON.parse(e as string))
                
                // Bulk insert individual events into PostgreSQL
                const insertData = events.map(e => ({
                    eventType: e.eventType,
                    productId: e.productId || null,
                    userAgent: e.userAgent || null,
                    createdAt: new Date(e.createdAt),
                }))

                const result = await prisma.analytics.createMany({
                    data: insertData,
                    skipDuplicates: true,
                })
                eventsSynced = result.count
            }

            // Cleanup sync queue key
            await redis.del(syncQueueKey)
        }

        // 2. ATOMIC VIEWS SYNC: Rename the views hash
        const viewsExists = await redis.exists('roxy:product:views')
        if (viewsExists) {
            const syncViewsKey = `roxy:product:views:sync:${nowTimestamp}`
            await redis.rename('roxy:product:views', syncViewsKey)

            const viewsMap = await redis.hgetall(syncViewsKey)
            if (viewsMap) {
                for (const [productId, countStr] of Object.entries(viewsMap)) {
                    const count = parseInt(countStr as string, 10)
                    if (count > 0) {
                        await prisma.product.update({
                            where: { id: productId },
                            data: { viewCount: { increment: count } },
                        })
                        productsUpdated++
                    }
                }
            }

            // Cleanup sync views key
            await redis.del(syncViewsKey)
        }

        // 3. ATOMIC CLICKS SYNC: Rename the clicks hash
        const clicksExists = await redis.exists('roxy:product:clicks')
        if (clicksExists) {
            const syncClicksKey = `roxy:product:clicks:sync:${nowTimestamp}`
            await redis.rename('roxy:product:clicks', syncClicksKey)

            const clicksMap = await redis.hgetall(syncClicksKey)
            if (clicksMap) {
                for (const [productId, countStr] of Object.entries(clicksMap)) {
                    const count = parseInt(countStr as string, 10)
                    if (count > 0) {
                        await prisma.product.update({
                            where: { id: productId },
                            data: { shopeeClicks: { increment: count } },
                        })
                        productsUpdated++
                    }
                }
            }

            // Cleanup sync clicks key
            await redis.del(syncClicksKey)
        }

        return {
            eventsSynced,
            productsUpdated,
            message: 'Sync completed successfully'
        }
    } catch (error) {
        console.error('Failed to sync buffered analytics from Redis:', error)
        throw error
    }
}
