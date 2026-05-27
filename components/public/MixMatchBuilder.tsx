'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Shirt, 
  Layers, 
  ShoppingBag, 
  Search, 
  Trash2, 
  Plus, 
  RotateCcw, 
  Share2, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  ExternalLink,
  PackageSearch,
  ShoppingCart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatRupiah } from '@/lib/utils'

// ─────────────────────────────────────────────
// Tipe Data
// ─────────────────────────────────────────────
interface Product {
  id: string
  title: string
  slug: string
  price: number
  originalPrice?: number | null
  image: string
  badge?: string | null
  shopeeUrl?: string
  category?: { name: string; slug: string }
}

type SlotType = 'aksesoris' | 'atasan' | 'bawahan' | 'sepatu'

interface SubcategoryConfig {
  label: string
  categorySlug: string
  defaultSearch?: string
}

interface SlotConfig {
  label: string
  icon: React.ComponentType<{ className?: string }>
  placeholderText: string
  subcategories: SubcategoryConfig[]
}

// ─────────────────────────────────────────────
// Konfigurasi Slot
// ─────────────────────────────────────────────
const SLOT_CONFIGS: Record<SlotType, SlotConfig> = {
  aksesoris: {
    label: 'Aksesoris & Hijab',
    icon: Sparkles,
    placeholderText: 'Pilih Hijab, Kacamata, atau Kalung',
    subcategories: [
      { label: 'Aksesoris', categorySlug: 'aksesoris-fashion' },
      { label: 'Fashion Muslim', categorySlug: 'fashion-muslim', defaultSearch: 'hijab' }
    ]
  },
  atasan: {
    label: 'Atasan (Tops)',
    icon: Shirt,
    placeholderText: 'Pilih Blouse, Kaos, atau Kemeja',
    subcategories: [
      { label: 'Wanita', categorySlug: 'pakaian-wanita', defaultSearch: 'atasan' },
      { label: 'Pria', categorySlug: 'pakaian-pria', defaultSearch: 'kemeja' },
      { label: 'Tunik/Gamis', categorySlug: 'fashion-muslim', defaultSearch: 'tunik' }
    ]
  },
  bawahan: {
    label: 'Bawahan (Bottoms)',
    icon: Layers,
    placeholderText: 'Pilih Rok atau Celana',
    subcategories: [
      { label: 'Rok Wanita', categorySlug: 'pakaian-wanita', defaultSearch: 'rok' },
      { label: 'Celana Wanita', categorySlug: 'pakaian-wanita', defaultSearch: 'celana' },
      { label: 'Celana Pria', categorySlug: 'pakaian-pria', defaultSearch: 'celana' }
    ]
  },
  sepatu: {
    label: 'Sepatu & Tas',
    icon: ShoppingBag,
    placeholderText: 'Pilih Sepatu, Heels, atau Tas',
    subcategories: [
      { label: 'Sepatu Wanita', categorySlug: 'sepatu-wanita' },
      { label: 'Sepatu Pria', categorySlug: 'sepatu-pria' },
      { label: 'Tas Wanita', categorySlug: 'tas-wanita' },
      { label: 'Tas Pria', categorySlug: 'tas-pria' }
    ]
  }
}

const SLOT_ORDER: SlotType[] = ['aksesoris', 'atasan', 'bawahan', 'sepatu']
const ITEMS_PER_PAGE = 9

