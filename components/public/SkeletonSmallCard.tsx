import { Skeleton } from '@/components/ui/skeleton'

export default function SkeletonSmallCard() {
    return (
        <div className="bg-white dark:bg-dark-surface rounded-xl overflow-hidden shadow-sm flex flex-col h-full border border-brand-border/50 dark:border-dark-border animate-pulse">
            {/* Image — portrait ratio 3:4 */}
            <div className="relative w-full overflow-hidden flex-shrink-0" style={{ aspectRatio: '3/4' }}>
                <Skeleton className="w-full h-full absolute inset-0" />
            </div>

            {/* Content skeleton */}
            <div className="px-2.5 pt-2 pb-2.5 min-w-0 flex flex-col flex-1">
                {/* Category */}
                <Skeleton className="h-2.5 w-12 rounded" />

                {/* Title — matches 2.15rem min height */}
                <div className="mt-1" style={{ height: '2.15rem' }}>
                    <Skeleton className="h-2.5 w-full rounded mb-1" />
                    <Skeleton className="h-2.5 w-4/5 rounded" />
                </div>

                {/* Price */}
                <Skeleton className="h-3 w-16 rounded mt-1.5" />

                {/* View count */}
                <Skeleton className="h-2.5 w-10 rounded mt-1" />
            </div>
        </div>
    )
}
