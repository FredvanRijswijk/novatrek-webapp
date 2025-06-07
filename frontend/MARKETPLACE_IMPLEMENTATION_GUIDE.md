# NovaTrek Marketplace Implementation Guide

## Quick Start

This guide provides step-by-step instructions for implementing the NovaTrek marketplace with Stripe Connect.

## Prerequisites

1. **Stripe Account Setup**
   - Log into Stripe Dashboard
   - Enable Connect: Settings → Connect Settings
   - Configure platform settings:
     - Platform name: NovaTrek
     - Support email/phone
     - Dashboard branding

2. **Environment Variables**
   Add these to your `.env.local`:
   ```
   # Existing Stripe keys
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   
   # Connect webhook endpoint secret (create in Stripe Dashboard)
   STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...
   
   # Platform fee percentage (0.15 = 15%)
   PLATFORM_FEE_PERCENTAGE=0.15
   ```

## Implementation Steps

### Phase 1: Travel Expert Onboarding

1. **Create Application Form** (`/dashboard/become-expert`)
   ```tsx
   // components/marketplace/ExpertApplicationForm.tsx
   - Business name, experience, specializations
   - Portfolio links, references
   - Submit to marketplace_applications collection
   ```

2. **Admin Approval Process** (manual initially)
   - Review applications in Firebase Console
   - On approval, create Connect account
   - Create expert profile in marketplace_experts

3. **Connect Onboarding Flow**
   ```tsx
   // app/api/marketplace/seller/onboard/route.ts
   - Create Connect Express account
   - Generate account link
   - Redirect to Stripe onboarding
   - Handle return URL
   ```

### Phase 2: Product Management

1. **Expert Dashboard** (`/dashboard/expert`)
   ```tsx
   // components/marketplace/ExpertDashboard.tsx
   - Profile management
   - Product listing
   - Sales analytics
   - Earnings overview
   ```

2. **Product Creation**
   ```tsx
   // components/marketplace/ProductForm.tsx
   - Trip template details
   - Pricing, duration, destinations
   - Image upload
   - Save to marketplace_products
   ```

### Phase 3: Consumer Marketplace

1. **Marketplace Homepage** (`/marketplace`)
   ```tsx
   // app/marketplace/page.tsx
   - Featured products
   - Search/filter
   - Category browsing
   ```

2. **Product Detail Page** (`/marketplace/products/[id]`)
   ```tsx
   // app/marketplace/products/[id]/page.tsx
   - Product details
   - Expert profile
   - Reviews
   - Purchase button
   ```

3. **Checkout Flow**
   ```tsx
   // app/api/marketplace/transactions/create-payment-intent/route.ts
   - Create Connect payment intent
   - Apply platform fee
   - Handle success/failure
   ```

## API Endpoints to Implement

### Seller APIs
```
POST   /api/marketplace/seller/apply          - Submit application
POST   /api/marketplace/seller/onboard        - Start Connect onboarding  
GET    /api/marketplace/seller/dashboard-link - Access Connect dashboard
GET    /api/marketplace/seller/profile        - Get expert profile
PUT    /api/marketplace/seller/profile        - Update profile
GET    /api/marketplace/seller/balance        - Get account balance
```

### Product APIs
```
POST   /api/marketplace/products              - Create product
GET    /api/marketplace/products              - List products
GET    /api/marketplace/products/[id]         - Get product details
PUT    /api/marketplace/products/[id]         - Update product
DELETE /api/marketplace/products/[id]         - Delete product
GET    /api/marketplace/products/search       - Search products
```

### Transaction APIs
```
POST   /api/marketplace/checkout              - Create checkout session
POST   /api/marketplace/transactions/confirm  - Confirm payment
POST   /api/marketplace/transactions/refund   - Process refund
GET    /api/marketplace/transactions          - List transactions
```

### Review APIs
```
POST   /api/marketplace/reviews               - Create review
GET    /api/marketplace/reviews/product/[id]  - Get product reviews
PUT    /api/marketplace/reviews/[id]          - Update review
POST   /api/marketplace/reviews/[id]/respond  - Seller response
```

## Component Structure

```
components/
  marketplace/
    expert/
      ExpertApplicationForm.tsx
      ExpertDashboard.tsx
      ProductForm.tsx
      EarningsChart.tsx
      PayoutSettings.tsx
    consumer/
      ProductCard.tsx
      ProductGrid.tsx
      ProductDetail.tsx
      CheckoutForm.tsx
      ReviewForm.tsx
      ReviewList.tsx
    shared/
      ExpertProfile.tsx
      PriceDisplay.tsx
      RatingStars.tsx
```

## Testing Checklist

### Expert Onboarding
- [ ] Application submission
- [ ] Stripe Connect account creation
- [ ] Onboarding completion
- [ ] Dashboard access

### Product Management
- [ ] Create product (all types)
- [ ] Edit product
- [ ] Toggle product status
- [ ] Delete product

### Purchase Flow
- [ ] Browse marketplace
- [ ] Search/filter products
- [ ] View product details
- [ ] Complete purchase
- [ ] Platform fee calculation
- [ ] Order confirmation

### Financial Operations
- [ ] View earnings
- [ ] Check balance
- [ ] Request payout
- [ ] View transaction history

### Reviews
- [ ] Submit review (verified purchase only)
- [ ] View reviews
- [ ] Seller response

## Security Considerations

1. **API Authentication**
   - Verify user is authenticated
   - Check expert status for seller endpoints
   - Validate ownership for updates/deletes

2. **Payment Security**
   - Server-side payment intent creation
   - Webhook signature verification
   - Secure metadata handling

3. **Data Validation**
   - Input sanitization
   - Price validation (positive, within limits)
   - Image upload restrictions

## Monitoring & Analytics

1. **Key Metrics**
   - Total GMV (Gross Merchandise Value)
   - Active sellers/products
   - Conversion rates
   - Average order value
   - Platform revenue

2. **Error Tracking**
   - Failed payments
   - Onboarding issues
   - API errors

3. **Performance**
   - Page load times
   - Search performance
   - Checkout completion rate

## Next Steps

1. Set up Stripe Connect in Dashboard
2. Deploy updated Firestore rules
3. Implement expert application form
4. Build onboarding API
5. Create expert dashboard
6. Add product management
7. Build consumer marketplace
8. Implement checkout flow
9. Add review system
10. Launch beta with select experts