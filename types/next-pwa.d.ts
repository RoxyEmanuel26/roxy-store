declare module 'next-pwa' {
    import type { NextConfig } from 'next'

    interface PWAConfig {
        dest?: string
        register?: boolean
        skipWaiting?: boolean
        disable?: boolean
        buildExcludes?: RegExp[]
        runtimeCaching?: Array<{
            urlPattern: RegExp | ((params: { request: Request }) => boolean)
            handler: string
            options?: Record<string, unknown>
        }>
        [key: string]: unknown
    }

    export default function withPWAInit(config: PWAConfig): (nextConfig: NextConfig) => NextConfig
}
