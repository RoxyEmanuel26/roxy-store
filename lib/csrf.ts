export function validateOrigin(request: Request): boolean {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')

    const allowedOrigins = [
        process.env.NEXTAUTH_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'https://roxy-store-affi.vercel.app',
        'https://www.roxystore.web.id',
        'https://roxystore.web.id',
    ].filter(Boolean) as string[]

    if (origin) {
        return allowedOrigins.some(
            (allowed) => origin === allowed
        )
    }

    if (referer) {
        try {
            const refererUrl = new URL(referer)
            return allowedOrigins.some((allowed) => refererUrl.origin === allowed)
        } catch {
            return false
        }
    }

    // [SECURITY FIX] JANGAN izinkan jika tidak ada origin/referer di production
    if (process.env.NODE_ENV === 'production') {
        return false // Blokir di production
    }

    // Izinkan di development (untuk testing dengan Postman/curl)
    return true
}
