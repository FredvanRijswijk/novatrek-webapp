import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your NovaTrek account to access your trips, saved itineraries, and personalized travel recommendations.',
  robots: {
    index: false,
    follow: false
  },
  openGraph: {
    title: 'Login to NovaTrek',
    description: 'Access your personalized travel planning dashboard.',
    type: 'website',
    images: [
      {
        url: '/api/og?title=Welcome%20Back&description=Sign%20in%20to%20your%20travel%20dashboard',
        width: 1200,
        height: 630,
        alt: 'NovaTrek Login'
      }
    ]
  }
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}