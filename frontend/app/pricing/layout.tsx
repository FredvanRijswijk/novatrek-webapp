import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Choose the perfect plan for your travel needs. Start free with AI-powered trip planning, upgrade for unlimited features. No hidden fees.',
  keywords: 'NovaTrek pricing, travel planning pricing, subscription plans, free trial, AI travel planner cost',
  openGraph: {
    title: 'NovaTrek Pricing - Start Planning for Free',
    description: 'Simple, transparent pricing for AI-powered travel planning. Free plan available with unlimited trip creation.',
    type: 'website',
    images: [
      {
        url: '/api/og?title=Simple%20Pricing%20Plans&description=Start%20free%2C%20upgrade%20anytime.%20No%20hidden%20fees&page=pricing',
        width: 1200,
        height: 630,
        alt: 'NovaTrek Pricing Plans'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NovaTrek Pricing - Simple & Transparent',
    description: 'Choose the perfect plan for your travel needs. Start free today.',
    images: ['/api/og?title=Simple%20Pricing%20Plans&description=Start%20free%2C%20upgrade%20anytime.%20No%20hidden%20fees&page=pricing']
  }
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}