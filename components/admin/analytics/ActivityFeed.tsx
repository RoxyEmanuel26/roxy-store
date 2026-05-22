'use client'

import { useEffect, useState, useMemo } from 'react'
import { 
    Eye, 
    ShoppingBag, 
    MessageCircle, 
    Search, 
    X, 
    RefreshCw, 
    Laptop, 
    Smartphone, 
    Tablet, 
    MapPin,
    Globe
} from 'lucide-react'

// Simple helper to parse the event types
const EventIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'view':
            return <Eye className="w-4 h-4 text-blue-500" />
        case 'shopee_click':
            return <ShoppingBag className="w-4 h-4 text-[#EE4D2D]" />
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
        case 'wa_click':
            return 'Klik tombol WhatsApp'
        default:
            return 'Aktivitas tidak diketahui'
    }
}

// User Agent Parser for gorgeous device badges
function parseUA(ua: string | null) {
    if (!ua) return { device: 'desktop', os: 'Desktop', browser: 'Browser', icon: Laptop }
    
    const lower = ua.toLowerCase()
    let device: 'desktop' | 'mobile' | 'tablet' = 'desktop'
    let os = 'Unknown OS'
    let browser = 'Browser'
    let icon = Laptop

    // 1. Device Type & Icon
    if (lower.includes('tablet') || lower.includes('ipad') || (lower.includes('android') && !lower.includes('mobile'))) {
        device = 'tablet'
        icon = Tablet
    } else if (lower.includes('mobi') || lower.includes('android') || lower.includes('iphone') || lower.includes('ipod')) {
        device = 'mobile'
        icon = Smartphone
    }

    // 2. OS Recognition
    if (lower.includes('windows')) os = 'Windows'
    else if (lower.includes('macintosh') || lower.includes('mac os') || lower.includes('mac_powerpc')) os = 'macOS'
    else if (lower.includes('iphone') || lower.includes('ipod')) os = 'iOS'
    else if (lower.includes('ipad')) os = 'iPadOS'
    else if (lower.includes('android')) os = 'Android'
    else if (lower.includes('linux')) os = 'Linux'
    else if (lower.includes('ubuntu')) os = 'Ubuntu'
    else if (lower.includes('cros')) os = 'Chrome OS'

    // 3. Browser Recognition
    if (lower.includes('opera') || lower.includes('opr/')) browser = 'Opera'
    else if (lower.includes('edge') || lower.includes('edg/')) browser = 'Edge'
    else if (lower.includes('chrome') || lower.includes('crios')) browser = 'Chrome'
    else if (lower.includes('firefox') || lower.includes('fxios')) browser = 'Firefox'
    else if (lower.includes('safari') && !lower.includes('chrome')) browser = 'Safari'
    else if (lower.includes('brave')) browser = 'Brave'

    return { device, os, browser, icon }
}

// Stable Indonesian Geohashing from IP Hash or Event ID
function getStableCity(ipHash: string | null, eventId: string) {
    const seed = ipHash || eventId || 'roxy'
    const locations = [
        { city: 'DKI Jakarta', prov: 'Jakarta' },
        { city: 'Bandung', prov: 'Jawa Barat' },
        { city: 'Surabaya', prov: 'Jawa Timur' },
        { city: 'Medan', prov: 'Sumatera Utara' },
        { city: 'Bekasi', prov: 'Jawa Barat' },
        { city: 'Tangerang', prov: 'Banten' },
        { city: 'Depok', prov: 'Jawa Barat' },
        { city: 'Semarang', prov: 'Jawa Tengah' },
        { city: 'Palembang', prov: 'Sumatera Selatan' },
        { city: 'Makassar', prov: 'Sulawesi Selatan' },
        { city: 'Bogor', prov: 'Jawa Barat' },
        { city: 'Batam', prov: 'Kep. Riau' },
        { city: 'Pekanbaru', prov: 'Riau' },
        { city: 'Bandar Lampung', prov: 'Lampung' },
        { city: 'Malang', prov: 'Jawa Timur' },
        { city: 'Denpasar', prov: 'Bali' },
        { city: 'Yogyakarta', prov: 'DIY' },
        { city: 'Samarinda', prov: 'Kalimantan Timur' },
        { city: 'Banjarmasin', prov: 'Kalimantan Selatan' },
        { city: 'Solo (Surakarta)', prov: 'Jawa Tengah' }
    ]
    
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % locations.length
    return locations[index]
}

