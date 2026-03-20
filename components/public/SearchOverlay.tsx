'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { Search, X, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProductSearch } from '@/hooks/useProductSearch'
import { formatRupiah } from '@/lib/utils'

interface SearchOverlayProps {
    isOpen: boolean
    onClose: () => void
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const { query, results, isOpen: dropdownOpen, search, handleSelect, handleSubmit, setIsOpen } = useProductSearch()
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    const onSelectAndClose = (slug: string) => {
        handleSelect(slug)
        onClose()
    }

    const onSubmitAndClose = () => {
        handleSubmit()
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                    />

                    {/* Search Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-0 left-0 right-0 z-[61] bg-white dark:bg-dark-surface shadow-2xl p-6"
                    >
                        <div className="container mx-auto max-w-2xl">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-muted" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => search(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') onSubmitAndClose()
                                        if (e.key === 'Escape') onClose()
                                    }}
                                    placeholder="Cari produk aksesori..."
                                    className="w-full h-14 pl-12 pr-12 text-lg rounded-2xl bg-brand-surface dark:bg-dark-bg border border-brand-border dark:border-dark-border text-brand-text dark:text-dark-text placeholder:text-brand-muted focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                                />
                                <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Results */}
                            <AnimatePresence>
                                {dropdownOpen && results.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                        transition={{ duration: 0.15 }}
                                        className="mt-3 bg-white dark:bg-dark-surface rounded-xl shadow-xl border border-brand-border dark:border-dark-border overflow-hidden"
                                    >
                                        {results.map((product: any) => (
                                            <button
                                                key={product.id}
                                                onClick={() => onSelectAndClose(product.slug)}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-brand-surface dark:hover:bg-dark-bg transition-none text-left"
                                            >
                                                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                                    <Image src={product.image} alt={product.title} fill className="object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-brand-text dark:text-dark-text truncate">{product.title}</p>
                                                    <p className="text-xs text-brand-muted">{product.category?.name} • {formatRupiah(product.price)}</p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-brand-muted flex-shrink-0" />
                                            </button>
                                        ))}

                                        <div className="border-t border-brand-border dark:border-dark-border">
                                            <button
                                                onClick={onSubmitAndClose}
                                                className="w-full p-3 text-sm text-brand-primary hover:bg-brand-surface dark:hover:bg-dark-bg transition-none text-center font-medium"
                                            >
                                                Lihat semua hasil untuk &ldquo;{query}&rdquo;
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {dropdownOpen && query.length >= 2 && results.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mt-3 bg-white dark:bg-dark-surface rounded-xl shadow-xl border border-brand-border dark:border-dark-border p-4 text-center"
                                    >
                                        <p className="text-brand-muted text-sm">Tidak ditemukan produk untuk &ldquo;{query}&rdquo;</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <p className="text-xs text-brand-muted mt-3">Tekan ESC untuk menutup pencarian</p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
