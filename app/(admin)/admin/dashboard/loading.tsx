import React from 'react'

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-4 w-36 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface p-6 flex items-center justify-between"
          >
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded-lg" />
              <div className="h-3.5 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
            <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>

      {/* Grid Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Top Products Card Skeleton */}
          <div className="rounded-xl border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface p-6 space-y-4">
            <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border-b border-brand-border/10 last:border-0">
                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-1/4 bg-gray-100 dark:bg-gray-800 rounded" />
                  </div>
                  <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Today Activity Metrics Skeleton */}
          <div className="rounded-xl border border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface p-6 space-y-4">
            <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-gray-50 dark:bg-gray-900/10 p-4 space-y-2">
                  <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="h-4 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Activity Feed Skeleton */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-brand-border/60 bg-white dark:bg-dark-surface p-6 space-y-4">
            <div className="space-y-1">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="h-3 w-44 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
            
            {/* Filter segments & search bars */}
            <div className="space-y-3">
              <div className="h-9 w-full bg-gray-100 dark:bg-gray-800 rounded-xl" />
              <div className="h-9 w-full bg-gray-50 dark:bg-gray-900/40 rounded-xl" />
            </div>

            {/* List entries */}
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3.5 border border-brand-border/40 rounded-xl">
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-12 bg-gray-100 dark:bg-gray-800 rounded" />
                    </div>
                    <div className="h-3 w-full bg-gray-150 dark:bg-gray-700/60 rounded" />
                    <div className="h-6 w-full bg-gray-50 dark:bg-gray-900/30 rounded-lg" />
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-gray-100 dark:bg-gray-800 rounded-full" />
                      <div className="h-5 w-20 bg-gray-100 dark:bg-gray-800 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
