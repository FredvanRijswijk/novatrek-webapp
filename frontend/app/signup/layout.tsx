import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your free NovaTrek account and start planning your perfect trip with AI-powered recommendations and expert advice.',
  openGraph: {
    title: 'Sign Up for NovaTrek - Start Planning Your Perfect Trip',
    description: 'Join thousands of travelers using AI to plan unforgettable trips. Free to start.',
    type: 'website',
    images: [
      {
        url: '/api/og?title=Join%20NovaTrek%20Today&description=Start%20planning%20amazing%20trips%20with%20AI',
        width: 1200,
        height: 630,
        alt: 'Join NovaTrek'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign Up for NovaTrek',
    description: 'Start planning your perfect trip with AI. Free to join.',
    images: ['/api/og?title=Join%20NovaTrek%20Today&description=Start%20planning%20amazing%20trips%20with%20AI']
  }
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}