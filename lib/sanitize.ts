/** Sanitize plain text — strip HTML tags + dangerous attributes */
export function sanitizeText(input: string): string {
    return input
        .replace(/<[^>]*>/g, '')                     // strip HTML tags
        .replace(/javascript\s*:/gi, '')             // [SECURITY FIX] strip javascript:
        .replace(/on\w+\s*=/gi, '')                  // [SECURITY FIX] strip event handlers
        .replace(/data\s*:/gi, '')                   // [SECURITY FIX] strip data: URIs
        .trim()
}

/** Sanitize description — strip HTML tags + dangerous attributes, keep newlines */
export function sanitizeDescription(input: string): string {
    const stripped = input
        .replace(/<[^>]*>/g, '')
        .replace(/javascript\s*:/gi, '')             // [SECURITY FIX] strip javascript:
        .replace(/on\w+\s*=/gi, '')                  // [SECURITY FIX] strip event handlers
        .replace(/data\s*:/gi, '')                   // [SECURITY FIX] strip data: URIs
    return stripped.replace(/[ \t]+/g, ' ').trim()
}

/** Sanitize URL — only allow http/https protocols */
export function sanitizeUrl(url: string): string | null {
    try {
        const parsed = new URL(url)
        if (!['http:', 'https:'].includes(parsed.protocol)) return null
        return parsed.toString()
    } catch {
        return null
    }
}
