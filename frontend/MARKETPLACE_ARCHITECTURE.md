# NovaTrek Marketplace Architecture with Stripe Connect

## Executive Summary

This document outlines the architecture for implementing a two-sided marketplace on NovaTrek where travel experts can sell trip templates and services. The platform will use Stripe Connect to handle payments, collect platform fees, and distribute earnings to travel partners.

## Architecture Overview

### 1. Marketplace Participants

**Consumers (Existing)**
- Purchase NovaTrek subscriptions (Free, Basic, Pro)
- Buy trip templates and services from travel experts
- Continue using existing AI-powered trip planning features

**Travel Experts (New)**
- Create seller accounts via Stripe Connect
- List trip templates and travel services
- Receive payouts after platform fee deduction
- Manage their products and earnings

**Platform (NovaTrek)**
- Facilitate transactions between consumers and travel experts
- Collect platform fees (suggested 15-20% per transaction)
- Handle compliance, tax reporting, and payouts
- Provide marketplace infrastructure

### 2. Stripe Connect Integration

**Account Types**
- Use Stripe Connect Express accounts for travel experts
- Express accounts provide balance, simplified onboarding, and Stripe handles compliance
- Platform maintains control over branding and user experience

**Payment Flow**
1. Consumer purchases trip template/service
2. Payment processed through Stripe Connect
3. Platform fee automatically deducted
4. Remaining amount transferred to travel expert's Stripe account
5. Travel expert can withdraw funds based on payout schedule

### 3. Database Schema Extensions

```typescript
// Travel Expert Profile
interface TravelExpert {
  id: string;
  userId: string; // Firebase Auth UID
  stripeConnectAccountId: string;
  businessName: string;
  bio: string;
  specializations: string[];
  rating: number;
  reviewCount: number;
  status: 'pending' | 'active' | 'suspended';
  onboardingComplete: boolean;
  payoutSchedule: 'daily' | 'weekly' | 'monthly';
  createdAt: Date;
  updatedAt: Date;
}

// Marketplace Products
interface MarketplaceProduct {
  id: string;
  expertId: string;
  type: 'trip_template' | 'consultation' | 'custom_planning';
  title: string;
  description: string;
  price: number; // in cents
  currency: string;
  duration?: string; // for services
  destinations?: string[]; // for trip templates
  included: string[];
  images: string[];
  status: 'draft' | 'active' | 'inactive';
  salesCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

// Marketplace Transactions
interface MarketplaceTransaction {
  id: string;
  stripePaymentIntentId: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  amount: number; // total amount in cents
  platformFee: number; // platform fee in cents
  sellerEarnings: number; // seller earnings in cents
  currency: string;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  transferId?: string; // Stripe transfer ID
  createdAt: Date;
  completedAt?: Date;
}

// Reviews
interface ProductReview {
  id: string;
  productId: string;
  buyerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}
```

### 4. Implementation Phases

**Phase 1: Foundation (Weeks 1-2)**
- Set up Stripe Connect in Stripe Dashboard
- Create travel expert onboarding flow
- Implement database models
- Build basic seller dashboard

**Phase 2: Product Management (Weeks 3-4)**
- Trip template creation interface
- Service listing management
- Product search and discovery
- Basic marketplace homepage

**Phase 3: Transaction Flow (Weeks 5-6)**
- Implement Connect payment processing
- Platform fee configuration
- Purchase flow for consumers
- Order management for sellers

**Phase 4: Financial Features (Weeks 7-8)**
- Payout management
- Earnings dashboard
- Transaction history
- Basic reporting

**Phase 5: Enhancement (Weeks 9-10)**
- Review system
- Advanced search filters
- Seller analytics
- Admin dashboard

### 5. Technical Implementation Details

**API Routes Structure**
```
/api/marketplace/
  /seller/
    /onboard - Start Connect onboarding
    /dashboard-link - Access Connect dashboard
    /profile - Manage seller profile
  /products/
    /create - Create new product
    /update - Update product
    /list - List seller's products
    /search - Search all products
  /transactions/
    /create-payment-intent - Create Connect payment
    /confirm - Confirm payment
    /refund - Process refund
  /payouts/
    /schedule - Update payout schedule
    /balance - Get account balance
  /admin/
    /sellers - Manage sellers
    /transactions - View all transactions
    /analytics - Platform analytics
```

**Stripe Connect Configuration**
```typescript
// Platform fee structure
const PLATFORM_FEE_PERCENTAGE = 0.15; // 15%

// Payment intent creation with Connect
const paymentIntent = await stripe.paymentIntents.create({
  amount: productPrice,
  currency: 'usd',
  application_fee_amount: Math.round(productPrice * PLATFORM_FEE_PERCENTAGE),
  transfer_data: {
    destination: sellerStripeAccountId,
  },
  metadata: {
    productId,
    buyerId,
    sellerId,
  }
});
```

### 6. Security Considerations

- Implement seller verification process
- PCI compliance through Stripe
- Secure handling of financial data
- Fraud detection and prevention
- Terms of service for marketplace participants
- Privacy policy updates

### 7. Compliance Requirements

- KYC (Know Your Customer) handled by Stripe
- Tax reporting (1099-K forms) automated by Stripe
- Seller agreement terms
- Refund and dispute policies
- Data retention policies

### 8. User Experience Flows

**Seller Onboarding**
1. Apply to become travel expert
2. Complete Stripe Connect onboarding
3. Create seller profile
4. List first products
5. Receive approval notification

**Consumer Purchase Flow**
1. Browse marketplace
2. Select trip template/service
3. Review seller profile and ratings
4. Complete purchase via Stripe
5. Access purchased content
6. Leave review

**Seller Management Flow**
1. Access seller dashboard
2. View earnings and analytics
3. Manage products
4. Handle customer inquiries
5. Request payouts

### 9. Integration with Existing Features

- Purchased trip templates integrate with AI trip planner
- Consultation bookings sync with calendar
- Email notifications via existing Resend integration
- Subscription tiers may include marketplace benefits
- Shared trips can reference purchased templates

### 10. Success Metrics

- Number of active sellers
- Total marketplace GMV (Gross Merchandise Value)
- Average transaction value
- Platform fee revenue
- Seller satisfaction score
- Buyer repeat purchase rate
- Product review ratings

### 11. Future Enhancements

- Multi-currency support
- Subscription-based seller services
- Bundled products
- Promotional tools for sellers
- Advanced analytics dashboard
- Mobile app integration
- API for third-party integrations

## Next Steps

1. Review and approve architecture
2. Set up Stripe Connect account
3. Begin Phase 1 implementation
4. Create detailed API specifications
5. Design UI/UX mockups
6. Establish seller onboarding criteria