import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us - NovaTrek | Get in Touch',
  description: 'Contact NovaTrek for support, partnerships, or general inquiries. Our team is here to help with your travel planning needs.',
  keywords: 'contact NovaTrek, customer support, travel help, get in touch, support team',
  openGraph: {
    title: 'Contact NovaTrek - We\'re Here to Help',
    description: 'Get in touch with our team for support, partnerships, or general inquiries about our AI-powered travel planning platform.',
    type: 'website',
    url: 'https://novatrek.app/contact',
    images: [
      {
        url: 'https://novatrek.app/og-contact.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact NovaTrek'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact NovaTrek - Get in Touch',
    description: 'Reach out to our team for support, partnerships, or general inquiries.',
    images: ['https://novatrek.app/og-contact.jpg']
  }
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}