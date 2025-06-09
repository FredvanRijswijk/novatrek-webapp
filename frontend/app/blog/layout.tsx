import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog - NovaTrek | Travel Tips & Stories',
  description: 'Discover travel tips, destination guides, and stories from the NovaTrek community.',
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}