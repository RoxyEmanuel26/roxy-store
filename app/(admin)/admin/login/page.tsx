'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoginSchema } from '@/lib/validations'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type LoginValues = z.infer<typeof LoginSchema>

export default function AdminLoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/admin/dashboard'
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginValues>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const onSubmit = async (data: LoginValues) => {
        setIsLoading(true)
        setError('')

        try {
            const result = await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
            })

            if (result?.error) {
                setError('Email atau kata sandi salah. Silakan coba lagi.')
            } else {
                router.push(callbackUrl)
                router.refresh()
            }
        } catch {
            setError('Terjadi kesalahan. Silakan coba lagi.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg p-4">
            {/* Decorative blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-primary/10 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-brand-accent/10 blur-3xl" />
            </div>

            <div className="relative w-full max-w-[420px]">
                <div className="rounded-2xl border border-brand-border dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl shadow-xl p-8">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent shadow-lg mb-4">
                            <Sparkles className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                            Roxy Store
                        </h1>
                        <p className="text-sm text-brand-muted dark:text-dark-muted mt-1">
                            Admin Dashboard
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-brand-border dark:bg-dark-border mb-6" />

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">
                                Alamat Email
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted dark:text-dark-muted" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@roxystore.com"
                                    autoFocus
                                    className="pl-10"
                                    disabled={isLoading}
                                    {...register('email')}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">
                                Kata Sandi
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted dark:text-dark-muted" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10"
                                    disabled={isLoading}
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted dark:text-dark-muted hover:text-brand-text dark:hover:text-dark-text transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-500">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white py-5 text-base font-medium"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sedang masuk...
                                </>
                            ) : (
                                'Masuk ke Dashboard'
                            )}
                        </Button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-brand-muted dark:text-dark-muted mt-6">
                    &copy; {new Date().getFullYear()} Roxy Store. Semua hak dilindungi.
                </p>
            </div>
        </div>
    )
}
