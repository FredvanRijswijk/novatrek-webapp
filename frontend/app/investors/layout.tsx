import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Investors - NovaTrek | Invest in the Future of Travel',
  description: 'Join NovaTrek\'s journey to revolutionize travel planning with AI. Explore investment opportunities in the fastest-growing travel tech startup.',
  keywords: 'invest in NovaTrek, travel tech investment, AI startup, Series A, venture capital, travel technology',
  openGraph: {
    title: 'Invest in NovaTrek - The Future of AI-Powered Travel',
    description: 'Discover investment opportunities with NovaTrek, the AI-powered travel planning platform revolutionizing how people explore the world.',
    type: 'website',
    url: 'https://novatrek.app/investors',
    images: [
      {
        url: 'https://novatrek.app/og-investors.jpg',
        width: 1200,
        height: 630,
        alt: 'NovaTrek Investors'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Invest in NovaTrek - AI-Powered Travel Platform',
    description: 'Join us in revolutionizing travel planning with AI technology.',
    images: ['https://novatrek.app/og-investors.jpg']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  }
}

export default function InvestorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}