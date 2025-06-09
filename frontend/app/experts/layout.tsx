import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Travel Experts - NovaTrek | Find Your Perfect Travel Planner',
  description: 'Connect with certified travel experts, local guides, and trip planning specialists. Browse profiles, read reviews, and book consultations for your next adventure.',
  keywords: 'travel experts, trip planners, local guides, travel consultants, vacation planning, travel advisors',
  openGraph: {
    title: 'Travel Experts | NovaTrek',
    description: 'Connect with certified travel experts for personalized trip planning',
    type: 'website',
    url: 'https://novatrek.app/experts',
    images: [
      {
        url: 'https://novatrek.app/og-experts.jpg',
        width: 1200,
        height: 630,
        alt: 'NovaTrek Travel Experts'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Travel Experts | NovaTrek',
    description: 'Connect with certified travel experts for personalized trip planning',
    images: ['https://novatrek.app/og-experts.jpg']
  }
}

export default function ExpertsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}