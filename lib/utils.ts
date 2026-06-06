import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import slugifyLib from 'slugify'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}



export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateProductSlug(title: string): string {
  let slug = slugifyLib(title, { lower: true, locale: 'id', strict: true })
  if (slug.length > 100) {
    slug = slug.substring(0, 100).replace(/-+$/, '')
  }
  return slug
}

export { determineProductBadge } from './badge'

