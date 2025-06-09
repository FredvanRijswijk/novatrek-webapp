/**
 * Generate a URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
}

/**
 * Generate a unique slug by appending a number if necessary
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug
  let counter = 1
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

/**
 * Format location for display
 */
export function formatLocation(location?: { city?: string; state?: string; country?: string }): string {
  if (!location) return ''
  
  const parts = []
  if (location.city) parts.push(location.city)
  if (location.state) parts.push(location.state)
  if (location.country) parts.push(location.country)
  
  return parts.join(', ')
}

/**
 * Generate meta description from bio
 */
export function generateMetaDescription(bio?: string, maxLength = 160): string {
  if (!bio) return ''
  
  const cleanBio = bio.replace(/\s+/g, ' ').trim()
  
  if (cleanBio.length <= maxLength) {
    return cleanBio
  }
  
  // Find the last complete word within the limit
  const truncated = cleanBio.substring(0, maxLength - 3)
  const lastSpace = truncated.lastIndexOf(' ')
  
  return truncated.substring(0, lastSpace) + '...'
}