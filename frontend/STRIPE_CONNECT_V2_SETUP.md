# Stripe Connect v2 Setup Guide

## Overview

NovaTrek now supports Stripe Connect Accounts v2, providing enhanced flexibility and future-proofing for the marketplace platform. This guide explains how to enable and use the v2 implementation.

## Quick Start

### 1. Enable v2 for New Accounts

Add these environment variables to your `.env.local`:

```bash
# Enable Stripe Connect v2 for new expert accounts
NEXT_PUBLIC_ENABLE_STRIPE_V2_NEW=true

# Enable Stripe Connect v2 migration for existing accounts (optional)
NEXT_PUBLIC_ENABLE_STRIPE_V2_MIGRATION=false

# Force v2 for specific user IDs (comma-separated, for testing)
# NEXT_PUBLIC_STRIPE_V2_TEST_USERS=user1,user2,user3
```

### 2. Test with Specific Users

To test v2 with specific users before full rollout:

```bash
NEXT_PUBLIC_STRIPE_V2_TEST_USERS=testuser1,testuser2
```

## Key Features of v2

1. **Flexible Configurations**: Experts can have multiple configurations (merchant for receiving payments, customer for making payments)
2. **Enhanced Entity Management**: Better support for different business structures
3. **Improved Onboarding**: More granular capability management
4. **Future-Proof**: New Stripe features will be v2-exclusive

## Implementation Details

### Account Creation

When v2 is enabled, new expert accounts are created with:
- Controller type: `platform`
- Entity type: `individual` or `company`
- Merchant configuration with card payments and transfers capabilities
- Automatic payout schedule configuration

### Database Fields

v2 accounts have these additional fields:
- `stripeAccountVersion`: 'v1' or 'v2'
- `stripeAccountConfigurations`: Stores account configurations
- `stripeAccountStatus.requirementsNeeded`: Array of pending requirements

### Webhook Handling

The webhook handler automatically detects v2 accounts and:
- Retrieves full configuration data
- Updates onboarding status with detailed capability information
- Stores configuration data for reference

## Migration Strategy

### Phase 1: New Accounts (Recommended)
1. Set `NEXT_PUBLIC_ENABLE_STRIPE_V2_NEW=true`
2. All new expert signups will use v2
3. Monitor for any issues

### Phase 2: Test Migration
1. Identify test accounts for migration
2. Add their user IDs to `NEXT_PUBLIC_STRIPE_V2_TEST_USERS`
3. Use Stripe's migration tools

### Phase 3: Full Migration
1. Set `NEXT_PUBLIC_ENABLE_STRIPE_V2_MIGRATION=true`
2. Implement migration scripts
3. Gradually migrate all accounts

## Testing v2

1. **Create Test Expert Account**:
   - Apply as expert through the platform
   - Admin approves application
   - Start onboarding process
   - Verify v2 account created in Stripe Dashboard

2. **Verify Webhook Processing**:
   - Complete onboarding
   - Check that account status updates correctly
   - Verify configurations are stored

3. **Test Payments**:
   - Create product as expert
   - Purchase product as customer
   - Verify payment processing works

## Troubleshooting

### Account Not Creating as v2
- Check environment variables are set
- Verify user ID in test users list if using that method
- Check browser console for feature flag status

### Webhook Errors
- Check webhook logs in Stripe Dashboard
- Verify webhook endpoint is configured correctly
- Check Firebase rules allow webhook writes

### Onboarding Issues
- Ensure all required capabilities are requested
- Check account requirements in Stripe Dashboard
- Verify country/entity type compatibility

## API Differences

### v1 Account Creation
```typescript
stripe.accounts.create({
  type: 'express',
  country: 'US',
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true }
  }
})
```

### v2 Account Creation
```typescript
stripe.accounts.create({
  controller: {
    type: 'platform',
    onboarding: { enabled: true }
  },
  country: 'US',
  entity: { type: 'individual' },
  configurations: {
    merchant: {
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    }
  }
})
```

## Resources

- [Stripe Accounts v2 Documentation](https://docs.stripe.com/connect/accounts-v2/api)
- [Migration Guide](https://docs.stripe.com/connect/accounts-v2/migration)
- [API Reference](https://docs.stripe.com/api/accounts/create)

## Support

For issues or questions:
1. Check the [STRIPE_ACCOUNTS_V2_ANALYSIS.md](./STRIPE_ACCOUNTS_V2_ANALYSIS.md) for detailed analysis
2. Review Stripe's official documentation
3. Check webhook logs and account status in Stripe Dashboard