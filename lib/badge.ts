import { prisma } from './prisma'

export interface BadgeProductInput {
  id?: string;
  badge: string | null;
  createdAt: Date | string;
  viewCount: number;
}

let cachedTop10Ids: string[] = []
let lastFetched = 0
let isFetching = false

async function updateBestSellerCache() {
  if (isFetching) return
  isFetching = true
  try {
    const topProducts = await prisma.product.findMany({
      where: { isActive: true, viewCount: { gt: 0 } },
      orderBy: { viewCount: 'desc' },
      take: 10,
      select: { id: true }
    })
    cachedTop10Ids = topProducts.map((p) => p.id)
    lastFetched = Date.now()
  } catch (err) {
    console.error('Failed to update best seller badge cache:', err)
  } finally {
    isFetching = false
  }
}

/**
 * Dynamically determines the public badge for a product based on its DB badge,
 * creation date, and view count.
 * 
 * Rules:
 * 1. If DB badge is 'NEW':
 *    - Age < 3 days: 'NEW'
 *    - Age >= 3 days: Falls through to next checks
 * 2. If DB badge is 'HOT':
 *    - Always 'HOT'
 * 3. If DB badge is anything else (or null):
 *    - If viewCount > 0 and the product is in the top 10 most viewed: 'BEST SELLER'
 *    - Else: null
 */
export function determineProductBadge(product: BadgeProductInput): string | null {
  const badgeDb = product.badge;
  const createdAt = typeof product.createdAt === 'string' ? new Date(product.createdAt) : product.createdAt;
  const viewCount = product.viewCount || 0;

  if (badgeDb === 'NEW') {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    if (createdAt >= threeDaysAgo) {
      return 'NEW';
    }
    // Falls through to next checks! Older than 3 days means it is a regular product.
  }

  if (badgeDb === 'HOT') {
    return 'HOT';
  }

  // Trigger background update of top 10 popular product IDs every 60 seconds
  if (typeof window === 'undefined') {
    if (Date.now() - lastFetched > 60000) {
      updateBestSellerCache().catch(() => {})
    }
  }

  // BEST SELLER badge is dynamically shown only if the product is in the top 10 by viewCount
  // and has at least 1 view.
  if (product.id && cachedTop10Ids.includes(product.id) && viewCount > 0) {
    return 'BEST SELLER';
  }

  return null;
}
