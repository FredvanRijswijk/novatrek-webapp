import { MetadataRoute } from 'next'
import { MarketplaceModel } from '@/lib/models/marketplace'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://novatrek.app'
  
  try {
    // Get all active experts
    const experts = await MarketplaceModel.getActiveExperts(1000) // Get more experts for sitemap
    
    // Create sitemap entries for each expert
    const expertUrls = experts.map((expert) => ({
      url: `${baseUrl}/experts/${expert.slug}`,
      lastModified: expert.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
    
    // Add the main experts listing page
    return [
      {
        url: `${baseUrl}/experts`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      ...expertUrls,
    ]
  } catch (error) {
    console.error('Error generating experts sitemap:', error)
    // Return just the main page if there's an error
    return [
      {
        url: `${baseUrl}/experts`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
    ]
  }
}