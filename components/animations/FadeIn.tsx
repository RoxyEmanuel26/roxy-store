'use client'

import { motion } from 'framer-motion'

interface FadeInProps {
    children: React.ReactNode
    delay?: number
    direction?: 'up' | 'down' | 'left' | 'right' | 'none'
    className?: string
}

export function FadeIn({
    children,
    delay = 0,
    direction = 'up',
    className,
}: FadeInProps) {
    const directionOffset = {
        up: { y: 24 },
        down: { y: -24 },
        left: { x: 24 },
        right: { x: -24 },
        none: {},
    }

    return (
        <motion.div
            initial={{ opacity: 0, ...directionOffset[direction] }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
                duration: 0.5,
                delay,
                ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}
