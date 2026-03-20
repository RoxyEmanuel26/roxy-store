import { Skeleton } from '@/components/ui/skeleton'

export function SkeletonProductDetail() {
    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb skeleton */}
            <div className="flex gap-2 mb-6">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Gallery skeleton */}
                <div>
                    <Skeleton className="aspect-square w-full rounded-2xl" />
                    <div className="flex gap-2 mt-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="w-16 h-16 rounded-lg" />
                        ))}
                    </div>
                </div>

                {/* Info skeleton */}
                <div className="space-y-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-px w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-px w-full" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <div className="flex gap-3">
                        <Skeleton className="h-12 flex-1 rounded-xl" />
                        <Skeleton className="h-12 flex-1 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    )
}
