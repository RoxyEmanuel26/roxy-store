import SkeletonCard from '@/components/public/SkeletonCard'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProductsLoading() {
    return (
        <div className="container mx-auto px-4 py-6 md:py-8">
            {/* Header skeleton */}
            <div className="mb-6 md:mb-8">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-36" />
            </div>

            <div className="flex gap-8">
                {/* Sidebar skeleton (desktop) */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                    <div className="space-y-5">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-px w-full" />
                        {/* Category items */}
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-20" />
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                    <Skeleton className="h-4 w-4 rounded" />
                                    <Skeleton className="h-3.5 w-24" />
                                    <div className="flex-1" />
                                    <Skeleton className="h-3 w-5" />
                                </div>
                            ))}
                        </div>
                        <Skeleton className="h-px w-full" />
                        {/* Price range */}
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-2 w-full rounded-full mt-6" />
                            <div className="flex gap-2">
                                <Skeleton className="h-8 flex-1" />
                                <Skeleton className="h-8 flex-1" />
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main content skeleton */}
                <div className="flex-1 min-w-0">
                    {/* Toolbar skeleton */}
                    <div className="space-y-3 mb-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-10 flex-1 max-w-sm" />
                            <Skeleton className="h-10 w-20 lg:hidden" />
                        </div>
                        {/* Sort pills */}
                        <div className="flex gap-2 overflow-hidden">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-8 w-28 rounded-full flex-shrink-0" />
                            ))}
                        </div>
                    </div>

                    {/* Product grid skeleton */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
