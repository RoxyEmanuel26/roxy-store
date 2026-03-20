import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    description?: string
    color: 'pink' | 'purple' | 'orange' | 'green'
    trend?: { value: number; isUp: boolean }
}

const colorMap = {
    pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
}

export default function StatsCard({
    title,
    value,
    icon: Icon,
    description,
    color,
    trend,
}: StatsCardProps) {
    return (
        <div className="rounded-xl border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-brand-muted dark:text-dark-muted">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-brand-text dark:text-dark-text">
                        {value}
                    </p>
                    {description && (
                        <p className="text-xs text-brand-muted dark:text-dark-muted">
                            {description}
                        </p>
                    )}
                    {trend && (
                        <div className="flex items-center gap-1">
                            <span
                                className={cn(
                                    'text-xs font-medium',
                                    trend.isUp ? 'text-green-600' : 'text-red-600'
                                )}
                            >
                                {trend.isUp ? '↑' : '↓'} {trend.value}%
                            </span>
                            <span className="text-xs text-brand-muted dark:text-dark-muted">
                                dari kemarin
                            </span>
                        </div>
                    )}
                </div>
                <div className={cn('rounded-xl p-3', colorMap[color])}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    )
}
