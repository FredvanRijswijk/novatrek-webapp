'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/config';
import { useFirebase } from '@/lib/firebase/context';
import { useRouter } from 'next/navigation';
import { getStripe } from '@/lib/stripe/client';

export default function PricingPage() {
  const { user } = useFirebase();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const handleSubscribe = async (planKey: string) => {
    if (!user) {
      router.push('/');
      return;
    }

    setLoading(planKey);

    try {
      const plan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS];
      if (planKey === 'free' || !plan) return;

      const priceId = billingPeriod === 'monthly' 
        ? plan.monthlyPriceId 
        : plan.yearlyPriceId;

      const response = await fetch('/api/subscription/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (data.sessionId) {
        const stripe = await getStripe();
        await stripe?.redirectToCheckout({ sessionId: data.sessionId });
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(null);
    }
  };

  const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
    key,
    ...plan,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Travel Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Start planning your perfect trips with NovaTrek
          </p>
          
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={`text-lg ${billingPeriod === 'monthly' ? 'font-semibold' : ''}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-lg ${billingPeriod === 'yearly' ? 'font-semibold' : ''}`}>
              Yearly
              <span className="ml-2 text-sm text-green-600">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const price = plan.key === 'free' 
              ? 0 
              : billingPeriod === 'monthly' 
                ? plan.monthlyPrice 
                : plan.yearlyPrice;

            const isPopular = plan.key === 'basic';

            return (
              <Card 
                key={plan.key} 
                className={`relative ${isPopular ? 'border-blue-500 shadow-xl' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      ${price}
                    </span>
                    {plan.key !== 'free' && (
                      <span className="text-gray-600 dark:text-gray-400">
                        /{billingPeriod === 'monthly' ? 'month' : 'year'}
                      </span>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan.key)}
                    disabled={loading !== null || plan.key === 'free'}
                  >
                    {loading === plan.key ? 'Loading...' : 
                     plan.key === 'free' ? 'Current Plan' : 'Get Started'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}