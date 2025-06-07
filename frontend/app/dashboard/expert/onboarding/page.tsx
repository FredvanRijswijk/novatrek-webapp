'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFirebase } from '@/lib/firebase/context'
import { MarketplaceModel } from '@/lib/models/marketplace'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'

export default function ExpertOnboardingPage() {
  const router = useRouter()
  const { user } = useFirebase()
  const [loading, setLoading] = useState(true)
  const [expert, setExpert] = useState<any>(null)
  const [error, setError] = useState('')
  const [onboardingUrl, setOnboardingUrl] = useState('')
  const [checkingStatus, setCheckingStatus] = useState(false)

  useEffect(() => {
    async function loadExpertData() {
      if (!user) return

      try {
        const expertData = await MarketplaceModel.getExpertByUserId(user.uid)
        if (!expertData) {
          // Check if they have an approved application
          const application = await MarketplaceModel.getApplicationByUserId(user.uid)
          if (!application || application.status !== 'approved') {
            router.push('/dashboard/become-expert')
            return
          }
        } else {
          setExpert(expertData)
          
          // If already onboarded, redirect to dashboard
          if (expertData.onboardingComplete && expertData.status === 'active') {
            router.push('/dashboard/expert')
            return
          }
        }
      } catch (error) {
        console.error('Error loading expert data:', error)
        setError('Failed to load expert information')
      } finally {
        setLoading(false)
      }
    }

    loadExpertData()
  }, [user, router])

  const handleStartOnboarding = async () => {
    setLoading(true)
    setError('')

    try {
      const idToken = await user?.getIdToken()
      const response = await fetch('/api/marketplace/seller/onboard', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start onboarding')
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url
    } catch (error) {
      console.error('Onboarding error:', error)
      setError(error instanceof Error ? error.message : 'Failed to start onboarding')
      setLoading(false)
    }
  }

  const handleCheckStatus = async () => {
    if (!expert?.stripeConnectAccountId) return

    setCheckingStatus(true)
    setError('')

    try {
      const idToken = await user?.getIdToken()
      const response = await fetch(`/api/marketplace/seller/onboard?account_id=${expert.stripeConnectAccountId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check status')
      }

      if (data.complete) {
        // Onboarding complete, refresh data
        const updatedExpert = await MarketplaceModel.getExpertByUserId(user!.uid)
        if (updatedExpert?.onboardingComplete) {
          router.push('/dashboard/expert')
        }
      } else {
        setError('Onboarding is not yet complete. Please complete all required steps in Stripe.')
      }
    } catch (error) {
      console.error('Status check error:', error)
      setError('Failed to check onboarding status')
    } finally {
      setCheckingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Expert Account Setup</CardTitle>
          <CardDescription>
            Connect your Stripe account to start accepting payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold">What is Stripe Connect?</h3>
              <p className="text-sm text-muted-foreground">
                Stripe Connect allows you to accept payments on the NovaTrek platform. 
                We handle all the payment processing while you focus on creating amazing travel experiences.
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold">What you'll need:</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Business information (name, address, website)</li>
                <li>Tax identification number (SSN or EIN for US)</li>
                <li>Bank account details for payouts</li>
                <li>Government-issued ID for verification</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold">Platform Fees</h3>
              <p className="text-sm text-muted-foreground">
                NovaTrek charges a 15% platform fee on all transactions. This covers payment processing,
                platform maintenance, marketing, and customer support.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {expert?.stripeConnectAccountId && !expert?.onboardingComplete ? (
              <>
                <Button 
                  onClick={handleStartOnboarding}
                  className="w-full"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue Stripe Setup
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCheckStatus}
                  disabled={checkingStatus}
                  className="w-full"
                >
                  {checkingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Check Onboarding Status
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleStartOnboarding}
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Start Stripe Setup
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Setup Later
            </Button>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              By setting up payments, you agree to Stripe's terms of service and NovaTrek's 
              marketplace seller agreement. Your data is securely handled by Stripe.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}