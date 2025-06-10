import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how NovaTrek collects, uses, and protects your personal information. Our commitment to your privacy and data security.',
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title: 'Privacy Policy - NovaTrek',
    description: 'Learn how NovaTrek protects your personal information and respects your privacy.',
    type: 'website'
  }
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}