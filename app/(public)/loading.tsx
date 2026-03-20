import SkeletonCard from '@/components/public/SkeletonCard'
import { Skeleton } from '@/components/ui/skeleton'

export default function HomeLoading() {
    return (
        <>
            {/* Hero skeleton */}
            <div className="min-h-[500px] bg-brand-surface dark:bg-dark-surface flex items-center">
                <div className="container mx-auto px-4 py-20">
                    <div className="max-w-2xl space-y-4">
                        <Skeleton className="h-8 w-48 rounded-full" />
                        <Skeleton className="h-16 w-3/4" />
                        <Skeleton className="h-6 w-2/3" />
                        <div className="flex gap-4 pt-4">
                            <Skeleton className="h-12 w-40" />
                            <Skeleton className="h-12 w-40" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Products skeleton */}
            <div className="container mx-auto px-4 py-16">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64 mb-8" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </div>
        </>
    )
}
