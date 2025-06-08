'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSubscription } from '@/hooks/use-subscription'
import { useFirebase } from '@/lib/firebase/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Check, 
  X,
  Sparkles,
  Plane,
  Globe,
  Users,
  Calendar,
  MessageSquare,
  FileText,
  Cloud,
  Shield,
  Zap,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Info
} from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/plans'

type PlanKey = keyof typeof SUBSCRIPTION_PLANS

interface FeatureItemProps {
  text: string
  included: boolean
  highlight?: boolean
}

function FeatureItem({ text, included, highlight }: FeatureItemProps) {
  return (
    <div className={`flex items-start gap-3 py-2 ${highlight ? 'font-medium' : ''}`}>
      {included ? (
        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
      )}
      <span className={included ? '' : 'text-muted-foreground/75'}>{text}</span>
    </div>
  )
}

interface PlanCardProps {
  planKey: PlanKey
  isCurrentPlan: boolean
  isYearly: boolean
  onSelect: () => void
  loading?: boolean
  recommended?: boolean
}

function PlanCard({ planKey, isCurrentPlan, isYearly, onSelect, loading, recommended }: PlanCardProps) {
  const plan = SUBSCRIPTION_PLANS[planKey]
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
  const monthlyEquivalent = plan.yearlyPrice ? plan.yearlyPrice / 12 : 0
  const savings = plan.monthlyPrice && plan.yearlyPrice 
    ? (plan.monthlyPrice * 12 - plan.yearlyPrice) 
    : 0

  // Define all features for comparison
  const features = {
    trips: {
      free: '1 active trip',
      basic: '5 active trips',
      pro: 'Unlimited active trips'
    },
    ai: {
      free: 'Basic AI suggestions',
      basic: 'Advanced AI travel assistant',
      pro: 'Premium AI with priority processing'
    },
    itinerary: {
      free: '7-day itinerary limit',
      basic: '30-day itinerary limit',
      pro: 'Unlimited itinerary length'
    },
    requests: {
      free: '50 AI requests/month',
      basic: '500 AI requests/month',
      pro: 'Unlimited AI requests'
    },
    weather: {
      free: false,
      basic: 'Weather integration',
      pro: 'Real-time weather updates'
    },
    export: {
      free: false,
      basic: 'Export to PDF',
      pro: 'Export to multiple formats'
    },
    packing: {
      free: false,
      basic: false,
      pro: 'Custom packing lists'
    },
    budget: {
      free: false,
      basic: false,
      pro: 'Advanced budget tracking'
    },
    collaboration: {
      free: false,
      basic: false,
      pro: 'Group collaboration features'
    },
    support: {
      free: 'Community support',
      basic: 'Email support',
      pro: 'Priority support'
    }
  }

  const getIcon = () => {
    switch(planKey) {
      case 'free': return <Sparkles className="h-6 w-6" />
      case 'basic': return <Plane className="h-6 w-6" />
      case 'pro': return <Globe className="h-6 w-6" />
    }
  }

  return (
    <Card className={`relative h-full flex flex-col ${recommended ? 'border-primary shadow-lg scale-105' : ''}`}>
      {recommended && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="px-3 py-1">Most Popular</Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4 text-primary">
          {getIcon()}
        </div>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription className="text-base">{plan.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <div className="text-center mb-6">
          {price !== undefined ? (
            <>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold">
                  ${isYearly ? monthlyEquivalent.toFixed(2) : price.toFixed(2)}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              {isYearly && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Billed annually at ${plan.yearlyPrice?.toFixed(2)}
                  </p>
                  {savings > 0 && (
                    <p className="text-sm text-green-600 font-medium">
                      Save ${savings.toFixed(0)} per year
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-4xl font-bold">Free</div>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
            What's included
          </h4>
          
          <FeatureItem text={features.trips[planKey]} included={true} highlight />
          <FeatureItem text={features.ai[planKey]} included={true} highlight />
          <FeatureItem text={features.itinerary[planKey]} included={true} />
          <FeatureItem text={features.requests[planKey]} included={true} />
          
          <FeatureItem 
            text={typeof features.weather[planKey] === 'string' ? features.weather[planKey] : 'Weather integration'} 
            included={!!features.weather[planKey]} 
          />
          
          <FeatureItem 
            text={typeof features.export[planKey] === 'string' ? features.export[planKey] : 'Export options'} 
            included={!!features.export[planKey]} 
          />
          
          <FeatureItem text="Custom packing lists" included={!!features.packing[planKey]} />
          <FeatureItem text="Budget tracking" included={!!features.budget[planKey]} />
          <FeatureItem text="Group collaboration" included={!!features.collaboration[planKey]} />
          
          <div className="pt-2 border-t">
            <FeatureItem text={features.support[planKey]} included={true} />
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          size="lg"
          variant={isCurrentPlan ? "outline" : (recommended ? "default" : "secondary")}
          onClick={onSelect}
          disabled={loading || isCurrentPlan}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : (
            <>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function PricingPage() {
  const router = useRouter()
  const { user } = useFirebase()
  const { currentPlan, loading: subscriptionLoading } = useSubscription()
  const [isYearly, setIsYearly] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSelectPlan = async (planKey: string) => {
    if (!user) {
      router.push('/login')
      return
    }

    setSelectedPlan(planKey)
    setLoading(true)

    // Navigate to billing page with plan selection
    const params = new URLSearchParams({
      plan: planKey,
      billing: isYearly ? 'yearly' : 'monthly'
    })
    
    router.push(`/dashboard/settings/billing?${params}`)
  }

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Back to Settings Link */}
      <div className="mb-8">
        <Link 
          href="/dashboard/settings" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Choose Your Travel Planning Experience
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          From casual explorers to professional travel planners, we have the perfect plan for your journey
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-16">
        <div className="bg-muted p-1 rounded-lg">
          <div className="flex items-center gap-4">
            <Button
              variant={!isYearly ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsYearly(false)}
              className="relative"
            >
              Monthly
            </Button>
            <Button
              variant={isYearly ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsYearly(true)}
              className="relative"
            >
              Yearly
              <Badge variant="secondary" className="ml-2 absolute -top-2 -right-12">
                Save 20%
              </Badge>
            </Button>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-6xl mx-auto mb-20">
        <div className="grid gap-8 lg:grid-cols-3">
          <PlanCard
            planKey="free"
            isCurrentPlan={currentPlan === 'free'}
            isYearly={isYearly}
            onSelect={() => handleSelectPlan('free')}
            loading={loading && selectedPlan === 'free'}
          />
          
          <PlanCard
            planKey="basic"
            isCurrentPlan={currentPlan === 'basic'}
            isYearly={isYearly}
            onSelect={() => handleSelectPlan('basic')}
            loading={loading && selectedPlan === 'basic'}
            recommended
          />
          
          <PlanCard
            planKey="pro"
            isCurrentPlan={currentPlan === 'pro'}
            isYearly={isYearly}
            onSelect={() => handleSelectPlan('pro')}
            loading={loading && selectedPlan === 'pro'}
          />
        </div>
      </div>

      {/* Additional Features Section */}
      <div className="max-w-6xl mx-auto mb-20">
        <h2 className="text-2xl font-bold text-center mb-10">
          All Plans Include
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="text-center">
            <CardContent className="pt-6">
              <MessageSquare className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">AI Travel Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Get personalized recommendations and travel advice
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Calendar className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Smart Itineraries</h3>
              <p className="text-sm text-muted-foreground">
                Day-by-day planning with activity suggestions
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Cloud className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Cloud Sync</h3>
              <p className="text-sm text-muted-foreground">
                Access your trips from any device
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Shield className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">
                Your travel data is encrypted and protected
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto mb-20">
        <h2 className="text-2xl font-bold text-center mb-10">
          Frequently Asked Questions
        </h2>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll 
                  have immediate access to new features. When downgrading, changes take effect at 
                  your next billing cycle.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our Free plan lets you explore NovaTrek's core features without any time limit. 
                  When you're ready for more advanced features, you can upgrade to Basic or Pro.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="billing" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How does yearly billing work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  With yearly billing, you pay for 12 months upfront and save 20% compared to 
                  monthly billing. This works out to getting more than 2 months free!
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit and debit cards through our secure payment processor, 
                  Stripe. Your payment information is never stored on our servers.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="features" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What counts as an active trip?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  An active trip is any trip you're currently planning or traveling on. Archived 
                  trips don't count toward your limit, so you can keep all your memories!
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What are AI requests?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  AI requests include getting travel suggestions, optimizing itineraries, and 
                  chatting with our AI assistant. Each interaction counts as one request.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* CTA Section */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Start Planning Your Next Adventure?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of travelers who use NovaTrek to plan unforgettable trips
          </p>
          <Button 
            size="lg" 
            onClick={() => handleSelectPlan('basic')}
            disabled={currentPlan === 'basic'}
          >
            Get Started with Basic
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Test Mode Alert */}
      {process.env.NODE_ENV === 'development' && (
        <Alert className="mt-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Test Mode:</strong> This is using Stripe test mode. No real charges will be made.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}