'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Users,
  DollarSign,
  Star,
  Zap,
  Shield,
  ChevronRight
} from 'lucide-react';
import { useFirebase } from '@/lib/firebase/context';
import { useSubscription } from '@/hooks/use-subscription';

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useFirebase();
  const { subscription, loading: subLoading } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // If user has active subscription, redirect to dashboard
    if (!subLoading && subscription?.status === 'active') {
      router.push('/dashboard');
    }
  }, [subscription, subLoading, router]);

  const handleStartTrial = async () => {
    if (!user) {
      router.push('/');
      return;
    }

    try {
      // Create checkout session with trial
      const priceId = selectedPlan === 'yearly' 
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY 
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY;

      const response = await fetch('/api/subscription/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
          userEmail: user.email,
          trial_period_days: 7, // 7-day free trial
        }),
      });

      const data = await response.json();

      if (data.sessionId) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating trial:', error);
    }
  };

  const handleSubscribe = async () => {
    // Redirect to pricing page with selected plan
    router.push(`/pricing?plan=${selectedPlan}`);
  };

  const features = [
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: "AI-Powered Itineraries",
      description: "Get personalized trip plans tailored to your preferences"
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: "Smart Destination Discovery",
      description: "Find hidden gems and must-see attractions"
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: "Flexible Planning",
      description: "Easily adjust your itinerary on the go"
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Collaborative Trips",
      description: "Plan together with friends and family"
    }
  ];

  if (subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="mb-4">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Success!</h2>
            <p className="text-muted-foreground">
              Your trial has been activated. Redirecting to dashboard...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Close button */}
      <button
        onClick={() => router.push('/dashboard')}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">NovaTrek</h1>
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold">
                Start planning your dream trips for free.
              </h2>
              
              <div className="space-y-4 mt-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg mt-1">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <p className="text-lg font-medium mb-2">
                  Enjoy one week free, then $29/month
                </p>
                <p className="text-sm text-muted-foreground">
                  (billed at ${selectedPlan === 'yearly' ? '299' : '29'}/{selectedPlan === 'yearly' ? 'year' : 'month'})
                </p>
              </div>

              <div className="space-y-3">
                <Button onClick={() => router.push('/pricing')} size="lg" className="text-base">
                  See all plans
                </Button>
                <p className="text-xs text-muted-foreground">
                  What's included <ChevronRight className="inline h-3 w-3" />
                </p>
              </div>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-2 pt-4">
              <div className="flex -space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-muted border-2 border-background" />
                ))}
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current text-yellow-500" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Loved by 10,000+ travelers
              </p>
            </div>
          </div>

          {/* Right side - Pricing cards */}
          <div className="space-y-6">
            {/* Plan selector */}
            <div className="flex gap-4 justify-center">
              <Card 
                className={`p-4 cursor-pointer transition-all ${
                  selectedPlan === 'yearly' 
                    ? 'ring-2 ring-primary' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedPlan('yearly')}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Most Popular</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      Save 20%
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    $24.92/month
                  </div>
                  <p className="text-sm text-muted-foreground">
                    billed at $299/year
                  </p>
                </div>
              </Card>

              <Card 
                className={`p-4 cursor-pointer transition-all ${
                  selectedPlan === 'monthly' 
                    ? 'ring-2 ring-primary' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedPlan('monthly')}
              >
                <div className="space-y-2">
                  <span className="font-semibold">Monthly</span>
                  <div className="text-2xl font-bold">
                    $29/month
                  </div>
                  <p className="text-sm text-muted-foreground">
                    $156.86/year (billed monthly)
                  </p>
                </div>
              </Card>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleStartTrial} 
                size="lg" 
                className="w-full text-base"
              >
                <Zap className="mr-2 h-4 w-4" />
                Start Free Trial
              </Button>
              
              <Button 
                onClick={handleSubscribe}
                size="lg" 
                variant="outline"
                className="w-full text-base"
              >
                Subscribe Now
              </Button>

              <div className="text-center space-y-2 pt-2">
                <p className="text-xs text-muted-foreground">
                  Have a promo code? <button className="underline">Redeem code</button>
                </p>
                <p className="text-xs text-muted-foreground">
                  Does your employer offer NovaTrek? <button className="underline">Start here</button>
                </p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="space-y-4 pt-6">
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Secure payment processing
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Cancel anytime, no questions asked
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}