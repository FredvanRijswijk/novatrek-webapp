# Hotel Search and Booking Feature

## Overview
The NovaTrek platform now supports searching for and adding hotels/accommodations to trip itineraries through both the Google Places search and AI chat interface.

## Features

### 1. Google Places Hotel Search
- Added accommodation types to the Google Places API mapping:
  - `lodging`, `hotel`, `motel`, `resort`, `guest_house`, `hostel`, `bed_and_breakfast`
- Updated the ActivitySearchModal to prominently feature hotel search
- Hotels appear with a 🏨 emoji and "Hotel" badge for easy identification

### 2. AI Chat Hotel Support
When the AI suggests hotels in the trip planning chat:
- Hotels are automatically detected based on:
  - `type: 'accommodation'` or `type: 'hotel'`
  - Name containing "hotel" or "accommodation"
- Hotels are saved as accommodations (not activities) with:
  - Check-in/check-out dates matching the trip dates
  - Per-night pricing displayed
  - No time slot requirements (unlike activities)

### 3. Visual Enhancements
- Hotel emoji (🏨) appears next to hotel names
- Special "Hotel" badge to distinguish from activities
- Cost displayed as "per night" for accommodations
- No time editing for hotels (they span the entire stay)

## Implementation Details

### API Changes
```typescript
// Added to activityTypeToPlaceTypes in /api/activities/search/route.ts
accommodation: ['lodging', 'hotel', 'motel', 'resort', 'guest_house', 'hostel', 'bed_and_breakfast']
```

### TripChat Component
- Enhanced `applyItineraryToTrip` function to detect hotels
- Hotels are saved using `TripModel.addAccommodation()` instead of `addActivity()`
- Visual indicators for hotel type activities

### TripModel Enhancement
- Added `addAccommodation` method to properly store hotel data
- Accommodations are stored in the `accommodations` array within each day's itinerary

## Usage

### For Users
1. **Via Search**: 
   - Open the activity search modal
   - Search for "hotels" or select "Accommodation" type
   - Select and add hotels to your itinerary

2. **Via AI Chat**:
   - Ask the AI: "Find hotels for 4 nights in [destination]"
   - Review the suggested hotels
   - Click "View & Select Activities" 
   - Check the hotels you want to add
   - Click "Save Selected Activities"

### Future Enhancements
- Display accommodations separately in the itinerary view
- Add check-in/check-out time fields
- Support for booking links and reservation management
- Multi-night pricing calculations
- Room type and amenity filters