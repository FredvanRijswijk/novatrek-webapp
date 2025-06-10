import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about NovaTrek\'s mission to revolutionize travel planning with AI technology. Discover our story, values, and the team behind the platform.',
  keywords: 'about NovaTrek, travel planning AI, travel technology, trip planning platform, travel startup',
  openGraph: {
    title: 'About NovaTrek - Revolutionizing Travel Planning',
    description: 'Discover how NovaTrek is using AI to make travel planning smarter, easier, and more personalized for everyone.',
    type: 'website',
    images: [
      {
        url: '/api/og?title=About%20NovaTrek&description=Our%20mission%20to%20revolutionize%20travel%20planning%20with%20AI&theme=bw',
        width: 1200,
        height: 630,
        alt: 'About NovaTrek - Our Mission and Team'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About NovaTrek - AI-Powered Travel Planning',
    description: 'Learn how NovaTrek is revolutionizing travel planning with AI technology.',
    images: ['/api/og?title=About%20NovaTrek&description=Our%20mission%20to%20revolutionize%20travel%20planning%20with%20AI&theme=bw']
  }
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}