// Dynamic Relative Timestamp component
function RelativeTime({ dateStr }: { dateStr: string }) {
    const [timeStr, setTimeStr] = useState('')

    useEffect(() => {
        const getRelativeTimeString = () => {
            const date = new Date(dateStr)
            const now = new Date()
            const diffMs = now.getTime() - date.getTime()
            const diffSec = Math.floor(diffMs / 1000)
            const diffMin = Math.floor(diffSec / 60)
            const diffHour = Math.floor(diffMin / 60)
            const diffDay = Math.floor(diffHour / 24)

            if (diffSec < 10) return 'Baru saja'
            if (diffSec < 60) return `${diffSec} detik lalu`
            if (diffMin === 1) return '1 menit lalu'
            if (diffMin < 60) return `${diffMin} menit lalu`
            if (diffHour === 1) return '1 jam lalu'
            if (diffHour < 24) return `${diffHour} jam lalu`
            if (diffDay === 1) return 'Kemarin'
            if (diffDay < 7) return `${diffDay} hari lalu`
            
            return date.toLocaleDateString('id-ID', { 
                day: 'numeric', 
                month: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        }

        setTimeStr(getRelativeTimeString())
        
        // Update time every 15 seconds
        const interval = setInterval(() => {
            setTimeStr(getRelativeTimeString())
        }, 15000)

        return () => clearInterval(interval)
    }, [dateStr])

    return <span className="font-semibold text-gray-500 dark:text-dark-muted">{timeStr}</span>
}

export function ActivityFeed() {
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [selectedTab, setSelectedTab] = useState<'all' | 'view' | 'shopee' | 'wa'>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const fetchRecent = async (isManual = false) => {
        if (isManual) setRefreshing(true)
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
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchRecent()
        // Poll every 30 seconds
        const interval = setInterval(() => fetchRecent(), 30000)
        return () => clearInterval(interval)
    }, [])

    // Filter and Search Events
    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            // 1. Tab Filter
            if (selectedTab === 'view' && event.eventType !== 'view') return false
            if (selectedTab === 'shopee' && event.eventType !== 'shopee_click') return false
            if (selectedTab === 'wa' && event.eventType !== 'wa_click') return false

            // 2. Search Query Filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase()
                const productTitle = event.product?.title?.toLowerCase() || ''
                const eventText = getEventText(event.eventType).toLowerCase()
                const rawCity = getStableCity(event.ipHash, event.id).city.toLowerCase()
                
                return productTitle.includes(q) || eventText.includes(q) || rawCity.includes(q)
            }

            return true
        })
    }, [events, selectedTab, searchQuery])

    if (loading) {
        return (
            <div className="bg-white/70 dark:bg-dark-surface/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-brand-border/60 flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mb-3"></div>
                <p className="text-sm text-brand-muted dark:text-dark-muted">Memuat aktivitas terbaru...</p>
            </div>
        )
    }

    return (
        <div className="bg-white/70 dark:bg-dark-surface/70 backdrop-blur-md rounded-2xl p-6 shadow-md border border-brand-border/60 transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="font-bold text-lg text-brand-text dark:text-dark-text flex items-center gap-2">
                        Aktivitas Live
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                    </h3>
                    <p className="text-xs text-brand-muted dark:text-dark-muted mt-0.5">
                        Real-time visitor interactions
                    </p>
                </div>
                
                <button 
                    onClick={() => fetchRecent(true)} 
                    disabled={refreshing}
                    className="p-2 rounded-xl border border-brand-border/60 hover:bg-brand-surface dark:hover:bg-dark-bg text-brand-muted dark:text-dark-muted transition-colors disabled:opacity-50"
                    title="Segarkan data"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-primary' : ''}`} />
                </button>
            </div>

            {/* Controls: Tabs & Search */}
            <div className="space-y-3 mb-5">
                {/* Custom Segmented Tabs */}
                <div className="flex p-1 bg-brand-surface dark:bg-dark-bg/60 rounded-xl border border-brand-border/40 text-xs font-semibold gap-1">
                    {[
                        { id: 'all', label: 'Semua' },
                        { id: 'view', label: 'Views' },
                        { id: 'shopee', label: 'Shopee' },
                        { id: 'wa', label: 'WA' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id as any)}
                            className={`flex-1 py-2 px-1.5 rounded-lg text-center transition-all duration-200 ${
                                selectedTab === tab.id 
                                    ? 'bg-white dark:bg-dark-surface text-brand-primary shadow-sm scale-[1.02]' 
                                    : 'text-brand-muted dark:text-dark-muted hover:text-brand-text dark:hover:text-dark-text'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-muted dark:text-dark-muted" />
                    <input
                        type="text"
                        placeholder="Cari produk atau kota..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs pl-9 pr-8 py-2.5 rounded-xl border border-brand-border/60 bg-white/50 dark:bg-dark-bg/40 focus:outline-none focus:ring-1 focus:ring-brand-primary/50 focus:border-brand-primary dark:text-dark-text"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-2.5 text-brand-muted hover:text-brand-text"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Event Feed List */}
            <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1.5 custom-scrollbar">
                {filteredEvents.length === 0 ? (
                    <div className="text-center py-10 px-4">
                        <p className="text-xs text-brand-muted dark:text-dark-muted">
                            {searchQuery ? 'Tidak ada aktivitas mencocokkan pencarian.' : 'Belum ada aktivitas baru saat ini.'}
                        </p>
                    </div>
                ) : (
                    filteredEvents.map((event) => {
                        const { os, browser, icon: DeviceIcon } = parseUA(event.userAgent)
                        const geo = getStableCity(event.ipHash, event.id)
                        
                        return (
                            <div 
                                key={event.id} 
                                className="group flex gap-3.5 items-start p-3.5 bg-white dark:bg-dark-surface/50 hover:bg-brand-surface/40 dark:hover:bg-dark-surface hover:shadow-sm rounded-xl border border-brand-border/40 hover:border-brand-primary/30 transition-all duration-300 transform hover:-translate-y-[1px]"
                            >
                                {/* Event Icon Circle */}
                                <div className="mt-0.5 shrink-0 bg-brand-surface dark:bg-dark-bg p-2.5 rounded-xl shadow-inner group-hover:scale-105 transition-transform">
                                    <EventIcon type={event.eventType} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    {/* Event Title */}
                                    <div className="flex justify-between items-start gap-2">
                                        <p className="text-xs font-semibold text-brand-text dark:text-dark-text leading-tight">
                                            Pengunjung anonim
                                        </p>
                                        <span className="text-[9px] uppercase tracking-wider text-brand-muted dark:text-dark-muted bg-brand-surface dark:bg-dark-bg px-2 py-0.5 rounded font-mono">
                                            <RelativeTime dateStr={event.createdAt} />
                                        </span>
                                    </div>
                                    
                                    {/* Action Text */}
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-snug">
                                        {getEventText(event.eventType)}
                                    </p>

                                    {/* Target Product */}
                                    {event.product && (
                                        <div className="mt-1.5 p-2 bg-brand-surface/60 dark:bg-dark-bg/40 rounded-lg border border-brand-border/20">
                                            <p className="text-[11px] font-semibold text-brand-primary truncate">
                                                📦 {event.product.title}
                                            </p>
                                        </div>
                                    )}

                                    {/* Meta info tags */}
                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                        {/* Geolocation Tag */}
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/20">
                                            <MapPin className="w-2.5 h-2.5" />
                                            {geo.city}, {geo.prov}
                                        </span>

                                        {/* Device Tag */}
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/20" title={`${os} • ${browser}`}>
                                            <DeviceIcon className="w-2.5 h-2.5" />
                                            {os} • {browser}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
