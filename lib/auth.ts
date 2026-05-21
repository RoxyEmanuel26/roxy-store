import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { LoginSchema } from '@/lib/validations'
import { authConfig } from '@/lib/auth.config'

/**
 * Full auth configuration with database access.
 * Used by API routes and Server Components (NOT middleware/edge).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
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
                        // [SECURITY FIX] Jangan log detail validation error
                        console.error("Auth: validation failed")
                        return null
                    }

                    const { email, password } = validated.data

                    const admin = await prisma.admin.findUnique({
                        where: { email },
                    })
                    if (!admin) {
                        // [SECURITY FIX] Log generik tanpa email
                        console.warn("Auth: login attempt failed — admin not found")
                        return null
                    }

                    const passwordMatch = await bcrypt.compare(
                        password,
                        admin.passwordHash
                    )
                    if (!passwordMatch) {
                        // [SECURITY FIX] Log generik tanpa email
                        console.warn("Auth: login attempt failed — password mismatch")
                        return null
                    }

                    return {
                        id: admin.id,
                        email: admin.email,
                        name: admin.name,
                        role: admin.role,
                    }
                } catch (error) {
                    // [SECURITY FIX] Log hanya error message, bukan full object
                    const errMsg = error instanceof Error ? error.message : 'Unknown error'
                    console.error("Auth: database error during login —", errMsg)
                    return null
                }
            },
        }),
    ],
})
