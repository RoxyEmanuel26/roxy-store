'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { trackPWAInstall } from '@/lib/analytics-events'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showBanner, setShowBanner] = useState(false)

    useEffect(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed')
        const visitCount = parseInt(localStorage.getItem('visit-count') || '0') + 1
        localStorage.setItem('visit-count', String(visitCount))

        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            if (visitCount >= 2 && !dismissed) {
                setShowBanner(true)
            }
        }

        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setShowBanner(false)
            trackPWAInstall()
        }
        setDeferredPrompt(null)
    }

    const handleDismiss = () => {
        setShowBanner(false)
        localStorage.setItem('pwa-install-dismissed', 'true')
    }

    return (
        <AnimatePresence>
            {showBanner && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    className="fixed bottom-20 left-4 right-4 z-40 bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-brand-border dark:border-dark-border p-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">CL</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-brand-text dark:text-dark-text">Install Roxy Lay</p>
                            <p className="text-xs text-brand-muted truncate">Tambahkan ke layar utama untuk akses cepat</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={handleInstall}
                                className="bg-brand-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-accent"
                            >
                                Install
                            </button>
                            <button onClick={handleDismiss} className="text-brand-muted hover:text-brand-text">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
