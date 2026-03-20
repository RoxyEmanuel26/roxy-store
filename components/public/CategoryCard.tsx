import Link from 'next/link'
import { Key, Gem, Smartphone, Sparkles, Star, ShoppingBag } from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
    'gantungan kunci': <Key className="h-10 w-10" />,
    'beads bracelet': <Gem className="h-10 w-10" />,
    'beads hp': <Smartphone className="h-10 w-10" />,
    'kalung': <Sparkles className="h-10 w-10" />,
    'anting': <Star className="h-10 w-10" />,
}

interface CategoryCardProps {
    category: {
        id: string
        name: string
        slug: string
        _count?: { products: number }
    }
}

export default function CategoryCard({ category }: CategoryCardProps) {
    const icon = iconMap[category.name.toLowerCase()] || <ShoppingBag className="h-10 w-10" />

    return (
        <Link href={`/category/${category.slug}`}>
            <div className="group flex flex-col items-center p-6 bg-brand-surface dark:bg-dark-surface rounded-2xl hover:bg-brand-primary hover:shadow-lg hover:shadow-brand-primary/20 transition-all duration-300 cursor-pointer">
                <div className="text-brand-primary group-hover:text-white transition-colors">
                    {icon}
                </div>
                <span className="mt-3 text-sm font-semibold text-center text-brand-text dark:text-dark-text group-hover:text-white transition-colors">
                    {category.name}
                </span>
                <span className="text-xs text-brand-muted group-hover:text-white/80 mt-1 transition-colors">
                    {category._count?.products || 0} produk
                </span>
            </div>
        </Link>
    )
}
