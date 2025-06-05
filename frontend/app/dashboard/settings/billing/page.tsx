'use client'

import { useState, useEffect } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { useFirebase } from '@/lib/firebase/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CreditCard, CheckCircle, Zap, Loader2 } from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/plans'

export default function BillingPage() {
  const { user } = useFirebase()
  const { subscription, currentPlan, limits, loading } = useSubscription()
  const [loadingPortal, setLoadingPortal] = useState(false)

  const handleManageSubscription = async () => {
    if (!user) return

    setLoadingPortal(true)
    try {
      const response = await fetch('/api/subscription/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: user.uid, // In production, use Stripe customer ID
        }),
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating portal session:', error)
    } finally {
      setLoadingPortal(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const plan = SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Plan</span>
            <Badge variant={currentPlan === 'free' ? 'secondary' : 'default'}>
              {plan.name}
            </Badge>
          </CardTitle>
          <CardDescription>
            {plan.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Plan Features */}
            <div className="space-y-2">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* Usage Stats */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">Usage This Month</h4>
              
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
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {currentPlan === 'free' ? (
                <Button asChild className="flex-1">
                  <a href="/pricing">
                    <Zap className="mr-2 h-4 w-4" />
                    Upgrade Plan
                  </a>
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleManageSubscription}
                  disabled={loadingPortal}
                >
                  {loadingPortal ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Manage Subscription
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>
            Manage your payment methods and billing details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentPlan === 'free' ? (
            <p className="text-sm text-muted-foreground">
              No payment method required for the free plan.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">•••• •••• •••• 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/24</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            Download invoices and view payment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentPlan === 'free' ? (
            <p className="text-sm text-muted-foreground">
              No billing history for free plan.
            </p>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No invoices yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}