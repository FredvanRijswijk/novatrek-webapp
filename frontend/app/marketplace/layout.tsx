import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Travel Expert Marketplace',
  description: 'Browse curated trip templates and connect with verified travel experts. Find the perfect itinerary or get custom planning services from local experts worldwide.',
  keywords: 'travel marketplace, trip templates, travel experts, custom itineraries, travel planning services, local travel guides',
  openGraph: {
    title: 'NovaTrek Marketplace - Discover Amazing Trips & Travel Experts',
    description: 'Browse expert-created trip templates and connect with verified travel professionals for your perfect journey.',
    type: 'website',
    images: [
      {
        url: '/api/og?title=Travel%20Expert%20Marketplace&description=Connect%20with%20verified%20travel%20experts%20worldwide&page=marketplace',
        width: 1200,
        height: 630,
        alt: 'NovaTrek Travel Expert Marketplace'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NovaTrek Marketplace - Expert Travel Planning',
    description: 'Find trip templates and connect with verified travel experts for your next adventure.',
    images: ['/api/og?title=Travel%20Expert%20Marketplace&description=Connect%20with%20verified%20travel%20experts%20worldwide&page=marketplace']
  }
}

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}