'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const WISHLIST_KEY = 'Roxy-lay-wishlist'

export function useWishlist() {
    const [wishlistIds, setWishlistIds] = useState<string[]>([])
    const [mounted, setMounted] = useState(false)
    // ref untuk akses nilai terkini tanpa closure stale
    const wishlistRef = useRef<string[]>([])

    useEffect(() => {
        setMounted(true)
        try {
            const stored = localStorage.getItem(WISHLIST_KEY)
            if (stored) {
                const parsed = JSON.parse(stored)
                setWishlistIds(parsed)
                wishlistRef.current = parsed
            }
        } catch {
            setWishlistIds([])
        }

        const handler = () => {
            try {
                const stored = localStorage.getItem(WISHLIST_KEY)
                const parsed = stored ? JSON.parse(stored) : []
                setWishlistIds(parsed)
                wishlistRef.current = parsed
            } catch { /* ignore */ }
        }
        window.addEventListener('wishlist-updated', handler)
        window.addEventListener('storage', handler)
        return () => {
            window.removeEventListener('wishlist-updated', handler)
            window.removeEventListener('storage', handler)
        }
    }, [])

    const saveToStorage = useCallback((ids: string[]) => {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids))
        wishlistRef.current = ids
        setWishlistIds(ids)
        window.dispatchEvent(new Event('wishlist-updated'))
    }, [])

    const addToWishlist = useCallback((productId: string) => {
        const current = wishlistRef.current
        if (current.includes(productId)) return
        const next = [...current, productId]
        saveToStorage(next)
    }, [saveToStorage])

    const removeFromWishlist = useCallback((productId: string) => {
        const next = wishlistRef.current.filter((id) => id !== productId)
        saveToStorage(next)
    }, [saveToStorage])

    const toggleWishlist = useCallback((productId: string): boolean => {
        // Cek state SEBELUM update — bukan di dalam setState callback
        const isCurrentlyInWishlist = wishlistRef.current.includes(productId)
        if (isCurrentlyInWishlist) {
            const next = wishlistRef.current.filter((id) => id !== productId)
            saveToStorage(next)
            return false // dihapus
        } else {
            const next = [...wishlistRef.current, productId]
            saveToStorage(next)
            return true  // ditambahkan
        }
    }, [saveToStorage])

    const isInWishlist = useCallback((productId: string) => {
        return wishlistIds.includes(productId)
    }, [wishlistIds])

    const clearWishlist = useCallback(() => {
        saveToStorage([])
    }, [saveToStorage])

    return {
        wishlistIds,
        wishlistCount: wishlistIds.length,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
        mounted,
    }
}
