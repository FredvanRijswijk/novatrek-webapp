import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    description: 'Perfect for trying out NovaTrek',
    price: 0,
    priceId: null,
    features: [
      '1 active trip',
      'Basic AI travel suggestions',
      '7-day itinerary limit',
      'Community support',
    ],
    limits: {
      activeTrips: 1,
      itineraryDays: 7,
      aiRequestsPerMonth: 50,
    },
  },
  basic: {
    name: 'Basic',
    description: 'Great for occasional travelers',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    monthlyPriceId: process.env.STRIPE_PRICE_BASIC_MONTHLY,
    yearlyPriceId: process.env.STRIPE_PRICE_BASIC_YEARLY,
    features: [
      '5 active trips',
      'Advanced AI travel assistant',
      '30-day itinerary limit',
      'Weather integration',
      'Email support',
      'Export to PDF',
    ],
    limits: {
      activeTrips: 5,
      itineraryDays: 30,
      aiRequestsPerMonth: 500,
    },
  },
  pro: {
    name: 'Pro',
    description: 'For frequent travelers and travel planners',
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    monthlyPriceId: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearlyPriceId: process.env.STRIPE_PRICE_PRO_YEARLY,
    features: [
      'Unlimited active trips',
      'Premium AI travel assistant',
      'Unlimited itinerary length',
      'Real-time weather updates',
      'Priority support',
      'Export to multiple formats',
      'Collaboration features',
      'Custom packing lists',
      'Budget tracking',
    ],
    limits: {
      activeTrips: -1, // Unlimited
      itineraryDays: -1, // Unlimited
      aiRequestsPerMonth: -1, // Unlimited
    },
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;
export type SubscriptionStatus = 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';