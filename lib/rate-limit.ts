import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const isUpstashConfigured =
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN

// --- Dev fallback rate limiter using in-memory Map ---
export const createDevRateLimit = () => {
    const attempts = new Map<string, { count: number; resetAt: number }>()

    return {
        async limit(identifier: string) {
            const now = Date.now()
            const entry = attempts.get(identifier)

            if (!entry || now > entry.resetAt) {
                attempts.set(identifier, { count: 1, resetAt: now + 60000 })
                return { success: true, remaining: 4 }
            }

            if (entry.count >= 5) {
                return { success: false, remaining: 0 }
            }

            entry.count++
            return { success: true, remaining: 5 - entry.count }
        },
    }
}

// --- Production rate limiters (Upstash Redis) ---
function createUpstashLimiter(
    prefix: string,
    requests: number,
    window: `${number} ${'s' | 'm' | 'h' | 'd'}`
) {
    if (!isUpstashConfigured) return null
    return new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(requests, window),
        analytics: true,
        prefix: `Roxy-lay:${prefix}`,
    })
}

// Rate limiter untuk endpoint login — 5 percobaan/menit/IP
const _loginRateLimit = createUpstashLimiter('login', 5, '1 m')
// Rate limiter untuk upload file — 10 upload/menit/IP
const _uploadRateLimit = createUpstashLimiter('upload', 10, '1 m')
// Rate limiter untuk API publik — 60 request/menit/IP
const _apiRateLimit = createUpstashLimiter('api', 60, '1 m')

const devLimiter = createDevRateLimit()

// Export with dev fallback
export const loginRateLimit = _loginRateLimit || devLimiter
export const uploadRateLimit = _uploadRateLimit || devLimiter
export const apiRateLimit = _apiRateLimit || devLimiter
