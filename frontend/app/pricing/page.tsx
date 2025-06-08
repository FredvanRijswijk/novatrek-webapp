'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the new pricing page
    router.replace('/dashboard/settings/pricing')
  }, [router])
  
  return null
}