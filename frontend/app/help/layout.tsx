import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Get help with NovaTrek. Find answers to common questions, learn how to use our AI travel planner, and contact our support team.',
  keywords: 'NovaTrek help, travel planning help, support, FAQ, how to use NovaTrek, travel planning guide',
  openGraph: {
    title: 'NovaTrek Help Center - Get Support & Answers',
    description: 'Find answers to common questions and learn how to make the most of NovaTrek\'s AI-powered travel planning features.',
    type: 'website',
    images: [
      {
        url: '/api/og?title=Help%20Center&description=Get%20support%20and%20find%20answers&page=help',
        width: 1200,
        height: 630,
        alt: 'NovaTrek Help Center'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NovaTrek Help Center',
    description: 'Get help with AI-powered travel planning. Find answers and contact support.',
    images: ['/api/og?title=Help%20Center&description=Get%20support%20and%20find%20answers&page=help']
  }
}

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}