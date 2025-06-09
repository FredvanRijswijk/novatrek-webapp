import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Marketplace - NovaTrek | Trip Templates & Travel Experts',
  description: 'Browse curated trip templates and connect with verified travel experts. Find the perfect itinerary or get custom planning services.',
  keywords: 'travel marketplace, trip templates, travel experts, custom itineraries, travel planning services',
  openGraph: {
    title: 'NovaTrek Marketplace - Discover Amazing Trips',
    description: 'Browse expert-created trip templates and connect with travel professionals for your perfect journey.',
    type: 'website',
    url: 'https://novatrek.app/marketplace',
    images: [
      {
        url: 'https://novatrek.app/og-marketplace.jpg',
        width: 1200,
        height: 630,
        alt: 'NovaTrek Marketplace'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NovaTrek Marketplace - Expert Travel Planning',
    description: 'Find trip templates and travel experts for your next adventure.',
    images: ['https://novatrek.app/og-marketplace.jpg']
  }
}

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}