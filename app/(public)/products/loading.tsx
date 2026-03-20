import SkeletonCard from '@/components/public/SkeletonCard'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProductsLoading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </div>
    )
}
