import { PublicLayout } from '@/components/layout/PublicLayout'

export default function PublicPagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PublicLayout>{children}</PublicLayout>
}