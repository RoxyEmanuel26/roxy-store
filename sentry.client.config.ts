import * as Sentry from '@sentry/nextjs'

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Hanya aktif di production
    enabled: process.env.NODE_ENV === 'production',

    // Track 10% dari semua transaksi (performance monitoring)
    tracesSampleRate: 0.1,

    // Replay 10% sessions normal, 100% saat ada error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
        Sentry.replayIntegration({
            // Sensor data sensitif
            maskAllText: false,
            blockAllMedia: false,
            maskAllInputs: true,  // mask semua input form
        }),
    ],

    // Filter error yang tidak penting
    ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'Network request failed',
        /^Loading chunk \d+ failed/,
    ],

    // Tambahkan context user jika ada
    beforeSend(event) {
        // Jangan kirim jika development
        if (process.env.NODE_ENV === 'development') return null
        return event
    },
})
