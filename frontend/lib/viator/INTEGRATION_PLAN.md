# Viator API Integration Plan for NovaTrek

## Overview
Integrate Viator's tours and experiences into NovaTrek to provide users with bookable activities and generate revenue through affiliate commissions.

## Access Level
- **Basic Access Affiliate Partner** (current)
- Available endpoints: Product search, product details, attractions, destinations, exchange rates
- Future upgrade path: Full-access Affiliate → Full-access + Booking Affiliate

## Integration Phases

### Phase 1: Core Integration (Current Sprint)
1. **API Client Setup**
   - Create reusable API client with authentication
   - Implement error handling and rate limiting
   - Add sandbox/production environment configuration

2. **Activity Search Integration**
   - Connect Viator search to existing trip destinations
   - Map Viator products to NovaTrek activities
   - Implement real-time search within trip planning

3. **Product Display**
   - Show Viator activities in trip itinerary builder
   - Display pricing, duration, and ratings
   - Include product photos and descriptions

4. **Affiliate Link Generation**
   - Generate tracked affiliate URLs for bookings
   - Implement "Book on Viator" buttons
   - Track click-through analytics

### Phase 2: Enhanced Features
1. **Availability Checking**
   - Real-time availability for selected dates
   - Price variations by date/time
   - Group size pricing

2. **Smart Recommendations**
   - AI-powered activity suggestions based on trip context
   - Popular activities for destination
   - Weather-appropriate suggestions

3. **Caching Strategy**
   - Cache popular destinations/activities
   - Implement smart cache invalidation
   - Reduce API calls and improve performance

### Phase 3: Monetization Optimization
1. **Commission Tracking**
   - Track affiliate link clicks
   - Monitor conversion rates
   - Revenue reporting dashboard

2. **User Experience Enhancements**
   - Seamless integration with trip planning flow
   - Activity collections and wishlists
   - Price comparison with manual activities

3. **Upgrade Path Planning**
   - Requirements for booking API access
   - Direct booking implementation plan
   - Customer support integration

## Key Integration Points

### 1. Trip Planning Page
- Add "Find Activities" button in day view
- Show Viator suggestions alongside manual activities
- Quick add to itinerary with affiliate link

### 2. Activity Search Modal
- Destination-aware search
- Filter by category, price, duration, rating
- Map integration showing activity locations

### 3. Activity Details
- Full description and inclusions
- Reviews and ratings
- Pricing with "Book Now" CTA

### 4. AI Trip Assistant
- Include Viator activities in AI suggestions
- Smart scheduling based on duration
- Budget-aware recommendations

## Technical Architecture

### API Integration
```typescript
lib/viator/
├── api/
│   ├── client.ts          // Base API client
│   ├── products.ts        // Product search & details
│   ├── attractions.ts     // Attractions endpoints
│   └── availability.ts    // Availability checking
├── types/
│   ├── product.ts         // Product interfaces
│   ├── search.ts          // Search parameters
│   └── availability.ts    // Availability types
├── utils/
│   ├── mappers.ts         // Data transformation
│   ├── affiliate.ts       // Affiliate URL generation
│   └── cache.ts           // Caching utilities
└── components/
    ├── ActivitySearch.tsx  // Search UI
    ├── ActivityCard.tsx    // Display component
    └── BookingButton.tsx   // Affiliate CTA
```

### Data Flow
1. User searches for activities in destination
2. API client queries Viator with filters
3. Results mapped to NovaTrek activity format
4. Activities displayed with affiliate links
5. Clicks tracked and redirected to Viator

## Monetization Strategy

### Revenue Streams
1. **Affiliate Commissions** (5-8% typical)
   - Track conversion by destination
   - Optimize high-performing categories
   - Seasonal promotion alignment

2. **Premium Features** (Future)
   - Advanced activity filters
   - Exclusive deals access
   - Priority booking notifications

### Pricing Display
- Show Viator price as "From $X"
- Include affiliate disclosure
- Highlight special offers/discounts

## Success Metrics
1. **Integration Health**
   - API response times < 2s
   - Error rate < 1%
   - Cache hit rate > 70%

2. **User Engagement**
   - Activities viewed per trip
   - Click-through rate to Viator
   - Activities added to itinerary

3. **Revenue Metrics**
   - Conversion rate (clicks to bookings)
   - Average commission per trip
   - Revenue per active user

## Implementation Timeline
- Week 1: API client and basic search
- Week 2: UI integration and activity display
- Week 3: Affiliate tracking and analytics
- Week 4: Testing and optimization

## Next Steps
1. Set up Viator API credentials in environment
2. Create base API client with TypeScript types
3. Build activity search component
4. Integrate with trip planning workflow