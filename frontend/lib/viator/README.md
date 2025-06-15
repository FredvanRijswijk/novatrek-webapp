# Viator Integration

## Overview
This integration allows NovaTrek users to search and add Viator tours and activities to their trip itineraries. Activities are added as affiliate links, generating commission revenue.

## Setup

### 1. Environment Variables
Add the following to your `.env.local` file:

```bash
# Viator API Configuration
VIATOR_API_KEY=your_viator_api_key_here
VIATOR_API_URL=https://api.sandbox.viator.com/partner
NEXT_PUBLIC_VIATOR_AFFILIATE_ID=your_affiliate_id_here
```

For production, change `VIATOR_API_URL` to `https://api.viator.com/partner`

### 2. Access Level
- Current: Basic Access Affiliate Partner
- Available endpoints: Product search, product details, attractions
- Future upgrade path for direct booking capability

## Architecture

### Client-Side Components
- `components/viator/ActivitySearch.tsx` - Search UI modal
- Uses API route to proxy requests (keeps API key secure)

### Server-Side API
- `app/api/viator/search/route.ts` - Product search proxy
- `lib/viator/api/` - API client and services
- `lib/viator/types/` - TypeScript type definitions
- `lib/viator/utils/` - Data transformation utilities

### Data Flow
1. User clicks "Browse Tours & Activities" in trip planner
2. Search modal opens with destination pre-filled
3. API route proxies search to Viator API
4. Results displayed with pricing and ratings
5. Selected activities converted to NovaTrek format
6. Activities saved with affiliate links
7. "Book on Viator" button opens affiliate URL

## Features

### Activity Search
- Destination-aware search
- Filters: price, duration, rating
- Sort options: top sellers, rating, price
- Real-time availability for trip dates

### Activity Display
- Viator badge identifies external activities
- Pricing shown as "From $X per person"
- Ratings and review counts
- Activity photos
- "Book on Viator" affiliate link

### Revenue Model
- Affiliate commission (5-8% typical)
- Cookie-based attribution
- No payment processing required

## Usage

### For Users
1. Open trip itinerary
2. Click "Add Activity" → "Browse Tours & Activities"
3. Search and filter activities
4. Click activity to add to itinerary
5. Click "Book on Viator" when ready to purchase

### For Developers
```typescript
// Check if Viator is configured
import { validateViatorConfig } from '@/lib/viator/config';
if (validateViatorConfig()) {
  // Show Viator options
}

// Search for activities
const response = await fetch('/api/viator/search', {
  method: 'POST',
  body: JSON.stringify({
    destination: 'Paris',
    startDate: '2024-06-01',
    sorting: 'TOP_SELLERS',
    pagination: { offset: 0, limit: 20 }
  })
});

// Convert to NovaTrek activity
import { viatorProductToActivity } from '@/lib/viator/utils/mappers';
const activity = viatorProductToActivity(product, dayId, tripId);
```

## Testing

### Sandbox Environment
- Use sandbox API URL for testing
- Test affiliate links to ensure tracking
- Verify activity data mapping

### Production Checklist
- [ ] Update API URL to production
- [ ] Verify affiliate ID is correct
- [ ] Test commission tracking
- [ ] Monitor API rate limits
- [ ] Set up error alerting

## Future Enhancements

### Phase 2
- Availability calendar integration
- Price alerts for activities
- Bulk activity import
- Weather-based recommendations

### Phase 3 (Requires API Upgrade)
- Direct booking within NovaTrek
- Booking management
- Cancellation handling
- Customer support integration

## Troubleshooting

### Common Issues
1. **No results**: Check destination spelling matches Viator's format
2. **API errors**: Verify API key and rate limits
3. **Missing prices**: Some activities have request-only pricing
4. **Broken images**: Viator image URLs may expire

### Debug Mode
Set `VIATOR_DEBUG=true` in environment to enable detailed logging