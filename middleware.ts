import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
    loginRateLimit,
    uploadRateLimit,
    apiRateLimit,
} from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1'

    // Rate limit: login (5 req/min)
    if (pathname === '/api/auth/signin' || pathname === '/api/auth/callback/credentials') {
        const { success } = await loginRateLimit.limit(ip)
        if (!success) {
            return NextResponse.json(
                { error: 'Terlalu banyak percobaan. Tunggu 1 menit.', code: 'RATE_LIMITED' },
                { status: 429 }
            )
        }
    }

    // Rate limit: upload (10 req/min)
    if (pathname.startsWith('/api/upload')) {
        const { success } = await uploadRateLimit.limit(ip)
        if (!success) {
            return NextResponse.json(
                { error: 'Terlalu banyak upload. Tunggu sebentar.' },
                { status: 429 }
            )
        }
    }

    // Rate limit: analytics (60 req/min)
    if (pathname.startsWith('/api/analytics')) {
        const { success } = await apiRateLimit.limit(ip)
        if (!success) {
            return new NextResponse(null, { status: 429 })
        }
    }

    // Protect admin routes (except login page)
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        try {
            const { auth } = await import('@/lib/auth')
            const session = await auth()

            if (!session) {
                const loginUrl = new URL('/admin/login', request.url)
                loginUrl.searchParams.set('callbackUrl', pathname)
                return NextResponse.redirect(loginUrl)
            }

            if ((session.user as any)?.role !== 'admin') {
                return NextResponse.redirect(new URL('/', request.url))
            }
        } catch {
            const loginUrl = new URL('/admin/login', request.url)
            loginUrl.searchParams.set('callbackUrl', pathname)
            return NextResponse.redirect(loginUrl)
        }
    }

    // Redirect logged-in users away from login page
    if (pathname === '/admin/login') {
        try {
            const { auth } = await import('@/lib/auth')
            const session = await auth()
            if (session) {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url))
            }
        } catch { /* allow access */ }
    }

    // Protect /api/admin/* endpoints
    if (pathname.startsWith('/api/admin')) {
        try {
            const { auth } = await import('@/lib/auth')
            const session = await auth()
            if (!session) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
