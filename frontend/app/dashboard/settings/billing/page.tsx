'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSubscription } from '@/hooks/use-subscription'
import { useFirebase } from '@/lib/firebase/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { loadStripe } from '@stripe/stripe-js'
import { 
  CreditCard, 
  CheckCircle, 
  Zap, 
  Loader2, 
  ArrowUp, 
  ArrowDown,
  Info,
  X
} from 'lucide-react'
import { SUBSCRIPTION_PLANS, stripePlans } from '@/lib/stripe/plans'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PlanCardProps {
  plan: {
    name: string
    description: string
    monthlyPrice?: number
    yearlyPrice?: number
    features: string[]
  }
  planKey: string
  isCurrentPlan: boolean
  isYearly: boolean
  onSelectPlan: () => void
  loading?: boolean
  recommended?: boolean
}

function PlanCard({ plan, planKey, isCurrentPlan, isYearly, onSelectPlan, loading, recommended }: PlanCardProps) {
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
  const monthlyEquivalent = plan.yearlyPrice ? plan.yearlyPrice / 12 : 0
  const savings = plan.monthlyPrice && plan.yearlyPrice 
    ? (plan.monthlyPrice * 12 - plan.yearlyPrice) 
    : 0

  return (
    <Card className={`relative ${isCurrentPlan ? 'border-primary' : ''} ${recommended ? 'border-2' : ''}`}>
      {recommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge variant="default" className="px-3">
            Recommended
          </Badge>
        </div>
      )}
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </div>
          {isCurrentPlan && (
            <Badge variant="secondary">Current</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6">
          {price !== undefined ? (
            <>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">${isYearly ? monthlyEquivalent.toFixed(2) : price.toFixed(2)}</span>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
              {isYearly && savings > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  Save ${savings.toFixed(0)}/year
                </p>
              )}
            </>
          ) : (
            <div className="text-3xl font-bold">Free</div>
          )}
        </div>
        
        <div className="space-y-3 mb-6">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          variant={isCurrentPlan ? "outline" : "default"}
          onClick={onSelectPlan}
          disabled={loading || (planKey === 'free' && isCurrentPlan)}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : planKey === 'free' ? (
            'Downgrade'
          ) : (
            <>
              Upgrade to {plan.name}
              <ArrowUp className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function EnhancedBillingPage() {
  const { user } = useFirebase()
  const { subscription, currentPlan, limits, loading: subscriptionLoading } = useSubscription()
  const searchParams = useSearchParams()
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [isYearly, setIsYearly] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCanceledAlert, setShowCanceledAlert] = useState(false)

  // Determine if current subscription is yearly
  useEffect(() => {
    if (subscription?.priceId) {
      const isYearlyPrice = Object.values(stripePlans).some(
        plan => plan.priceIdYearly === subscription.priceId
      )
      setIsYearly(isYearlyPrice)
    }
  }, [subscription])

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

  const handlePlanChange = async (planKey: string) => {
    if (!user || planKey === currentPlan) return

    setSelectedPlan(planKey)
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
      setSelectedPlan(null)
    }
  }

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing & Subscription</h2>
        <p className="text-muted-foreground">
          Manage your subscription plan and billing information
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

      {/* Billing Period Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-3">
            <Label htmlFor="billing-period" className={!isYearly ? 'font-semibold' : ''}>
              Monthly
            </Label>
            <Switch
              id="billing-period"
              checked={isYearly}
              onCheckedChange={setIsYearly}
              disabled={updateLoading}
            />
            <Label htmlFor="billing-period" className={isYearly ? 'font-semibold' : ''}>
              Yearly
              <Badge variant="secondary" className="ml-2">Save 20%</Badge>
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <PlanCard
          plan={SUBSCRIPTION_PLANS.free}
          planKey="free"
          isCurrentPlan={currentPlan === 'free'}
          isYearly={isYearly}
          onSelectPlan={() => handlePlanChange('free')}
          loading={updateLoading && selectedPlan === 'free'}
        />
        
        <PlanCard
          plan={SUBSCRIPTION_PLANS.basic}
          planKey="basic"
          isCurrentPlan={currentPlan === 'basic'}
          isYearly={isYearly}
          onSelectPlan={() => handlePlanChange('basic')}
          loading={updateLoading && selectedPlan === 'basic'}
        />
        
        <PlanCard
          plan={SUBSCRIPTION_PLANS.pro}
          planKey="pro"
          isCurrentPlan={currentPlan === 'pro'}
          isYearly={isYearly}
          onSelectPlan={() => handlePlanChange('pro')}
          loading={updateLoading && selectedPlan === 'pro'}
          recommended
        />
      </div>

      {/* Current Usage */}
      {currentPlan !== 'free' && (
        <Card>
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>
              Track your usage against your plan limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>AI Requests</span>
                <span className="text-muted-foreground">
                  0 / {limits.aiRequestsPerMonth === -1 ? 'Unlimited' : limits.aiRequestsPerMonth}
                </span>
              </div>
              <Progress value={0} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Trips</span>
                <span className="text-muted-foreground">
                  0 / {limits.activeTrips === -1 ? 'Unlimited' : limits.activeTrips}
                </span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Management */}
      {currentPlan !== 'free' && (
        <Card>
          <CardHeader>
            <CardTitle>Billing Management</CardTitle>
            <CardDescription>
              Access the Stripe customer portal to manage payment methods, download invoices, and cancel subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  Open Billing Portal
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Test Cards Info */}
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
    </div>
  )
}