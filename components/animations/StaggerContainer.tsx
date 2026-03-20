'use client'

import { motion } from 'framer-motion'

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.96 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.21, 0.47, 0.32, 0.98] as [number, number, number, number],
        },
    },
}

export function StaggerContainer({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

export function StaggerItem({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <motion.div variants={itemVariants} className={className}>
            {children}
        </motion.div>
    )
}
