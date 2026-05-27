import { Metadata } from 'next'
import MixMatchBuilder from '@/components/public/MixMatchBuilder'

export const metadata: Metadata = {
  title: 'Mix & Match Outfit Builder - Roxy Store',
  description: 'Padupadankan outfit hijab, atasan, bawahan, tas, dan sepatu secara visual dan temukan gaya OOTD terbaikmu sebelum belanja di Shopee.',
  openGraph: {
    title: 'Mix & Match Outfit Builder - Roxy Store',
    description: 'Padupadankan outfit hijab, atasan, bawahan, tas, dan sepatu secara visual dan temukan gaya OOTD terbaikmu sebelum belanja di Shopee.',
    type: 'website',
  },
}

export default function MixMatchPage() {
  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
      <div className="mb-6 md:mb-10 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-500">
          Mix & Match Outfit Builder ✨
        </h1>
        <p className="mt-2 text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Ciptakan kombinasi pakaian impianmu secara visual. Pilih hijab/aksesoris, atasan, bawahan, dan sepatu terbaik, lalu temukan produk aslinya di Shopee!
        </p>
      </div>
      <MixMatchBuilder />
    </div>
  )
}
