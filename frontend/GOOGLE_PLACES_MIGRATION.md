# Google Places API Migration Guide

## Overview
Google has deprecated the `PlacesService` API as of March 1st, 2025. This guide helps migrate to the new `Place` API.

## Changes Made

### 1. Updated Google Maps Loader
- Added `loading=async` parameter to improve performance
- File: `/lib/google-places/loader.ts`

### 2. Created New Google Places Client (v2)
- New client using the modern `Place` API
- File: `/lib/google-places/client-v2.ts`
- Uses `google.maps.importLibrary("places")` for dynamic loading
- Updated methods:
  - `getPlaceDetails()` now uses `Place.fetchFields()`
  - `searchActivities()` now uses `Place.searchNearby()`

### 3. Created New Hook
- File: `/hooks/use-google-places-v2.ts`
- Drop-in replacement for the old hook
- Same interface, new implementation

### 4. Updated Components
- `EditDestinationsDialog.tsx` - Updated to use new hook
- `DestinationDateStep.tsx` - Updated to use new hook

## Migration Steps for Remaining Components

1. **Update imports:**
   ```typescript
   // Old
   import { useGooglePlaces } from '@/hooks/use-google-places';
   
   // New
   import { useGooglePlacesV2 } from '@/hooks/use-google-places-v2';
   ```

2. **Update hook usage:**
   ```typescript
   // Old
   const { searchPlaces } = useGooglePlaces();
   
   // New
   const { searchDestinations, searchActivities } = useGooglePlacesV2();
   ```

3. **Update type definitions:**
   - Replace `google.maps.places.PlaceResult` with `Destination` type
   - Update property access (e.g., `place.place_id` → `place.id`)

## Benefits
- Better performance with async loading
- Modern API with better support
- Cleaner code with proper TypeScript types
- Future-proof implementation

## Notes
- The old `PlacesService` will continue to work for existing customers but won't receive new features
- At least 12 months notice will be given before discontinuation
- All new implementations should use the v2 client