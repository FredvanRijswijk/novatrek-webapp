'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSubscription } from '@/hooks/use-subscription'
import { useFirebase } from '@/lib/firebase/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { loadStripe } from '@stripe/stripe-js'
import { 
  CreditCard, 
  CheckCircle, 
  Loader2, 
  Info,
  ArrowRight,
  Sparkles,
  Calendar,
  Activity
} from 'lucide-react'
import { SUBSCRIPTION_PLANS, stripePlans } from '@/lib/stripe/plans'
import Link from 'next/link'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function BillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useFirebase()
  const { subscription, currentPlan, limits, loading: subscriptionLoading } = useSubscription()
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCanceledAlert, setShowCanceledAlert] = useState(false)

  // Check for plan change request from pricing page
  useEffect(() => {
    const planParam = searchParams.get('plan')
    const billingParam = searchParams.get('billing')
    
    if (planParam && planParam !== currentPlan && !subscriptionLoading) {
      // Automatically initiate plan change
      handlePlanChange(planParam, billingParam === 'yearly')
    }
  }, [searchParams, currentPlan, subscriptionLoading])

  // Check if user canceled the checkout
  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      setShowCanceledAlert(true)
      // Remove the query parameter
      window.history.replaceState({}, '', '/dashboard/settings/billing')
      // Auto-hide after 5 seconds
      setTimeout(() => setShowCanceledAlert(false), 5000)
    }
  }, [searchParams])

  const handleManageSubscription = async () => {
    if (!user) return

    setLoadingPortal(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch('/api/subscription/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating portal session:', error)
      setError('Failed to open billing portal')
    } finally {
      setLoadingPortal(false)
    }
  }

  const handlePlanChange = async (planKey: string, isYearly: boolean = false) => {
    if (!user || planKey === currentPlan) return

    setError(null)
    setUpdateLoading(true)

    try {
      const token = await user.getIdToken()
      
      // For free plan (downgrade)
      if (planKey === 'free') {
        // Cancel subscription through portal
        await handleManageSubscription()
        return
      }

      // Get the price ID for the selected plan
      const plan = stripePlans[planKey as keyof typeof stripePlans]
      if (!plan) throw new Error('Invalid plan selected')
      
      const priceId = isYearly ? plan.priceIdYearly : plan.priceIdMonthly

      const response = await fetch('/api/subscription/update-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          priceId,
          isYearly 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription')
      }

      // Handle different response types
      if (data.type === 'setup_required') {
        // Need to collect payment method first
        const stripe = await stripePromise
        if (!stripe) throw new Error('Failed to load Stripe')
        
        // Redirect to Stripe Checkout or payment method collection
        const checkoutSession = await fetch('/api/subscription/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ priceId })
        }).then(res => res.json())
        
        if (checkoutSession.url) {
          window.location.href = checkoutSession.url
        } else {
          throw new Error('Failed to create checkout session')
        }
      } else if (data.type === 'new_subscription' || data.type === 'payment_required') {
        // Need to confirm payment
        const stripe = await stripePromise
        if (!stripe) throw new Error('Failed to load Stripe')

        const { error: stripeError } = await stripe.confirmCardPayment(data.clientSecret)
        
        if (stripeError) {
          throw new Error(stripeError.message)
        }
        
        // Payment successful - refresh the page
        window.location.reload()
      } else if (data.type === 'updated') {
        // No payment needed (downgrade with credit)
        window.location.reload()
      } else if (data.type === 'no_change') {
        setError('You are already subscribed to this plan')
      }

    } catch (err: any) {
      console.error('Plan change error:', err)
      setError(err.message || 'Failed to update subscription')
    } finally {
      setUpdateLoading(false)
      // Clear URL params
      router.replace('/dashboard/settings/billing')
    }
  }

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const plan = SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS]
  const nextBillingDate = subscription?.currentPeriodEnd 
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing & Subscription</h2>
        <p className="text-muted-foreground">
          Manage your subscription and billing details
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showCanceledAlert && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your upgrade was canceled. You can try again anytime or choose a different plan.
          </AlertDescription>
        </Alert>
      )}

      {updateLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Processing your plan change...
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Your active subscription details
              </CardDescription>
            </div>
            <Badge variant={currentPlan === 'pro' ? 'default' : 'secondary'} className="text-lg px-3 py-1">
              {plan.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-medium">{plan.description}</span>
            </div>
            
            {currentPlan !== 'free' && (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="h-5 w-5" />
                  <span>
                    ${subscription?.priceId?.includes('yearly') 
                      ? `${(plan.yearlyPrice! / 12).toFixed(2)}/month (billed annually)`
                      : `${plan.monthlyPrice}/month`
                    }
                  </span>
                </div>
                
                {nextBillingDate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                    <span>Next billing date: {nextBillingDate}</span>
                  </div>
                )}
              </>
            )}

            <div className="pt-4 flex gap-3">
              <Button asChild>
                <Link href="/dashboard/settings/pricing">
                  <Sparkles className="mr-2 h-4 w-4" />
                  View All Plans
                </Link>
              </Button>
              
              {currentPlan !== 'free' && (
                <Button 
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={loadingPortal}
                >
                  {loadingPortal ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Manage Billing
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Month</CardTitle>
          <CardDescription>
            Track your usage against your plan limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* AI Requests */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">AI Requests</span>
                <span className="text-sm text-muted-foreground">
                  0 / {limits.aiRequestsPerMonth === -1 ? 'Unlimited' : limits.aiRequestsPerMonth}
                </span>
              </div>
              <Progress 
                value={limits.aiRequestsPerMonth === -1 ? 0 : 0} 
                className="h-2" 
              />
            </div>

            {/* Active Trips */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Active Trips</span>
                <span className="text-sm text-muted-foreground">
                  0 / {limits.activeTrips === -1 ? 'Unlimited' : limits.activeTrips}
                </span>
              </div>
              <Progress 
                value={limits.activeTrips === -1 ? 0 : 0} 
                className="h-2" 
              />
            </div>

            {/* Itinerary Days */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Max Itinerary Length</span>
                <span className="text-sm text-muted-foreground">
                  {limits.itineraryDays === -1 ? 'Unlimited' : `${limits.itineraryDays} days`}
                </span>
              </div>
              {limits.itineraryDays !== -1 && (
                <div className="flex items-center gap-2 mt-1">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Per trip limit
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Plan Features</CardTitle>
          <CardDescription>
            Everything included in your {plan.name} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <Link 
              href="/dashboard/settings/pricing" 
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              Compare all plans and features
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Test Cards Info */}
      {process.env.NODE_ENV === 'development' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Test Mode:</strong> Use Stripe test cards to test subscription upgrades:
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Success: <code>4242 4242 4242 4242</code></li>
              <li>• Requires authentication: <code>4000 0027 6000 3184</code></li>
              <li>• Insufficient funds: <code>4000 0000 0000 9995</code></li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}