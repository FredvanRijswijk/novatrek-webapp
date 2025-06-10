import { Metadata } from 'next'
import { getTripShare } from '@/lib/firebase/sharing'

type Props = {
  params: Promise<{ token: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  
  try {
    // Try to get trip details for metadata
    const shareData = await getTripShare(token)
    
    if (shareData && shareData.metadata) {
      const { tripName, destinations, duration } = shareData.metadata
      const destinationList = destinations?.join(',') || 'Amazing destinations'
      
      // Create dynamic OG image URL with trip details
      const ogImageUrl = `/api/og/trip?name=${encodeURIComponent(tripName || 'Shared Trip')}&destinations=${encodeURIComponent(destinationList)}&duration=${encodeURIComponent(duration || 'Multiple days')}`
      
      return {
        title: tripName || 'Shared Trip',
        description: `Check out this amazing trip to ${destinations?.join(', ') || 'multiple destinations'}. Created with NovaTrek's AI-powered travel planner.`,
        openGraph: {
          title: tripName || 'Shared Trip on NovaTrek',
          description: `Explore this ${duration || 'multi-day'} trip to ${destinations?.join(', ') || 'amazing destinations'}`,
          type: 'website',
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: `${tripName} - NovaTrek Trip`
            }
          ]
        },
        twitter: {
          card: 'summary_large_image',
          title: tripName || 'Shared Trip on NovaTrek',
          description: `Check out this trip to ${destinations?.join(', ') || 'multiple destinations'}`,
          images: [ogImageUrl]
        },
        robots: {
          index: true,
          follow: true
        }
      }
    }
  } catch (error) {
    console.error('Error generating metadata for shared trip:', error)
  }
  
  // Fallback metadata
  return {
    title: 'Shared Trip',
    description: 'View this shared trip created with NovaTrek\'s AI-powered travel planner.',
    openGraph: {
      title: 'Shared Trip on NovaTrek',
      description: 'Explore this amazing trip created with AI-powered travel planning.',
      images: ['/api/og?title=Shared%20Trip&description=View%20this%20amazing%20travel%20itinerary']
    }
  }
}

export default function SharedTripLayout({ children }: { children: React.ReactNode }) {
  return children
}