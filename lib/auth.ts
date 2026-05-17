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
})
