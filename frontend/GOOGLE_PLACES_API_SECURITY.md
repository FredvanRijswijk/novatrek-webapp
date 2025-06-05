# Google Places API Security Configuration

## API Key Security

Since the Google Places API key is exposed in the frontend (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY), it's crucial to properly restrict it for security.

### Required API Key Restrictions

1. **Application Restrictions**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Select your API key
   - Under "Application restrictions", choose "HTTP referrers"
   - Add these referrers:
     ```
     https://yourdomain.com/*
     https://www.yourdomain.com/*
     http://localhost:3000/*  (for development)
     ```

2. **API Restrictions**
   - Under "API restrictions", select "Restrict key"
   - Enable only these APIs:
     - Places API (New)
     - Maps JavaScript API (if using maps visualization)

### New Places API Features

The upgraded implementation uses the new Google Places API (2023) which offers:

- **Text Search**: For destination and activity searches
- **Nearby Search**: For finding activities near a location
- **Photo API**: For retrieving place photos

### Environment Variables

Add to `.env.local`:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_restricted_api_key_here
```

### Usage Examples

1. **Destination Search**
   ```typescript
   const { searchDestinations } = useGooglePlacesNew();
   const destinations = await searchDestinations("Paris");
   ```

2. **Activity Search**
   ```typescript
   const { searchActivities } = useGooglePlacesNew();
   
   // Search by query near a location
   const activities = await searchActivities(
     { lat: 48.8566, lng: 2.3522 },
     "museums"
   );
   
   // Search by types near a location
   const restaurants = await searchActivities(
     { lat: 48.8566, lng: 2.3522 },
     undefined,
     ["restaurant", "cafe"]
   );
   ```

### API Endpoints Used

- **Text Search**: `POST https://places.googleapis.com/v1/places:searchText`
- **Nearby Search**: `POST https://places.googleapis.com/v1/places:searchNearby`
- **Photos**: `GET https://places.googleapis.com/v1/{photo_name}/media`

### Billing Considerations

The new Places API uses a different pricing model:
- Text Search: $32 per 1,000 requests
- Nearby Search: $32 per 1,000 requests
- Place Photos: $7 per 1,000 requests

Set up billing alerts and quotas in Google Cloud Console to prevent unexpected charges.

### Migration Notes

The old implementation used:
- `google.maps.places.AutocompleteService`
- `google.maps.places.PlacesService`
- Required loading the Maps JavaScript API

The new implementation:
- Uses REST API endpoints directly
- No need to load JavaScript libraries
- Better performance and modern API features
- More predictable pricing