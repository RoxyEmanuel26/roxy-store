/**
 * Custom Cloudinary Image Loader for Next.js
 * 
 * Bypasses Vercel's Image Optimization (limited to 5K transformations/month on Hobby plan)
 * and uses Cloudinary's own transformation pipeline instead (25K free/month).
 * 
 * This loader intercepts all `next/image` src URLs and:
 * - If the URL is from Cloudinary → applies Cloudinary's native transformations (w_, f_auto, q_auto)
 * - If the URL is from other origins → passes through to Vercel's default optimization
 */

// Cloudinary cloud name from environment
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkfpvxu1h'

// Regex to match Cloudinary URLs and extract the path after /upload/
const CLOUDINARY_REGEX = /^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(.+)$/

/**
 * Strips any existing Cloudinary transformations from the path.
 * e.g., "w_800,f_auto/v1/folder/image.jpg" → "v1/folder/image.jpg"
 */
function stripExistingTransformations(path: string): string {
  // Cloudinary transformation segments contain commas or known prefixes
  // Split by '/' and skip segments that look like transformations
  const segments = path.split('/')
  const cleanSegments: string[] = []
  let foundNonTransform = false

  for (const segment of segments) {
    if (foundNonTransform) {
      cleanSegments.push(segment)
      continue
    }

    // Transformation segments typically contain commas or start with known prefixes
    const isTransformation = segment.includes(',') ||
      /^[a-z]_/.test(segment) ||
      /^(c|w|h|f|q|e|l|o|r|t|x|y|z|ac|ar|bo|co|dpr|du|fl|g|if|ki|pg|so|sp|vc)_/.test(segment)

    if (!isTransformation) {
      foundNonTransform = true
      cleanSegments.push(segment)
    }
  }

  return cleanSegments.join('/')
}

interface ImageLoaderParams {
  src: string
  width: number
  quality?: number
}

export default function cloudinaryLoader({ src, width, quality }: ImageLoaderParams): string {
  // If it's a Shopee CDN URL, return it directly to bypass Vercel/Cloudinary optimization completely
  if (src.includes('susercontent.com') || src.includes('shopee.co.id')) {
    return src
  }

  // Only transform Cloudinary URLs
  const match = src.match(CLOUDINARY_REGEX)

  if (!match) {
    // Non-Cloudinary URLs: return as-is (Next.js will handle them normally)
    // This covers unsplash, google avatars, etc.
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`
  }

  // Extract the path after /upload/
  const rawPath = match[1]

  // Strip any existing transformations to avoid double-transforming
  const cleanPath = stripExistingTransformations(rawPath)

  // Build Cloudinary transformation URL
  // f_auto: automatic format (WebP/AVIF based on browser support)
  // q_auto: automatic quality optimization
  // w_[width]: resize to requested width
  const transformations = `w_${width},f_auto,q_${quality || 'auto'}`

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformations}/${cleanPath}`
}
