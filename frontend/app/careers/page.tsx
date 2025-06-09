'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { PublicLayout } from '@/components/layout/PublicLayout'

export default function CareersPage() {
  return (
    <PublicLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Join Our Growing Team</h1>
        <p className="text-xl text-muted-foreground mb-8">
          We're always looking for talented individuals who are passionate about 
          travel and technology. Check back soon for open positions.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/contact">
              Get in Touch
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
      </div>
    </PublicLayout>
  )
}