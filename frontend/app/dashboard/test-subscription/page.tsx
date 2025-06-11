'use client'

import { useState } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { useFirebase } from '@/lib/firebase/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CreditCard, 
  Info, 
  CheckCircle,
  ArrowRight,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { stripePlans } from '@/lib/stripe/plans'
import { TestRoute } from '@/components/auth/TestRoute'

export default function TestSubscriptionPage() {
  const { user } = useFirebase()
  const { subscription, currentPlan, loading } = useSubscription()
  const [copiedCard, setCopiedCard] = useState<string | null>(null)

  const testCards = [
    {
      number: '4242 4242 4242 4242',
      description: 'Success - Payment will succeed',
      type: 'success'
    },
    {
      number: '4000 0027 6000 3184',
      description: 'Requires authentication (3D Secure)',
      type: 'auth'
    },
    {
      number: '4000 0000 0000 9995',
      description: 'Insufficient funds - Payment will fail',
      type: 'fail'
    }
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ''))
    setCopiedCard(text)
    setTimeout(() => setCopiedCard(null), 2000)
  }

  if (loading) {
    return (
      <TestRoute>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </TestRoute>
    )
  }

  return (
    <TestRoute>
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Subscription Upgrades</h1>
        <p className="text-muted-foreground mt-2">
          Test the subscription upgrade and downgrade flow with Stripe test cards
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-lg font-semibold capitalize">{currentPlan}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                {subscription?.status || 'No subscription'}
              </Badge>
            </div>
            {subscription?.priceId && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Price ID</p>
                  <code className="text-xs">{subscription.priceId}</code>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billing Period</p>
                  <p className="text-lg font-semibold">
                    {Object.values(stripePlans).find(p => p.priceIdYearly === subscription.priceId) ? 'Yearly' : 'Monthly'}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
          <CardDescription>
            Follow these steps to test subscription upgrades and downgrades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upgrade">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upgrade">Upgrade</TabsTrigger>
              <TabsTrigger value="downgrade">Downgrade</TabsTrigger>
              <TabsTrigger value="switch">Switch Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="upgrade" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Go to Billing Settings</p>
                    <p className="text-sm text-muted-foreground">
                      Navigate to your billing page to see all available plans
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Select a Higher Plan</p>
                    <p className="text-sm text-muted-foreground">
                      Choose Basic or Pro plan (if you're on Free or Basic)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Enter Test Card</p>
                    <p className="text-sm text-muted-foreground">
                      Use one of the test cards below when prompted
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Confirm Upgrade</p>
                    <p className="text-sm text-muted-foreground">
                      Your plan will be upgraded immediately with proration
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="downgrade" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Downgrades take effect at the end of your current billing period. Any unused time will be credited to your account.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Open Billing Portal</p>
                    <p className="text-sm text-muted-foreground">
                      Click "Open Billing Portal" on the billing page
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Cancel or Change Plan</p>
                    <p className="text-sm text-muted-foreground">
                      In Stripe portal, cancel to go to Free or change to a lower plan
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="switch" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Toggle Monthly/Yearly</p>
                    <p className="text-sm text-muted-foreground">
                      Use the switch at the top of the billing page
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Click Your Current Plan</p>
                    <p className="text-sm text-muted-foreground">
                      Select the same plan tier with different billing period
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Proration Applied</p>
                    <p className="text-sm text-muted-foreground">
                      Stripe will calculate the difference and charge/credit accordingly
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Test Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Stripe Test Cards</CardTitle>
          <CardDescription>
            Click on any card number to copy it to your clipboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {testCards.map((card) => (
            <div
              key={card.number}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => copyToClipboard(card.number)}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-mono font-medium">{card.number}</p>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </div>
              </div>
              {copiedCard === card.number ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Badge variant={
                  card.type === 'success' ? 'default' : 
                  card.type === 'auth' ? 'secondary' : 'destructive'
                }>
                  {card.type === 'success' ? 'Success' : 
                   card.type === 'auth' ? '3DS' : 'Fail'}
                </Badge>
              )}
            </div>
          ))}
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Use any future expiry date (e.g., 12/34) and any 3-digit CVC. 
              Any ZIP code will work.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button asChild className="flex-1">
          <Link href="/dashboard/settings/billing">
            <Zap className="mr-2 h-4 w-4" />
            Go to Billing Page
          </Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link href="/pricing">
            View Pricing
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Price IDs Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Configuration</CardTitle>
          <CardDescription>
            Your configured Stripe price IDs from environment variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Basic Monthly:</span>
              <span>{process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_MONTHLY}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Basic Yearly:</span>
              <span>{process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_YEARLY}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Pro Monthly:</span>
              <span>{process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Pro Yearly:</span>
              <span>{process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </TestRoute>
  )
}