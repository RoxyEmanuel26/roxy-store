/** Sanitize plain text — strip HTML tags, keep safe characters like & */
export function sanitizeText(input: string): string {
    return input
        .replace(/<[^>]*>/g, '') // strip HTML tags
        .trim()
}

/** Sanitize description — strip HTML tags, keep newlines */
export function sanitizeDescription(input: string): string {
    const stripped = input.replace(/<[^>]*>/g, '')
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
