'use client'

import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { showToast } from '@/lib/toast'
import { cn } from '@/lib/utils'

interface ShareButtonProps {
    product: { title: string; slug: string }
    className?: string
}

export function ShareButton({ product, className }: ShareButtonProps) {
    const [copied, setCopied] = useState(false)
    const [showMenu, setShowMenu] = useState(false)

    const getUrl = () =>
        typeof window !== 'undefined'
            ? `${window.location.origin}/produk/${product.slug}`
            : ''

    const handleNativeShare = async () => {
        const productUrl = getUrl()

        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.title,
                    text: `Lihat produk ini dari Roxy Store: ${product.title}`,
                    url: productUrl,
                })
            } catch { /* user cancelled */ }
            return
        }

        setShowMenu(!showMenu)
    }

    const handleShareWhatsApp = () => {
        const text = encodeURIComponent(
            `Hei, cek produk Roxy Store ini yuk! 🎀\n${product.title}\n${getUrl()}`
        )
        window.open(`https://wa.me/?text=${text}`, '_blank')
        setShowMenu(false)
    }

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(getUrl())
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            showToast.linkCopied()
        } catch {
            showToast.error('Gagal menyalin link')
        }
        setShowMenu(false)
    }

    return (
        <div className={cn('relative', className)}>
            <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 h-12 px-4 rounded-xl border-2 border-brand-border dark:border-dark-border text-brand-muted hover:border-brand-primary hover:text-brand-primary dark:hover:border-dark-primary transition-none font-medium w-full"
            >
                <Share2 className="h-5 w-5" />
                Bagikan
            </button>

            <AnimatePresence>
                {showMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-dark-surface rounded-xl shadow-xl border border-brand-border dark:border-dark-border overflow-hidden z-30"
                    >
                        <button
                            onClick={handleShareWhatsApp}
                            className="w-full flex items-center gap-3 p-3 hover:bg-brand-surface dark:hover:bg-dark-bg transition-none text-left"
                        >
                            <span className="text-lg">📱</span>
                            <span className="text-sm font-medium text-brand-text dark:text-dark-text">Bagikan ke WhatsApp</span>
                        </button>
                        <div className="border-t border-brand-border dark:border-dark-border" />
                        <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center gap-3 p-3 hover:bg-brand-surface dark:hover:bg-dark-bg transition-none text-left"
                        >
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            <span className="text-sm font-medium text-brand-text dark:text-dark-text">
                                {copied ? 'Link Tersalin!' : 'Salin Link'}
                            </span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
