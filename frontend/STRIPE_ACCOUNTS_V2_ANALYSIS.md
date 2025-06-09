# Stripe Connect Accounts v2 Migration Analysis for NovaTrek

## Executive Summary

After analyzing NovaTrek's current Stripe Connect implementation and the new Accounts v2 API, I recommend **migrating to Accounts v2** for the marketplace platform. This migration will provide better flexibility, future-proofing, and enhanced capabilities that align with NovaTrek's growth trajectory.

## Current Implementation Overview

NovaTrek currently uses:
- **Stripe Connect Express accounts** for travel experts
- **Direct charge model** with 15% platform fees
- **Standard v1 Account API** for account creation and management

## Why Migrate to Accounts v2?

### 1. **Future-Proofing**
- Stripe is actively developing v2 as the future of Connect
- New features will likely be v2-exclusive
- Better long-term support and updates

### 2. **Enhanced Flexibility for NovaTrek**
- **Multiple configurations per account**: An expert could start as just receiving payments, then upgrade to issuing payments (for sub-contractors)
- **Better entity management**: Support for different business structures (sole proprietors, LLCs, etc.)
- **Granular capabilities**: More precise control over what experts can do

### 3. **Improved Expert Experience**
- Smoother onboarding with better data collection
- More accurate tax and compliance handling
- Better support for international experts

### 4. **Platform Benefits**
- **Unified account management**: Single account can handle multiple use cases
- **Better reporting**: More detailed account information
- **Enhanced compliance**: Improved KYC and regulatory compliance

## Implementation Scope

### What Needs to Change

1. **Account Creation** (`/api/marketplace/seller/onboard`)
   ```typescript
   // Current (v1)
   const account = await stripe.accounts.create({
     type: 'express',
     country: 'US',
     capabilities: {
       card_payments: { requested: true },
       transfers: { requested: true }
     }
   });

   // New (v2)
   const account = await stripe.accounts.create({
     controller: {
       type: 'platform'
     },
     country: 'US',
     entity: {
       type: 'individual' // or 'company'
     },
     configurations: {
       merchant: {
         capabilities: {
           card_payments: { requested: true },
           transfers: { requested: true }
         }
       }
     }
   });
   ```

2. **Account Retrieval** (All API calls need to include configurations)
   ```typescript
   // Need to explicitly include configurations
   const account = await stripe.accounts.retrieve(accountId, {
     include: ['configurations.merchant']
   });
   ```

3. **Webhook Handling**
   - Update webhook handlers to parse v2 account structure
   - Handle new event types specific to v2

4. **Database Schema**
   - No major changes needed
   - Might want to add fields for configuration types

### Migration Strategy

#### Phase 1: Preparation (1 week)
1. Create v2-compatible account creation endpoints
2. Update webhook handlers to support both v1 and v2
3. Add feature flag for v2 accounts
4. Test thoroughly with Stripe test mode

#### Phase 2: New Experts (2 weeks)
1. Enable v2 for all new expert signups
2. Monitor and fix any issues
3. Gather feedback from new experts

#### Phase 3: Existing Expert Migration (1 month)
1. Gradually migrate existing experts
2. Use Stripe's migration tools
3. Communicate changes to experts
4. Provide support during transition

### Do Travelers Need Accounts v2?

**No**, travelers (buyers) don't need Stripe Connect accounts. They only need:
- Payment methods (cards) saved to their customer profiles
- Standard Stripe Customer objects (not Connect accounts)

Connect accounts are only for **experts** who receive payments.

## Cost-Benefit Analysis

### Benefits
✅ Future-proof architecture
✅ Better scalability for platform growth
✅ Enhanced compliance and international support
✅ More flexible account configurations
✅ Improved expert onboarding experience

### Costs
⚠️ Development time: ~2-4 weeks
⚠️ Testing and QA effort
⚠️ Potential bugs during migration
⚠️ Learning curve for team

## Recommendation

**Proceed with migration to Accounts v2** with the following approach:

1. **Start with new experts**: Implement v2 for new expert onboarding first
2. **Gradual migration**: Move existing experts over time
3. **Feature flag control**: Use flags to control rollout
4. **Maintain backward compatibility**: Support both v1 and v2 during transition

## Implementation Checklist

- [ ] Update account creation endpoints
- [ ] Modify account retrieval calls to include configurations
- [ ] Update webhook handlers for v2 structure
- [ ] Create migration scripts for existing accounts
- [ ] Update documentation and guides
- [ ] Test with various account types and countries
- [ ] Plan communication to existing experts
- [ ] Set up monitoring for v2-specific metrics

## Code Examples

### Creating an Expert Account (v2)
```typescript
async function createExpertAccountV2(expertData: ExpertOnboardingData) {
  const account = await stripe.accounts.create({
    controller: {
      type: 'platform',
      onboarding: {
        enabled: true
      }
    },
    country: expertData.country || 'US',
    email: expertData.email,
    entity: {
      type: expertData.businessType || 'individual',
      // Add business information if company
      ...(expertData.businessType === 'company' && {
        company: {
          name: expertData.businessName
        }
      })
    },
    configurations: {
      merchant: {
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        payout_schedule: {
          interval: expertData.payoutSchedule || 'daily'
        }
      }
    }
  });

  return account;
}
```

### Retrieving Account Information (v2)
```typescript
async function getExpertAccountV2(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId, {
    include: ['configurations.merchant', 'entity']
  });
  
  // Access configuration-specific data
  const merchantConfig = account.configurations?.merchant;
  const capabilities = merchantConfig?.capabilities;
  
  return {
    account,
    canAcceptPayments: capabilities?.card_payments?.active,
    canReceivePayouts: capabilities?.transfers?.active
  };
}
```

## Next Steps

1. Review this analysis with the team
2. Create detailed technical specifications
3. Set up a test environment with v2
4. Begin Phase 1 implementation
5. Plan expert communication strategy

## Resources

- [Stripe Accounts v2 Documentation](https://docs.stripe.com/connect/accounts-v2/api)
- [Migration Guide](https://docs.stripe.com/connect/accounts-v2/migration)
- [API Reference](https://docs.stripe.com/api/accounts/create)