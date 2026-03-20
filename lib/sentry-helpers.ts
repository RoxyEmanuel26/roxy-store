import * as Sentry from '@sentry/nextjs'

// Capture error dengan context tambahan
export function captureError(
    error: Error | unknown,
    context?: Record<string, unknown>
) {
    if (process.env.NODE_ENV === 'development') {
        console.error('[Dev Error]', error, context)
        return
    }

    Sentry.withScope((scope) => {
        if (context) {
            Object.entries(context).forEach(([key, value]) => {
                // Use 'any' cast if value doesn't perfectly match Extra types
                scope.setExtra(key, value as any)
            })
        }
        Sentry.captureException(error)
    })
}

// Capture pesan tanpa error
export function captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info'
) {
    Sentry.captureMessage(message, level)
}
