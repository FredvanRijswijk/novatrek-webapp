import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read NovaTrek\'s terms of service. Understand your rights and responsibilities when using our AI-powered travel planning platform.',
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title: 'Terms of Service - NovaTrek',
    description: 'Terms and conditions for using NovaTrek\'s travel planning services.',
    type: 'website'
  }
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}