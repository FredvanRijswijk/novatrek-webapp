'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFirebase } from '@/lib/firebase/context'
import { MarketplaceModel } from '@/lib/models/marketplace'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'

export default function OnboardingCompletePage() {
  const router = useRouter()
  const { user } = useFirebase()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'checking' | 'complete' | 'incomplete'>('checking')
  const [error, setError] = useState('')

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!user) return

      try {
        const expert = await MarketplaceModel.getExpertByUserId(user.uid)
        if (!expert) {
          router.push('/dashboard/become-expert')
          return
        }

        // Check with Stripe if onboarding is complete
        const idToken = await user.getIdToken()
        const response = await fetch(`/api/marketplace/seller/onboard?account_id=${expert.stripeConnectAccountId}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify onboarding')
        }

        if (data.complete) {
          setStatus('complete')
        } else {
          setStatus('incomplete')
        }
      } catch (error) {
        console.error('Error checking onboarding:', error)
        setError('Failed to verify onboarding status')
        setStatus('incomplete')
      } finally {
        setLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [user, router])

  if (loading || status === 'checking') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Verifying your account setup...</p>
        </div>
      </div>
    )
  }

  if (status === 'complete') {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Account Setup Complete!
            </CardTitle>
            <CardDescription>
              You're all set to start selling on NovaTrek
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Congratulations! Your Stripe Connect account is active and ready to accept payments.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold">What's Next?</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Complete your expert profile</li>
                  <li>Create your first trip template or service</li>
                  <li>Set your availability and pricing</li>
                  <li>Start earning with NovaTrek!</li>
                </ul>
              </div>
            </div>

            <Button 
              onClick={() => router.push('/dashboard/expert')}
              size="lg"
              className="w-full"
            >
              Go to Expert Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            Onboarding Incomplete
          </CardTitle>
          <CardDescription>
            Please complete all required steps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription>
              It looks like you haven't completed all the required onboarding steps with Stripe.
              Please click below to continue where you left off.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => router.push('/dashboard/expert/onboarding')}
              size="lg"
              className="w-full"
            >
              Continue Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}