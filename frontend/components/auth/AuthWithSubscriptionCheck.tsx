'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useFirebase, signInWithGoogle, signOutUser, getAuthErrorMessage } from '@/lib/firebase'
import { useSubscription } from '@/hooks/use-subscription'

interface AuthWithSubscriptionCheckProps {
  redirectToDashboard?: boolean;
  className?: string;
}

export default function AuthWithSubscriptionCheck({ 
  redirectToDashboard = true,
  className 
}: AuthWithSubscriptionCheckProps) {
  const router = useRouter()
  const { user, loading, isAuthenticated } = useFirebase()
  const { subscription, loading: subLoading, fetchSubscriptionStatus } = useSubscription()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingSubscription, setCheckingSubscription] = useState(false)

  useEffect(() => {
    // Check subscription status after login
    if (isAuthenticated && redirectToDashboard && !checkingSubscription) {
      checkSubscriptionAndRedirect()
    }
  }, [isAuthenticated, redirectToDashboard])

  const checkSubscriptionAndRedirect = async () => {
    setCheckingSubscription(true)
    
    try {
      // Fetch latest subscription status
      await fetchSubscriptionStatus()
      
      // Small delay to ensure subscription state is updated
      setTimeout(() => {
        if (subscription?.status === 'active') {
          router.push('/dashboard')
        } else {
          router.push('/onboarding')
        }
        setCheckingSubscription(false)
      }, 500)
    } catch (error) {
      console.error('Error checking subscription:', error)
      // Default to onboarding on error
      router.push('/onboarding')
      setCheckingSubscription(false)
    }
  }

  const handleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await signInWithGoogle()
      // Subscription check will happen automatically via useEffect
    } catch (error: any) {
      setError(getAuthErrorMessage(error))
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await signOutUser()
      router.push('/')
    } catch (error: any) {
      setError(getAuthErrorMessage(error))
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || (isAuthenticated && checkingSubscription)) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
        <span className="text-sm text-muted-foreground">
          {checkingSubscription ? 'Checking account...' : 'Loading...'}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center gap-4 ${className || ''}`}>
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </div>
      )}
      
      {isAuthenticated ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            {user?.photoURL && (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="h-8 w-8 rounded-full"
              />
            )}
            <div className="text-center">
              <p className="text-sm font-medium">
                {user?.displayName || 'Anonymous User'}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleSignOut}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      ) : (
        <Button 
          onClick={handleSignIn}
          disabled={isLoading}
          size="default"
          className="w-full"
        >
          {isLoading ? 'Signing in...' : 'Sign In with Google'}
        </Button>
      )}
    </div>
  )
}