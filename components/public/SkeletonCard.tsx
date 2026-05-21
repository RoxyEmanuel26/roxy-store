import { Skeleton } from '@/components/ui/skeleton'

export default function SkeletonCard() {
    return (
        <div className="bg-white dark:bg-dark-surface rounded-2xl overflow-hidden shadow-sm border border-brand-border/50 dark:border-dark-border flex flex-col h-full animate-pulse">
            {/* Aspect-square image skeleton — matches ProductCard */}
            <div className="relative aspect-square w-full overflow-hidden flex-shrink-0">
                <Skeleton className="w-full h-full absolute inset-0" />
            </div>

            {/* Content skeleton */}
            <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-0">
                {/* Category */}
                <Skeleton className="h-3 w-16 rounded" />
                {/* Title — matches 3.85rem min height */}
                <div className="mt-1.5 overflow-hidden" style={{ height: '3.85rem' }}>
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
