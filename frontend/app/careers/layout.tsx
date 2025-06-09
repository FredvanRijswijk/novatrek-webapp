import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers - NovaTrek | Join Our Team',
  description: 'Join the NovaTrek team and help us revolutionize travel planning with AI.',
}

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}