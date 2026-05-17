import type { NextAuthConfig } from 'next-auth'

/**
 * Edge-compatible auth config (NO database/Prisma imports).
 * Used by middleware/proxy for session checks only.
 */
export const authConfig: NextAuthConfig = {
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    providers: [], // providers are added in the full auth.ts
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = (user as { role?: string }).role
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }
            return session
        },
    },
    pages: {
        signIn: '/admin/login',
        error: '/admin/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 jam
    },
    trustHost: true,
}