// ─────────────────────────────────────────────
// Komponen Utama (dibungkus Suspense di bawah)
// ─────────────────────────────────────────────
function MixMatchBuilderInner() {
  const searchParams = useSearchParams()

  // State untuk melacak item terpilih di setiap slot
  const [selectedItems, setSelectedItems] = useState<Record<SlotType, Product | null>>({
    aksesoris: null,
    atasan: null,
    bawahan: null,
    sepatu: null
  })

  // State navigasi & filter panel kanan
  const [activeSlot, setActiveSlot] = useState<SlotType>('atasan')
  const [selectedSubIndex, setSelectedSubIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  
  // State data produk dari API
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)

  // State notifikasi & toast
  const [shared, setShared] = useState(false)
  const [equipToast, setEquipToast] = useState<string | null>(null)

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE) || 1

  // ─────────────────────────────────────────────
  // 1. Muat outfit dari URL query params (share link)
  // ─────────────────────────────────────────────
  useEffect(() => {
    const loadSharedOutfit = async () => {
      const paramMap: Record<SlotType, string | null> = {
        aksesoris: searchParams.get('aksesoris'),
        atasan: searchParams.get('atasan'),
        bawahan: searchParams.get('bawahan'),
        sepatu: searchParams.get('sepatu'),
      }

      const slugsToLoad = Object.entries(paramMap).filter(([, slug]) => slug !== null) as [SlotType, string][]
      if (slugsToLoad.length === 0) return

      try {
        const results = await Promise.all(
          slugsToLoad.map(async ([slot, slug]) => {
            const res = await fetch(`/api/products/list?q=${encodeURIComponent(slug)}&limit=5`)
            if (!res.ok) return { slot, product: null }
            const data = await res.json()
            // Cari produk yang slug-nya persis sama
            const exactMatch = data.products?.find((p: Product) => p.slug === slug)
            return { slot, product: exactMatch || null }
          })
        )

        const newSelected: Record<SlotType, Product | null> = {
          aksesoris: null, atasan: null, bawahan: null, sepatu: null
        }
        results.forEach(({ slot, product }) => {
          if (product) newSelected[slot] = product
        })
        setSelectedItems(newSelected)
      } catch (err) {
        console.error('Error loading shared outfit:', err)
      }
    }

    loadSharedOutfit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─────────────────────────────────────────────
  // 2. Fetch produk dari API
  // ─────────────────────────────────────────────
  const fetchProducts = useCallback(async (categorySlug: string, q: string, pageNum: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        category: categorySlug,
        ...(q && { q }),
        page: pageNum.toString(),
        limit: ITEMS_PER_PAGE.toString()
      })
      const res = await fetch(`/api/products/list?${params.toString()}`)
      if (!res.ok) throw new Error('Fetch failed')
      const data = await res.json()
      setProducts(data.products || [])
      setTotalProducts(data.total || 0)
    } catch (err) {
      console.error('Gagal memuat produk:', err)
      setProducts([])
      setTotalProducts(0)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch saat slot, subkategori, pencarian, atau halaman berubah
  useEffect(() => {
    const activeSub = SLOT_CONFIGS[activeSlot].subcategories[selectedSubIndex]
    if (!activeSub) return

    const query = searchQuery || activeSub.defaultSearch || ''
    const delayDebounce = setTimeout(() => {
      fetchProducts(activeSub.categorySlug, query, page)
    }, searchQuery ? 350 : 0) // Debounce hanya untuk pencarian manual

    return () => clearTimeout(delayDebounce)
  }, [activeSlot, selectedSubIndex, searchQuery, page, fetchProducts])

  // Reset halaman dan pencarian saat mengganti slot atau sub-kategori
  useEffect(() => {
    setPage(1)
    setSearchQuery('')
    setSelectedSubIndex(0)
  }, [activeSlot])

  useEffect(() => {
    setPage(1)
  }, [selectedSubIndex])

  // ─────────────────────────────────────────────
  // 3. Event Handlers
  // ─────────────────────────────────────────────

  // Pasang produk ke slot aktif
  const handleEquipProduct = useCallback((product: Product) => {
    setSelectedItems((prev) => ({
      ...prev,
      [activeSlot]: product
    }))
    // Tampilkan toast konfirmasi
    setEquipToast(SLOT_CONFIGS[activeSlot].label)
    setTimeout(() => setEquipToast(null), 1500)
  }, [activeSlot])

  // Lepas produk dari slot
  const handleRemoveProduct = useCallback((slot: SlotType, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedItems((prev) => ({
      ...prev,
      [slot]: null
    }))
  }, [])

  // Tracking klik affiliate Shopee
  const trackClick = useCallback(async (productId: string) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'shopee_click', productId })
      })
    } catch {
      // Silent fail — tidak memblokir UX
    }
  }, [])

  // Bagikan outfit set (copy URL)
  const handleShare = useCallback(() => {
    const params = new URLSearchParams()
    SLOT_ORDER.forEach((slot) => {
      if (selectedItems[slot]) params.set(slot, selectedItems[slot]!.slug)
    })
    const shareUrl = `${window.location.origin}/mix-and-match?${params.toString()}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShared(true)
      setTimeout(() => setShared(false), 2500)
    }).catch(() => {
      // Fallback untuk browser yang tidak mendukung clipboard API
      window.prompt('Salin link berikut:', shareUrl)
    })
  }, [selectedItems])

  // Reset semua slot
  const handleReset = useCallback(() => {
    setSelectedItems({ aksesoris: null, atasan: null, bawahan: null, sepatu: null })
    window.history.replaceState(null, '', '/mix-and-match')
  }, [])

  // Auto-pindah ke slot kosong berikutnya setelah equip
  const handleEquipAndAdvance = useCallback((product: Product) => {
    handleEquipProduct(product)
    // Cari slot kosong berikutnya
    const currentIdx = SLOT_ORDER.indexOf(activeSlot)
    for (let i = 1; i < SLOT_ORDER.length; i++) {
      const nextSlot = SLOT_ORDER[(currentIdx + i) % SLOT_ORDER.length]
      if (!selectedItems[nextSlot]) {
        setTimeout(() => setActiveSlot(nextSlot), 600)
        return
      }
    }
  }, [activeSlot, selectedItems, handleEquipProduct])

  // ─────────────────────────────────────────────
  // Hitung total outfit
  // ─────────────────────────────────────────────
  const totalHarga = SLOT_ORDER.reduce((sum, slot) => sum + (selectedItems[slot]?.price || 0), 0)
  const totalItems = SLOT_ORDER.filter((slot) => selectedItems[slot] !== null).length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      {/* ════════════════════════════════════════════
          KANVAS VISUAL OUTFIT (KIRI)
          ════════════════════════════════════════════ */}
      <div className="lg:col-span-5 lg:sticky lg:top-20">
        <div className="relative bg-gradient-to-b from-indigo-50/50 via-purple-50/30 to-pink-50/50 dark:from-slate-900/60 dark:via-slate-950/40 dark:to-slate-950/60 rounded-3xl p-5 md:p-6 shadow-xl border border-purple-100/50 dark:border-slate-800 backdrop-blur-sm overflow-hidden">
          
          {/* Hiasan Latar Glassmorphism */}
          <div className="absolute -top-16 -left-16 w-40 h-40 rounded-full bg-pink-300/20 dark:bg-pink-900/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full bg-indigo-300/20 dark:bg-indigo-900/10 blur-3xl pointer-events-none" />

          {/* Tombol Aksi Kanvas */}
          <div className="flex justify-between items-center mb-5 relative z-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              👗 Outfit Kanvas
            </h2>
            <div className="flex items-center gap-1.5">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleShare}
                disabled={totalItems === 0}
                className="h-7 rounded-full border-purple-200 hover:bg-purple-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-all text-[11px] font-semibold gap-1 px-2.5"
              >
                {shared ? <Check className="h-3 w-3 text-green-500" /> : <Share2 className="h-3 w-3" />}
                {shared ? 'Tersalin!' : 'Bagikan'}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReset}
                disabled={totalItems === 0}
                className="h-7 rounded-full text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-[11px] gap-1 px-2"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </Button>
            </div>
          </div>

          {/* Susunan Slot Vertikal */}
          <div className="flex flex-col gap-3 items-center w-full relative z-10">
            {SLOT_ORDER.map((slotKey) => {
              const config = SLOT_CONFIGS[slotKey]
              const item = selectedItems[slotKey]
              const isActive = activeSlot === slotKey
              const SlotIcon = config.icon

              return (
                <button
                  type="button"
                  key={slotKey}
                  onClick={() => setActiveSlot(slotKey)}
                  aria-pressed={isActive}
                  aria-label={`Slot ${config.label}${item ? `: ${item.title}` : ' (kosong)'}`}
                  className={`w-full h-[90px] md:h-[100px] rounded-2xl cursor-pointer transition-all duration-200 flex items-center p-3 relative text-left ${
                    isActive 
                      ? 'bg-white dark:bg-slate-900 border-2 border-purple-500 shadow-lg ring-2 ring-purple-200/60 dark:ring-purple-900/30' 
                      : 'bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:shadow-sm'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {item ? (
                      <motion.div 
                        key={`filled-${slotKey}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3 w-full h-full"
                      >
                        {/* Gambar Produk */}
                        <div className="relative h-full aspect-square rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 flex-shrink-0 bg-slate-50 dark:bg-slate-800">
                          <Image 
                            src={item.image} 
                            alt={item.title} 
                            fill 
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                        {/* Detail Info */}
                        <div className="flex-1 min-w-0 pr-8">
                          <span className="text-[10px] uppercase font-bold text-purple-500 dark:text-purple-400 tracking-wider">
                            {config.label}
                          </span>
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5 leading-tight">
                            {item.title}
                          </h4>
                          <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                            {formatRupiah(item.price)}
                          </p>
                        </div>
                        {/* Tombol Hapus */}
                        <div 
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleRemoveProduct(slotKey, e)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRemoveProduct(slotKey, e as any) }}
                          className="absolute right-2.5 top-2.5 text-slate-300 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          title="Hapus dari set"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key={`empty-${slotKey}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3.5 w-full h-full"
                      >
                        <div className={`h-full aspect-square rounded-xl flex items-center justify-center border border-dashed flex-shrink-0 transition-colors ${
                          isActive 
                            ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800' 
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                        }`}>
                          <SlotIcon className={`h-5 w-5 ${isActive ? 'text-purple-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        </div>
                        <div className="text-left flex-1">
                          <span className={`text-[10px] uppercase font-bold tracking-wider ${isActive ? 'text-purple-500' : 'text-slate-400'}`}>
                            {config.label}
                          </span>
                          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                            {config.placeholderText}
                          </p>
                        </div>
                        <div className={`p-1 rounded-full border flex-shrink-0 transition-colors ${
                          isActive 
                            ? 'bg-purple-100 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800' 
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}>
                          <Plus className={`h-3 w-3 ${isActive ? 'text-purple-500' : 'text-slate-400'}`} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              )
            })}
          </div>

          {/* ════════════════════════════════════════════
              SUMMARY / TOTAL BELANJA SET
              ════════════════════════════════════════════ */}
          <div className="border-t border-slate-200/50 dark:border-slate-800/80 pt-4 mt-5 relative z-10">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                  Total Set ({totalItems} Item)
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {totalHarga > 0 ? formatRupiah(totalHarga) : 'Rp 0'}
                </p>
              </div>
              {totalHarga > 0 && selectedItems.atasan?.originalPrice && (
                <span className="text-[10px] font-bold bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                  Hemat {formatRupiah(SLOT_ORDER.reduce((sum, slot) => {
                    const item = selectedItems[slot]
                    if (item?.originalPrice && item.originalPrice > item.price) {
                      return sum + (item.originalPrice - item.price)
                    }
                    return sum
                  }, 0))}
                </span>
              )}
            </div>

            {/* Daftar Item + Tombol Beli Shopee */}
            {totalItems > 0 ? (
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
                {SLOT_ORDER.map((slotKey) => {
                  const item = selectedItems[slotKey]
                  if (!item) return null
                  const shopeeLink = item.shopeeUrl || `https://shopee.co.id/search?keyword=${encodeURIComponent(item.title)}`
                  return (
                    <div 
                      key={`summary-${slotKey}`}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="relative h-8 w-8 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800 flex-shrink-0">
                          <Image src={item.image} alt={item.title} fill className="object-cover" sizes="32px" />
                        </div>
                        <span className="font-semibold truncate dark:text-slate-300">
                          {item.title}
                        </span>
                      </div>
                      <a 
                        href={shopeeLink}
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => trackClick(item.id)}
                        className="flex items-center gap-1 font-bold text-[#EE4D2D] hover:underline whitespace-nowrap flex-shrink-0 text-[11px]"
                      >
                        Beli <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )
                })}

                {/* Tombol Beli Semua */}
                {totalItems >= 2 && (
                  <button
                    onClick={() => {
                      SLOT_ORDER.forEach((slot) => {
                        const item = selectedItems[slot]
                        if (item) {
                          trackClick(item.id)
                          const link = item.shopeeUrl || `https://shopee.co.id/search?keyword=${encodeURIComponent(item.title)}`
                          window.open(link, '_blank')
                        }
                      })
                    }}
                    className="w-full mt-1 h-10 text-xs font-bold bg-gradient-to-r from-[#EE4D2D] to-[#FF6742] text-white rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md shadow-[#EE4D2D]/20"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Beli Seluruh Set di Shopee
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-5 bg-white/40 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Pilih produk dari panel di samping untuk mulai mix & match
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          PANEL PEMILIH PRODUK (KANAN)
          ════════════════════════════════════════════ */}
      <div className="lg:col-span-7">
        <div className="bg-white dark:bg-dark-surface rounded-3xl p-5 md:p-6 shadow-md border border-brand-border/50 dark:border-dark-border">
          
          {/* Header Panel & Filter Subkategori */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border dark:border-dark-border pb-4 mb-4">
            <div>
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Memilih: <span className="text-purple-600 dark:text-purple-400">{SLOT_CONFIGS[activeSlot].label}</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Klik produk untuk memasangnya ke slot kanvas
              </p>
            </div>

            {/* Input Pencarian */}
            <div className="relative w-full sm:max-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari warna, bahan..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="pl-9 h-9 text-xs rounded-full border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          {/* Pills Sub-kategori */}
          <div className="flex flex-wrap gap-2 mb-4">
            {SLOT_CONFIGS[activeSlot].subcategories.map((sub, idx) => (
              <button
                key={`${activeSlot}-${sub.label}`}
                type="button"
                onClick={() => setSelectedSubIndex(idx)}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  selectedSubIndex === idx
                    ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* ════════════════════════════════════════════
              GRID LIST PRODUK
              ════════════════════════════════════════════ */}
          <div className="min-h-[340px]">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-slate-50 dark:bg-slate-900 rounded-2xl p-2.5 border border-slate-100 dark:border-slate-800">
                    <div className="bg-slate-200 dark:bg-slate-800 rounded-xl aspect-square w-full" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mt-2.5" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mt-1.5" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 content-start">
                {products.map((product) => {
                  const isEquipped = Object.values(selectedItems).some((item) => item?.id === product.id)
                  const hasDiscount = product.originalPrice && product.originalPrice > product.price
                  const discountPercent = hasDiscount
                    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
                    : 0

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      whileHover={{ y: -3, transition: { duration: 0.15 } }}
                      className={`rounded-2xl p-2.5 border transition-all cursor-pointer flex flex-col relative group ${
                        isEquipped 
                          ? 'bg-purple-50/50 dark:bg-purple-950/10 border-purple-300 dark:border-purple-800 shadow-sm' 
                          : 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-slate-700 hover:shadow-sm'
                      }`}
                      onClick={() => handleEquipAndAdvance(product)}
                    >
                      {/* Gambar Produk */}
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 45vw, 150px"
                        />
                        
                        {/* Badge diskon */}
                        {hasDiscount && (
                          <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                            -{discountPercent}%
                          </span>
                        )}

                        {/* Overlay centang jika terpasang */}
                        {isEquipped && (
                          <div className="absolute inset-0 bg-purple-500/15 dark:bg-purple-900/25 flex items-center justify-center">
                            <span className="bg-purple-600 text-white rounded-full p-1.5 shadow-lg">
                              <Check className="h-4 w-4 stroke-[3]" />
                            </span>
                          </div>
                        )}

                        {/* Hover hint */}
                        {!isEquipped && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100">
                            <span className="text-[10px] font-bold bg-purple-600 text-white px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                              <Plus className="h-3 w-3" /> Pasang
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Detail Info */}
                      <div className="mt-2 text-left">
                        <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 line-clamp-2 leading-tight min-h-[28px]">
                          {product.title}
                        </h4>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {formatRupiah(product.price)}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {formatRupiah(product.originalPrice!)}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <PackageSearch className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Tidak ada produk ditemukan</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-center max-w-[240px]">
                  Coba kata kunci lain atau pilih sub-kategori berbeda
                </p>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════
              PAGINATION
              ════════════════════════════════════════════ */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-brand-border dark:border-dark-border pt-4 mt-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Halaman {page} / {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 w-8 rounded-full border-slate-200 dark:border-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Nomor halaman */}
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`h-8 w-8 rounded-full text-[11px] font-bold transition-colors ${
                        page === pageNum
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 w-8 rounded-full border-slate-200 dark:border-slate-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          TOAST KONFIRMASI EQUIP
          ════════════════════════════════════════════ */}
      <AnimatePresence>
        {equipToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2"
          >
            <Check className="h-4 w-4 text-green-400 dark:text-green-600" />
            Dipasang ke {equipToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────
// Ekspor dengan Suspense boundary
// (wajib karena useSearchParams)
// ─────────────────────────────────────────────
export default function MixMatchBuilder() {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <div className="animate-pulse bg-slate-100 dark:bg-slate-900 rounded-3xl h-[500px]" />
        </div>
        <div className="lg:col-span-7">
          <div className="animate-pulse bg-slate-100 dark:bg-slate-900 rounded-3xl h-[500px]" />
        </div>
      </div>
    }>
      <MixMatchBuilderInner />
    </Suspense>
  )
}
