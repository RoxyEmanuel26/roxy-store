'use client'

import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'
import { showToast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { trackAddToWishlist } from '@/lib/analytics-events'

interface WishlistButtonProps {
    product: { id: string; title: string }
    variant?: 'card' | 'detail'
    className?: string
}

export function WishlistButton({ product, variant = 'card', className }: WishlistButtonProps) {
    const { toggleWishlist, isInWishlist, mounted } = useWishlist()
    const isWishlisted = mounted ? isInWishlist(product.id) : false

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const added = toggleWishlist(product.id)

        if (added) {
            showToast.wishlistAdded(product.title)
            // Wishlist tracking expects price, but WishlistButton only receives id & title right now.
            // For now, pass 0 as price. To do it correctly, the caller would need to pass price.
            trackAddToWishlist(product.id, product.title, (product as any).price || 0)
        } else {
            showToast.wishlistRemoved()
        }
    }

    if (variant === 'card') {
        return (
            <button
                onClick={handleToggle}
                className={cn(
                    'absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:shadow-md transition-none',
                    className
                )}
                aria-label={isWishlisted ? 'Hapus dari favorit' : 'Tambah ke favorit'}
            >
                <motion.div
                    whileTap={{ scale: 1.4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                    <Heart
                        className={cn(
                            'h-4 w-4',
                            isWishlisted
                                ? 'fill-red-500 text-red-500'
                                : 'text-brand-muted dark:text-dark-muted'
                        )}
                    />
                </motion.div>
            </button>
        )
    }

    // variant === 'detail'
    return (
        <button
            onClick={handleToggle}
            className={cn(
                'flex items-center justify-center gap-2 h-12 px-4 rounded-xl border-2 font-medium transition-none',
                isWishlisted
                    ? 'border-red-400 bg-red-50 text-red-500 dark:bg-red-950/20'
                    : 'border-brand-border text-brand-muted hover:border-brand-primary hover:text-brand-primary dark:border-dark-border',
                className
            )}
            aria-label={isWishlisted ? 'Hapus dari favorit' : 'Tambah ke favorit'}
        >
            <motion.div
                animate={{ scale: isWishlisted ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.3 }}
            >
                <Heart className={cn('h-5 w-5', isWishlisted && 'fill-red-500')} />
            </motion.div>
            {isWishlisted ? 'Tersimpan di Favorit' : 'Simpan ke Favorit'}
        </button>
    )
}
