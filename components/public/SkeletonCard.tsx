import { Skeleton } from '@/components/ui/skeleton'

export default function SkeletonCard() {
    return (
        <div className="bg-white dark:bg-dark-surface rounded-2xl overflow-hidden shadow-sm border border-brand-border/50 dark:border-dark-border flex flex-col h-full animate-pulse">
            {/* Fixed height image skeleton — matches ProductCard */}
            <div className="w-full flex-shrink-0" style={{ height: '180px' }}>
                <Skeleton className="w-full h-full" />
            </div>

            {/* Content skeleton */}
            <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-0">
                {/* Category */}
                <Skeleton className="h-3 w-16 rounded" />
                {/* Title — matches 2.625rem fixed height */}
                <div className="mt-1.5 overflow-hidden" style={{ height: '2.625rem' }}>
                    <Skeleton className="h-[13px] w-full rounded mb-1.5" />
                    <Skeleton className="h-[13px] w-3/4 rounded" />
                </div>
                {/* Price */}
                <Skeleton className="h-4 w-20 rounded mt-2" />
                {/* View count */}
                <Skeleton className="h-3 w-14 rounded mt-1.5" />
                {/* Spacer */}
                <div className="flex-1" />
                {/* Button */}
                <Skeleton className="h-8 w-full rounded-xl mt-3" />
            </div>
        </div>
    )
}
