export interface BadgeProductInput {
  badge: string | null;
  createdAt: Date | string;
  viewCount: number;
}

/**
 * Dynamically determines the public badge for a product based on its DB badge,
 * creation date, and view count.
 * 
 * Rules:
 * 1. If DB badge is 'NEW':
 *    - Age < 3 days: 'NEW'
 *    - Age >= 3 days: Falls through to next checks (treated as null badge, which becomes 'BEST SELLER' if viewCount > 0, else null)
 * 2. If DB badge is 'HOT':
 *    - Always 'HOT'
 * 3. If DB badge is anything else (or null):
 *    - If viewCount > 0: 'BEST SELLER'
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

  if (viewCount > 0) {
    return 'BEST SELLER';
  }

  return null;
}
