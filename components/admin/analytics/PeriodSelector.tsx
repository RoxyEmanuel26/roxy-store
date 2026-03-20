'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const periods = [
    { value: 'today', label: 'Hari Ini' },
    { value: '7days', label: '7 Hari' },
    { value: '30days', label: '30 Hari' },
    { value: 'alltime', label: 'Semua Waktu' },
]

export function PeriodSelector({ defaultValue = '7days' }: { defaultValue?: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const selected = searchParams?.get('period') || defaultValue

    const onSelect = (val: string) => {
        const params = new URLSearchParams(searchParams?.toString() || '')
        params.set('period', val)
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex bg-brand-surface dark:bg-dark-surface rounded-xl p-1 gap-1 border border-brand-border">
            {periods.map((period) => (
                <button
                    key={period.value}
                    onClick={() => onSelect(period.value)}
                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${selected === period.value
                            ? 'bg-brand-primary text-white shadow-sm'
                            : 'text-brand-muted hover:text-brand-text dark:hover:text-dark-text'
                        }`}
                >
                    {period.label}
                </button>
            ))}
        </div>
    )
}
