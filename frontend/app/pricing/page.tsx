'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Check, Sparkles, ArrowRight } from 'lucide-react'
import { track } from '@vercel/analytics'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils/currency'

const pricingPlans = [
  {
    name: 'Free',
    price: formatPrice(0),
    description: 'Perfect for casual travelers',
    features: [
      '1 active trip',
      'Basic AI recommendations',
      '3-day itineraries',
      'Standard support',
      'Travel Inbox (5 saves/month)'
    ],
    cta: 'Start Free',
    highlighted: false
  },
  {
    name: 'Basic',
    price: formatPrice(9.99),
    period: '/month',
    description: 'For regular travelers',
    features: [
      '3 active trips',
      'Advanced AI features',
      '7-day itineraries',
      'Priority support',
      'Weather integration',
      'Budget tracking',
      'Travel Inbox (unlimited)',
      'Group travel tools'
    ],
    cta: 'Start 14-Day Trial',
    highlighted: true
  },
  {
    name: 'Pro',
    price: formatPrice(29.99),
    period: '/month',
    description: 'For travel enthusiasts',
    features: [
      'Unlimited trips',
      'Premium AI models (GPT-4)',
      '14+ day itineraries',
      '24/7 priority support',
      'Advanced group tools',
      'API access',
      'Custom integrations',
      'Early access to features',
      'Expert consultations (1/month)'
    ],
    cta: 'Start 14-Day Trial',
    highlighted: false
  }
]

export default function PricingPage() {
  const router = useRouter()

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Start free and upgrade as you grow. No hidden fees, cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={plan.highlighted ? "border-primary shadow-lg scale-105" : ""}
              >
                {plan.highlighted && (
                  <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => {
                      track('click', {
                        button: 'pricing_cta',
                        page: 'pricing',
                        plan: plan.name.toLowerCase(),
                        price: plan.price
                      })
                      router.push('/waitlist')
                    }}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect 
                  immediately, and we'll prorate any payments.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards, debit cards, and digital wallets through 
                  our secure Stripe integration.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! Basic and Pro plans include a 14-day free trial. No credit card required 
                  to start. You can also use our Free plan indefinitely.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel my subscription?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely. You can cancel your subscription at any time from your account 
                  settings. You'll continue to have access until the end of your billing period.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Planning Smarter?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of travelers who save time and stress with NovaTrek.
          </p>
          <Button 
            size="lg"
            onClick={() => {
              track('click', { button: 'start_free_cta', page: 'pricing' })
              router.push('/waitlist')
            }}
          >
            Start Free Today
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </PublicLayout>
  )
}