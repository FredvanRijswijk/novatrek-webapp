# Stripe Test Mode Setup Guide

## Creating Test Products and Prices

1. **Login to Stripe Dashboard**
   - Make sure you're in **Test mode** (toggle in the top right)

2. **Create Products**
   - Go to **Products** → **Add product**
   - Create three products:
     - Basic Plan ($9.99/month, $99.99/year)
     - Pro Plan ($29.99/month, $299.99/year)

3. **Get Price IDs**
   - Click on each product
   - Under "Pricing", click on each price
   - Copy the price ID (starts with `price_`)

4. **Update .env.local**
   ```
   # These should be price IDs, not product IDs
   NEXT_PUBLIC_STRIPE_PRICE_BASIC_MONTHLY=price_xxxxx
   NEXT_PUBLIC_STRIPE_PRICE_BASIC_YEARLY=price_xxxxx
   NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
   NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_xxxxx
   ```

## Testing Subscriptions

### Test Card Numbers
- **Success**: 4242 4242 4242 4242
- **Requires authentication**: 4000 0025 0000 3155
- **Declined**: 4000 0000 0000 9995

### Test Flow
1. Create a user account
2. Go to pricing page
3. Select a plan
4. Use test card number
5. Complete checkout
6. Check webhook logs in Stripe Dashboard

## Webhook Testing

### Local Testing with Stripe CLI
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will give you a webhook signing secret
# Update STRIPE_WEBHOOK_SECRET in .env.local
```

### Webhook Events to Handle
- `checkout.session.completed` - When payment succeeds
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription cancelled

## Quick Test Checklist
- [ ] Products created in Stripe Dashboard (test mode)
- [ ] Price IDs copied (not product IDs)
- [ ] Environment variables updated with `price_` IDs
- [ ] Webhook endpoint configured
- [ ] Test cards ready