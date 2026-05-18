import Link from 'next/link'

interface CategoryCardProps {
    category: {
        id: string
        name: string
        slug: string
        description?: string | null
        icon?: string | null
        _count?: { products: number }
    }
}

export default function CategoryCard({ category }: CategoryCardProps) {
    const icon = category.icon || '🛍️'
    const isImage = icon.startsWith('http')

    return (
        <Link href={`/kategori/${category.slug}`} className="block h-full">
            <div className="h-full group flex flex-col items-center justify-between p-4 md:p-6 bg-brand-surface dark:bg-dark-surface rounded-2xl hover:bg-brand-primary hover:shadow-lg hover:shadow-brand-primary/20 transition-all duration-300 cursor-pointer">
                <div className="w-20 h-20 md:w-36 md:h-36 flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
                    {isImage ? (
                        <img src={icon} alt={category.name} className="w-full h-full object-contain drop-shadow-sm" />
                    ) : (
                        <span className="text-[60px] md:text-[100px] leading-none">{icon}</span>
                    )}
                </div>
                <div className="flex flex-col items-center w-full">
                    <span className="text-sm font-semibold text-center text-brand-text dark:text-dark-text group-hover:text-white transition-colors line-clamp-2">
                        {category.name}
                    </span>
                    <span className="text-xs text-brand-muted group-hover:text-white/80 mt-1 transition-colors">
                        {category._count?.products || 0} produk
                    </span>
                </div>
            </div>
        </Link>
    )
}
