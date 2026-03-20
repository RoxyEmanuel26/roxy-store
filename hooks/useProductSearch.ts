'use client'

import Fuse from 'fuse.js'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { trackSearch } from '@/lib/analytics-events'
import { useDebounce } from 'use-debounce'

const FUSE_OPTIONS = {
    keys: [
        { name: 'title', weight: 0.7 },
        { name: 'category.name', weight: 0.3 },
    ],
    threshold: 0.4,
    minMatchCharLength: 2,
    includeMatches: true,
}

export function useProductSearch() {
    const [products, setProducts] = useState<any[]>([])
    const [query, setQuery] = useState('')
    const [debouncedQuery] = useDebounce(query, 300) // 300ms debounce

    const [results, setResults] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const fuseRef = useRef<Fuse<any> | null>(null)
    const router = useRouter()

    useEffect(() => {
        setIsLoading(true)
        fetch('/api/products')
            .then((r) => r.json())
            .then((data) => {
                setProducts(data)
                fuseRef.current = new Fuse(data, FUSE_OPTIONS)
            })
            .finally(() => setIsLoading(false))
    }, [])

    const search = useCallback((q: string) => {
        setQuery(q)
    }, [])

    useEffect(() => {
        if (debouncedQuery.length < 2) {
            setResults([])
            setIsOpen(false)
            return
        }

        if (fuseRef.current) {
            const fuseResults = fuseRef.current.search(debouncedQuery, { limit: 6 })
            setResults(fuseResults.map((r) => r.item))
            setIsOpen(true)
        }
    }, [debouncedQuery])

    const handleSelect = useCallback((slug: string) => {
        setIsOpen(false)
        setQuery('')
        router.push(`/products/${slug}`)
    }, [router])

    const handleSubmit = useCallback(() => {
        if (debouncedQuery.length > 0) {
            setIsOpen(false)
            trackSearch(debouncedQuery, results.length)
            router.push(`/products?q=${encodeURIComponent(debouncedQuery)}`)
        }
    }, [debouncedQuery, results.length, router])

    return {
        query,
        results,
        isOpen,
        isLoading,
        search,
        handleSelect,
        handleSubmit,
        setIsOpen,
    }
}
