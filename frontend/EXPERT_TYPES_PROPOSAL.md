# NovaTrek Expert Types Proposal

## Overview
Extend the marketplace to support different types of travel experts beyond individual consultants.

## Proposed Expert Types

### 1. Individual Expert (current default)
- Personal travel consultants
- Solo travel planners
- Destination specialists

### 2. Travel Agency
- Multiple agents under one account
- Business entity verification
- Team member management
- Agency-specific offerings:
  - Package deals
  - Group bookings
  - Corporate travel
  - Visa assistance

### 3. Travel Influencer
- Social media content creators
- Verification requirements:
  - Minimum follower count (e.g., 10k+)
  - Engagement rate metrics
  - Platform verification
- Products:
  - Sponsored content
  - Travel guides
  - Photo/video packages
  - Meet-and-greet experiences

### 4. Travel Blogger
- Written content specialists
- Requirements:
  - Active blog with traffic metrics
  - Content quality standards
  - SEO performance
- Products:
  - In-depth destination guides
  - Travel itineraries
  - Blog post packages
  - SEO-optimized content

### 5. Tour Operator
- Licensed tour companies
- Requirements:
  - Business license
  - Insurance verification
  - Safety certifications
- Products:
  - Physical tours
  - Multi-day packages
  - Adventure experiences
  - Transportation included

### 6. DMO (Destination Marketing Organization)
- Official tourism boards and visitor bureaus
- Requirements:
  - Government/official affiliation
  - Destination authority verification
  - Non-profit status (if applicable)
- Products:
  - Official destination guides
  - Event calendars
  - Visitor passes/cards
  - Local expert connections
  - Promotional packages
- Special features:
  - Verified badge for official status
  - Direct API integration for events/attractions
  - Multi-language support
  - Regional expertise showcase

### 7. Hotel/Resort
- Accommodation providers
- Requirements:
  - Property verification
  - Business license
  - Star rating/certification
  - Guest review integration
- Products:
  - Stay packages
  - Experience packages (stay + activities)
  - Concierge services
  - Local area guides
  - Restaurant/spa bookings
- Special features:
  - Room inventory integration
  - Dynamic pricing
  - Seasonal packages
  - Loyalty program integration

## Implementation Approach

### 1. Update TravelExpert Model
```typescript
export interface TravelExpert {
  // ... existing fields
  expertType: 'individual' | 'agency' | 'influencer' | 'blogger' | 'tour_operator' | 'dmo' | 'hotel';
  
  // Type-specific fields
  agencyDetails?: {
    companyRegistration: string;
    numberOfAgents: number;
    establishedYear: number;
    licenses: string[];
  };
  
  influencerMetrics?: {
    platforms: {
      instagram?: { followers: number; engagement: number; };
      youtube?: { subscribers: number; views: number; };
      tiktok?: { followers: number; engagement: number; };
    };
    verifiedAccounts: string[];
    mediaKit?: string; // URL to media kit
  };
  
  bloggerInfo?: {
    blogUrl: string;
    monthlyVisitors: number;
    domainAuthority: number;
    primaryNiche: string[];
  };
  
  tourOperatorDetails?: {
    licenseNumber: string;
    insuranceProvider: string;
    safetyRating: number;
    fleetSize?: number;
    operatingRegions: string[];
  };
  
  dmoDetails?: {
    officialName: string;
    governmentAffiliation: string;
    region: string;
    tourismWebsite: string;
    annualVisitors: number;
    languages: string[];
    certifications: string[];
  };
  
  hotelDetails?: {
    propertyName: string;
    propertyType: 'hotel' | 'resort' | 'boutique' | 'hostel' | 'vacation_rental';
    starRating: number;
    numberOfRooms: number;
    amenities: string[];
    chainAffiliation?: string;
    tripadvisorRating?: number;
    bookingSystemIntegration?: string;
  };
}
```

### 2. Different Application Processes
- Individual: Current process
- Agency: Business verification, tax ID, company docs
- Influencer: Social media audit, engagement verification
- Blogger: Content review, traffic verification
- Tour Operator: License verification, insurance proof
- DMO: Official status verification, government affiliation
- Hotel: Property verification, business license, guest review integration

### 3. Type-Specific Products
Allow different product types based on expert type:
- Agencies can offer complex packages
- Influencers can offer content creation
- Bloggers can offer written guides
- Tour operators can offer physical experiences
- DMOs can offer destination passes, official guides, event tickets
- Hotels can offer stay packages, experiences, dining packages

### 4. Commission Structure
Different commission rates by type:
- Individual: 15-20%
- Agency: 10-15% (volume-based)
- Influencer: 20-25% (higher marketing value)
- Blogger: 15-20%
- Tour Operator: 15-20%
- DMO: 5-10% (non-profit/promotional focus)
- Hotel: 10-15% (competitive with OTA rates)

### 5. Display Differentiation
- Different badges/icons by type
- Type-specific profile sections
- Filtered marketplace views
- Type-specific search filters

## Benefits
1. **For Travelers**: More diverse expertise and services
2. **For Experts**: Better representation of their business model
3. **For Platform**: Broader market appeal, more revenue streams
4. **For SEO**: Different content types and keywords

## Special Considerations

### DMO Integration Benefits
- **Official Information**: Verified, up-to-date destination info
- **Event Integration**: Real-time event calendars and festivals
- **Local Partnerships**: Connect travelers with vetted local businesses
- **Promotional Rates**: Special deals for NovaTrek users
- **Multi-language Support**: Official translations

### Hotel Integration Benefits
- **Direct Booking**: Better rates than OTAs
- **Package Creation**: Combine stays with experiences
- **Concierge Services**: Pre-arrival planning
- **Loyalty Integration**: Earn/use hotel points
- **Real-time Availability**: Live inventory updates

## Next Steps
1. Update database schema
2. Create type-specific application forms
3. Design verification workflows
4. Update UI for different expert types
5. Implement type-specific features