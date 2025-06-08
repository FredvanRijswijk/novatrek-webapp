'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFirebase } from '@/lib/firebase/context'
import { useSubscription } from '@/hooks/use-subscription'
import confetti from 'canvas-confetti'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Sparkles, ArrowRight, Crown } from 'lucide-react'
import Link from 'next/link'

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useFirebase()
  const { subscription, refreshSubscription } = useSubscription()
  const [loading, setLoading] = useState(true)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Trigger confetti animation
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      
      // Shoot confetti from different angles
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)

    // Refresh subscription data
    refreshSubscription().then(() => {
      setLoading(false)
    })

    return () => clearInterval(interval)
  }, [user, router, refreshSubscription])

  const getPlanName = () => {
    if (subscription?.tier === 'premium_yearly' || subscription?.tier === 'premium_monthly') {
      return 'Pro'
    } else if (subscription?.tier === 'basic_yearly' || subscription?.tier === 'basic_monthly') {
      return 'Basic'
    }
    return 'Free'
  }

  const getPlanFeatures = () => {
    const planName = getPlanName()
    if (planName === 'Pro') {
      return [
        'Unlimited trips',
        'Advanced AI features',
        'Priority support',
        'Export to calendar',
        'Collaboration features',
        'Custom itineraries'
      ]
    } else if (planName === 'Basic') {
      return [
        'Up to 10 trips',
        'Basic AI features',
        'Email support',
        'Basic itineraries'
      ]
    }
    return []
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading your subscription...</p>
        </div>
      </div>
    )
  }

  const planName = getPlanName()
  const features = getPlanFeatures()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Success Icon */}
        <div className="text-center">
          <div className="relative inline-flex">
            <div className="absolute inset-0 animate-ping">
              <CheckCircle className="h-24 w-24 text-green-500 opacity-25" />
            </div>
            <CheckCircle className="h-24 w-24 text-green-500 relative" />
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to NovaTrek {planName}!
          </h1>
          <p className="text-xl text-muted-foreground">
            Your subscription has been activated successfully
          </p>
        </div>

        {/* Plan Details Card */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              <Badge variant="default" className="text-lg px-4 py-1">
                {planName} Plan
              </Badge>
            </div>
            <CardTitle className="text-2xl">Your plan includes:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="group">
            <Link href="/dashboard/trips/new">
              Start Planning a Trip
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard/settings/billing">
              View Billing Details
            </Link>
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Thank you for choosing NovaTrek! If you have any questions,{' '}
            <Link href="/help" className="text-primary hover:underline">
              visit our help center
            </Link>{' '}
            or contact support.
          </p>
        </div>
      </div>
    </div>
  )
}