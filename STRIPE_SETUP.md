# Stripe Subscription Setup Guide

This guide will help you set up Stripe subscriptions for NovaTrek.

## Prerequisites

1. A Stripe account (create one at https://stripe.com)
2. Firebase project with Firestore enabled
3. Node.js environment

## Setup Steps

### 1. Configure Stripe Products and Prices

1. Go to your Stripe Dashboard
2. Navigate to Products
3. Create the following products:

#### Basic Plan
- Name: "NovaTrek Basic"
- Description: "Great for occasional travelers"
- Create two prices:
  - Monthly: $9.99/month
  - Yearly: $99.99/year

#### Pro Plan
- Name: "NovaTrek Pro"
- Description: "For frequent travelers and travel planners"
- Create two prices:
  - Monthly: $29.99/month
  - Yearly: $299.99/year

### 2. Set Environment Variables

Update your `.env.local` file with the following values from Stripe:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Stripe Price IDs (from the products you created)
STRIPE_PRICE_BASIC_MONTHLY=price_YOUR_BASIC_MONTHLY_ID
STRIPE_PRICE_BASIC_YEARLY=price_YOUR_BASIC_YEARLY_ID
STRIPE_PRICE_PRO_MONTHLY=price_YOUR_PRO_MONTHLY_ID
STRIPE_PRICE_PRO_YEARLY=price_YOUR_PRO_YEARLY_ID

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Update for production
```

### 3. Configure Stripe Webhook

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local development:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Copy the webhook signing secret and update `STRIPE_WEBHOOK_SECRET` in `.env.local`

5. For production, configure the webhook endpoint in Stripe Dashboard:
   - Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
   - Events to listen for:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

### 4. Firebase Service Account

1. Go to Firebase Console > Project Settings > Service Accounts
2. Generate a new private key
3. Copy the JSON content
4. Update `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env.local` with the JSON

### 5. Update Firestore Rules

Add the following rules to handle subscription data:

```javascript
// Allow users to read their own subscription data
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if false; // Only server can write subscription data
}

// Allow users to read their own payment history
match /users/{userId}/payments/{paymentId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if false; // Only server can write payment data
}
```

### 6. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. In another terminal, start Stripe webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. Navigate to `/pricing` and test the subscription flow

4. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Requires authentication: `4000 0025 0000 3155`
   - Decline: `4000 0000 0000 9995`

## Usage in Components

### Check subscription status:

```typescript
import { useSubscription } from '@/hooks/use-subscription';

function MyComponent() {
  const { subscription, isSubscribed, currentPlan, canCreateTrip } = useSubscription();
  
  // Check if user can create a new trip
  const activeTrips = 3; // Get from your data
  if (!canCreateTrip(activeTrips)) {
    // Show upgrade prompt
  }
}
```

### Show subscription status:

```typescript
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';

function Dashboard() {
  return (
    <div>
      <SubscriptionStatus />
    </div>
  );
}
```

## Production Checklist

- [ ] Replace test API keys with live keys
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Configure production webhook endpoint in Stripe Dashboard
- [ ] Update Firebase service account for production
- [ ] Test subscription flow with real payment methods
- [ ] Set up monitoring for failed payments
- [ ] Configure customer portal settings in Stripe

## Troubleshooting

### Webhook signature verification fails
- Ensure `STRIPE_WEBHOOK_SECRET` matches the one from Stripe CLI or Dashboard
- Check that you're using the raw request body (not parsed JSON)

### Subscription not updating in Firestore
- Check Firebase Admin SDK initialization
- Verify service account has proper permissions
- Check webhook logs in Stripe Dashboard

### Checkout session fails
- Verify price IDs are correct
- Ensure user has a valid email
- Check Stripe API version compatibility