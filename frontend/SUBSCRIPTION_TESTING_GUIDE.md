# Complete Subscription Testing Guide

## Prerequisites

1. **Stripe Dashboard Setup** (already done based on your price IDs)
   - Products created ✓
   - Prices created with correct IDs ✓

2. **Environment Variables** (already set in .env.local)
   - Stripe keys ✓
   - Price IDs ✓

## Testing the Complete Flow

### 1. Install and Run Stripe CLI

```bash
# Install Stripe CLI (if not already installed)
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret that appears and update STRIPE_WEBHOOK_SECRET in .env.local
```

### 2. Start Your Development Server

```bash
cd frontend
npm run dev
```

### 3. Test User Flow

1. **Sign Up/Login**
   - Go to http://localhost:3000
   - Sign in with Google
   - You'll be redirected to /onboarding (since no subscription)

2. **Start Free Trial**
   - On onboarding page, select yearly/monthly
   - Click "Start Free Trial"
   - You'll be redirected to Stripe Checkout
   - Use test card: 4242 4242 4242 4242
   - Any future expiry date, any CVC
   - Complete checkout

3. **Verify Webhook Processing**
   - Check Stripe CLI terminal for webhook events
   - Should see: `customer.subscription.created`
   - Check Firebase Console → Firestore → users → [your-user-id]
   - Should see subscription object with status: 'trialing'

4. **Access Dashboard**
   - After successful checkout, redirected to /dashboard
   - Subscription status check should pass

### 4. Test Different Scenarios

#### A. Direct Subscription (No Trial)
- Go to /pricing
- Click "Get Started" on any plan
- Complete checkout
- Verify subscription status: 'active'

#### B. Most Popular Button
- On onboarding or pricing page
- Click "Most Popular" plan
- Complete checkout

#### C. Cancel Subscription
- Go to /dashboard/settings (if implemented)
- Or use Stripe Dashboard to cancel
- Webhook should update Firebase

### 5. Verify Data in Firebase

Check Firestore for:
```javascript
users/{userId}/
  - stripeCustomerId: "cus_xxx"
  - subscription: {
      subscriptionId: "sub_xxx",
      status: "active" | "trialing",
      planId: "price_xxx",
      currentPeriodEnd: Timestamp,
      currentPeriodStart: Timestamp,
      cancelAtPeriodEnd: false,
      trialEnd: Timestamp (if trial)
    }
```

### 6. Common Issues & Solutions

1. **500 Error on subscription status check**
   - Restart dev server after env changes
   - Check Firebase initialization

2. **Webhook not received**
   - Ensure Stripe CLI is running
   - Check webhook secret is correct

3. **Subscription not updating**
   - Check Firestore rules allow webhook writes
   - Check Firebase console for errors

4. **Redirect issues**
   - Clear browser cache/cookies
   - Check console for errors

### 7. Test Cards

- **Success**: 4242 4242 4242 4242
- **Requires auth**: 4000 0025 0000 3155
- **Declined**: 4000 0000 0000 9995

## What Happens in the Code

1. **User clicks "Start Free Trial"**
   - POST to `/api/subscription/create-checkout-session`
   - Creates Stripe customer if needed
   - Creates checkout session with trial
   - Redirects to Stripe Checkout

2. **User completes checkout**
   - Stripe creates subscription
   - Sends webhook to `/api/webhooks/stripe`
   - Webhook updates Firebase with subscription data

3. **User accesses app**
   - `useSubscription` hook checks Firebase
   - `ProtectedRoute` enforces access
   - Redirects based on subscription status

## Monitoring

1. **Stripe Dashboard**
   - View test subscriptions
   - Check webhook logs
   - Monitor payment events

2. **Firebase Console**
   - Check user documents
   - Verify subscription data
   - Monitor Firestore writes

3. **Browser Console**
   - Check for JavaScript errors
   - Monitor API calls
   - Debug subscription checks