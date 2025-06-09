import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing - NovaTrek | Simple, Transparent Pricing',
  description: 'Choose the perfect plan for your travel needs. Start free, upgrade anytime. No hidden fees.',
  keywords: 'NovaTrek pricing, travel planning pricing, subscription plans, free trial',
  openGraph: {
    title: 'NovaTrek Pricing - Start Planning for Free',
    description: 'Simple, transparent pricing for AI-powered travel planning. Free plan available.',
    type: 'website',
    url: 'https://novatrek.app/pricing',
    images: [
      {
        url: 'https://novatrek.app/og-pricing.jpg',
        width: 1200,
        height: 630,
        alt: 'NovaTrek Pricing'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NovaTrek Pricing - Simple & Transparent',
    description: 'Choose the perfect plan for your travel needs. Start free today.',
    images: ['https://novatrek.app/og-pricing.jpg']
  }
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}