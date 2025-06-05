import Stripe from 'stripe';

// This file should only be used on the server side
// For client-side subscription plans, use ./plans.ts

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Re-export types from plans.ts for convenience
export { SUBSCRIPTION_PLANS, type SubscriptionPlan, type SubscriptionStatus } from './plans';