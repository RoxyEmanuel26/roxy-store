declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void
    }
}

// Helper utama untuk kirim event ke GA4
function trackEvent(
    eventName: string,
    parameters?: Record<string, unknown>
) {
    if (typeof window === 'undefined') return
    if (!window.gtag) return
    if (!process.env.NEXT_PUBLIC_GA_ID) return

    window.gtag('event', eventName, {
        ...parameters,
        send_to: process.env.NEXT_PUBLIC_GA_ID,
    })
}

// ====== EVENT FUNCTIONS ======

// Track pageview manual (untuk route changes)
export function trackPageView(url: string, title: string) {
    trackEvent('page_view', {
        page_location: url,
        page_title: title,
    })
}

// Track klik ke Shopee
export function trackShopeeClick(
    productId: string,
    productName: string,
    price: number
) {
    trackEvent('shopee_click', {
        product_id: productId,
        product_name: productName,
        price,
        currency: 'IDR',
    })

    // Juga track sebagai GA4 "select_content"
    trackEvent('select_content', {
        content_type: 'product',
        content_id: productId,
        destination: 'shopee',
    })
}


// Track view produk (detail page)
export function trackProductView(
    productId: string,
    productName: string,
    category: string,
    price: number
) {
    trackEvent('view_item', {
        currency: 'IDR',
        value: price,
        items: [{
            item_id: productId,
            item_name: productName,
            item_category: category,
            price,
            quantity: 1,
        }]
    })
}

// Track wishlist
export function trackAddToWishlist(
    productId: string,
    productName: string,
    price: number
) {
    trackEvent('add_to_wishlist', {
        currency: 'IDR',
        value: price,
        items: [{
            item_id: productId,
            item_name: productName,
            price,
        }]
    })
}

// Track search
export function trackSearch(query: string, resultsCount: number) {
    trackEvent('search', {
        search_term: query,
        results_count: resultsCount,
    })
}


// Track install PWA
export function trackPWAInstall() {
    trackEvent('pwa_install')
}
