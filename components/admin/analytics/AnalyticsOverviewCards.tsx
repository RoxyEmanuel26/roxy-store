import { Eye, ShoppingBag, Store, MessageCircle } from 'lucide-react'

interface AnalyticsOverviewCardsProps {
    today: any[]
    last7Days: any[]
    allTime: any[]
}

export function AnalyticsOverviewCards({ today, last7Days, allTime }: AnalyticsOverviewCardsProps) {
    const getCount = (data: any[], type: string) => {
        return data.find((d) => d.eventType === type)?._count?.id || 0
    }

    const cards = [
        {
            label: 'Views Hari Ini',
            value: getCount(today, 'view'),
            total: getCount(allTime, 'view'),
            icon: Eye,
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Klik Shopee Hari Ini',
            value: getCount(today, 'shopee_click'),
            total: getCount(allTime, 'shopee_click'),
            icon: ShoppingBag,
            bgColor: 'bg-orange-100 dark:bg-orange-900/30',
            iconColor: 'text-[#EE4D2D]',
        },
        {
            label: 'Klik Tokopedia Hari Ini',
            value: getCount(today, 'tokopedia_click'),
            total: getCount(allTime, 'tokopedia_click'),
            icon: Store,
            bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
            iconColor: 'text-[#42B549]',
        },
        {
            label: 'Klik WA Hari Ini',
            value: getCount(today, 'wa_click'),
            total: getCount(allTime, 'wa_click'),
            icon: MessageCircle,
            bgColor: 'bg-green-100 dark:bg-green-900/30',
            iconColor: 'text-[#25D366]',
        },
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, i) => {
                const Icon = card.icon
                return (
                    <div
                        key={i}
                        className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-brand-border"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm text-brand-muted font-medium mb-1">
                                    {card.label}
                                </p>
                                <h3 className="text-3xl font-bold text-brand-text dark:text-dark-text">
                                    {card.value.toLocaleString('id-ID')}
                                </h3>
                            </div>
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${card.bgColor}`}
                            >
                                <Icon className={`w-5 h-5 ${card.iconColor}`} />
                            </div>
                        </div>
                        <p className="text-xs text-brand-muted">
                            Total semua waktu: {card.total.toLocaleString('id-ID')}
                        </p>
                    </div>
                )
            })}
        </div>
    )
}
