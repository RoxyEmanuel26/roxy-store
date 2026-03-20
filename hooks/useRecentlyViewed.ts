'use client'

const RECENTLY_VIEWED_KEY = 'Roxy-lay-recently-viewed'
const MAX_ITEMS = 10

export function useRecentlyViewed() {
    const getIds = (): string[] => {
        if (typeof window === 'undefined') return []
        try {
            return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]')
        } catch {
            return []
        }
    }

    const addProduct = (productId: string) => {
        const ids = getIds()
        const filtered = ids.filter((id) => id !== productId)
        const updated = [productId, ...filtered].slice(0, MAX_ITEMS)
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated))
    }

    return { addProduct, getIds }
}
