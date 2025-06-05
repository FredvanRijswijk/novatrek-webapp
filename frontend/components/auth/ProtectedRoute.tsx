'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFirebase } from '@/lib/firebase/context'
import { useSubscription } from '@/hooks/use-subscription'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireSubscription?: boolean
}

export default function ProtectedRoute({ 
  children, 
  requireSubscription = true 
}: ProtectedRouteProps) {
  const router = useRouter()
  const { user, loading: authLoading, isAuthenticated } = useFirebase()
  const { subscription, loading: subLoading } = useSubscription()

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return

    // If not authenticated, redirect to home
    if (!isAuthenticated) {
      router.push('/')
      return
    }

    // If subscription is required and still loading, wait
    if (requireSubscription && subLoading) return

    // If subscription is required but user doesn't have active subscription
    if (requireSubscription && subscription?.status !== 'active') {
      router.push('/onboarding')
      return
    }
  }, [authLoading, isAuthenticated, subLoading, subscription, requireSubscription, router])

  // Show loading state
  if (authLoading || (requireSubscription && subLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Don't render if subscription is required but not active
  if (requireSubscription && subscription?.status !== 'active') {
    return null
  }

  return <>{children}</>
}