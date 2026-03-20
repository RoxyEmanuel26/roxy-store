'use client'

import { useEffect, useState } from 'react'
import { Eye, ShoppingBag, Store, MessageCircle } from 'lucide-react'

// Simple helper to parse the event types
const EventIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'view':
            return <Eye className="w-4 h-4 text-blue-500" />
        case 'shopee_click':
            return <ShoppingBag className="w-4 h-4 text-[#EE4D2D]" />
        case 'tokopedia_click':
            return <Store className="w-4 h-4 text-[#42B549]" />
        case 'wa_click':
            return <MessageCircle className="w-4 h-4 text-[#25D366]" />
        default:
            return <Eye className="w-4 h-4 text-gray-500" />
    }
}

const getEventText = (type: string) => {
    switch (type) {
        case 'view':
            return 'Melihat produk'
        case 'shopee_click':
            return 'Klik beli di Shopee'
        case 'tokopedia_click':
            return 'Klik beli di Tokopedia'
        case 'wa_click':
            return 'Klik tombol WhatsApp'
        default:
            return 'Aktivitas tidak diketahui'
    }
}

export function ActivityFeed() {
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const res = await fetch('/api/admin/analytics/recent')
                if (res.ok) {
                    const data = await res.json()
                    setEvents(data.events || [])
                }
            } catch (err) {
                console.error('Failed to fetch recent events', err)
            } finally {
                setLoading(false)
            }
        }

        fetchRecent()
        // Poll every 30 seconds
        const interval = setInterval(fetchRecent, 30000)
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return <div className="text-center py-8 text-brand-muted text-sm px-4">Memuat aktivitas terbaru...</div>
    }

    return (
        <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-brand-border">
            <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                Live Activity Feed
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
            </h3>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {events.length === 0 ? (
                    <p className="text-sm text-brand-muted text-center py-4">Belum ada aktivitas hari ini.</p>
                ) : (
                    events.map((event) => (
                        <div key={event.id} className="flex gap-3 items-start p-3 bg-brand-surface dark:bg-dark-bg rounded-xl border border-brand-border/50">
                            <div className="mt-0.5 bg-white dark:bg-dark-surface p-2 rounded-full shadow-sm">
                                <EventIcon type={event.eventType} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-brand-text dark:text-dark-text">
                                    User anonim — {getEventText(event.eventType)}
                                </p>
                                {event.product && (
                                    <p className="text-xs text-brand-primary font-medium mt-0.5">
                                        {event.product.title}
                                    </p>
                                )}
                                <p className="text-[10px] text-brand-muted mt-1 uppercase tracking-wider">
                                    {new Date(event.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
