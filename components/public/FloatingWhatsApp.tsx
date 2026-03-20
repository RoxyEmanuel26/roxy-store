'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { trackWhatsAppClick } from '@/lib/analytics-events'

interface FloatingWhatsAppProps {
    waNumber: string
}

export function FloatingWhatsApp({ waNumber }: FloatingWhatsAppProps) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 2000)
        return () => clearTimeout(timer)
    }, [])

    const handleClick = () => {
        const message = encodeURIComponent(
            'Halo Roxy Lay, saya ingin bertanya tentang produk 😊'
        )
        window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank')

        trackWhatsAppClick('floating')
    }

    if (!visible) return null

    return (
        <div className="fixed bottom-6 right-6 z-50 group">
            {/* Pulse ring */}
            <motion.div
                className="absolute inset-0 rounded-full bg-[#25D366]"
                animate={{ scale: [1, 1.5, 1.5], opacity: [0.7, 0, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />

            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden group-hover:block whitespace-nowrap">
                <span className="bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg shadow-lg">
                    Chat dengan Kami
                </span>
            </div>

            {/* Button */}
            <motion.button
                onClick={handleClick}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative w-14 h-14 rounded-full bg-[#25D366] shadow-lg shadow-[#25D366]/40 flex items-center justify-center"
                aria-label="Chat via WhatsApp"
            >
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.638-1.467A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.592-5.929-1.622l-.42-.248-2.747.869.882-2.681-.276-.437A9.77 9.77 0 012.182 12 9.818 9.818 0 0112 2.182 9.818 9.818 0 0121.818 12 9.818 9.818 0 0112 21.818z" />
                </svg>
            </motion.button>
        </div>
    )
}
