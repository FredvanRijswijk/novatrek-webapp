'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { PublicLayout } from '@/components/layout/PublicLayout'

export default function BlogPage() {
  return (
    <PublicLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Travel Blog Coming Soon</h1>
        <p className="text-xl text-muted-foreground mb-8">
          We're working on bringing you the best travel tips, destination guides, 
          and stories from our community of travelers and experts.
        </p>
        <Button asChild>
          <Link href="/">
            Back to Home
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      </div>
    </PublicLayout>
  )
}