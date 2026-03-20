export function validateOrigin(request: Request): boolean {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')

    const allowedOrigins = [
        process.env.NEXTAUTH_URL,
        'http://localhost:3000',
        'http://localhost:3001',
    ].filter(Boolean) as string[]

    if (origin) {
        return allowedOrigins.some(
            (allowed) => origin === allowed || origin.startsWith(allowed)
        )
    }

    if (referer) {
        return allowedOrigins.some((allowed) => referer.startsWith(allowed))
    }

    // If no origin/referer (e.g., server-to-server call), allow
    return true
}
