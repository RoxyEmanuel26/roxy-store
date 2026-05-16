import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { LoginSchema } from '@/lib/validations'

export const { handlers, auth } = NextAuth({
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    const validated = LoginSchema.safeParse(credentials)
                    if (!validated.success) {
                        console.error("Auth validation failed", validated.error)
                        return null
                    }

                    const { email, password } = validated.data

                    const admin = await prisma.admin.findUnique({
                        where: { email },
                    })
                    if (!admin) {
                        console.error("Admin not found:", email)
                        return null
                    }

                    const passwordMatch = await bcrypt.compare(
                        password,
                        admin.passwordHash
                    )
                    if (!passwordMatch) {
                        console.error("Password mismatch for:", email)
                        return null
                    }

                    return {
                        id: admin.id,
                        email: admin.email,
                        name: admin.name,
                        role: admin.role,
                    }
                } catch (error) {
                    console.error("Database/Auth Error during login:", error)
                    return null
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
    trustHost: true,
})
