import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { LoginSchema } from '@/lib/validations'

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const validated = LoginSchema.safeParse(credentials)
                if (!validated.success) return null

                const { email, password } = validated.data

                const admin = await prisma.admin.findUnique({
                    where: { email },
                })
                if (!admin) return null

                const passwordMatch = await bcrypt.compare(
                    password,
                    admin.passwordHash
                )
                if (!passwordMatch) return null

                return {
                    id: admin.id,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role,
                }
            },
        }),
    ],
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
    cookies: {
        sessionToken: {
            options: {
                httpOnly: true,
                sameSite: 'strict',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
})
