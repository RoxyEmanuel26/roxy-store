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
        <Link 
            href={`/kategori/${category.slug}`} 
            className="block h-full border-r border-b border-gray-100 dark:border-dark-border group/card bg-white dark:bg-dark-surface hover:shadow-[0_0_8px_rgba(0,0,0,0.08)] hover:z-10 transition-all duration-200 relative w-[100px] md:w-[130px]"
        >
            <div className="h-full flex flex-col items-center justify-start p-3 md:p-4">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 dark:bg-dark-bg rounded-full flex items-center justify-center group-hover/card:scale-105 transition-transform mb-2 overflow-hidden">
                    {isImage ? (
                        <img src={icon} alt={category.name} className="w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-sm" />
                    ) : (
                        <span className="text-3xl md:text-4xl leading-none">{icon}</span>
                    )}
                </div>
                <div className="flex flex-col items-center w-full mt-1">
                    <span className="text-[11px] md:text-sm font-medium text-center text-brand-text dark:text-dark-text group-hover/card:text-brand-primary transition-colors line-clamp-2 leading-tight">
                        {category.name}
                    </span>
                </div>
            </div>
        </Link>
    )
}
