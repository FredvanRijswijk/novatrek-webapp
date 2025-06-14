# Interactive Map Feature Setup Guide

## Overview
This guide explains how to set up and use the new interactive map features for NovaTrek, including day-by-day visualization, photo spots, and timeline view.

## Required NPM Packages

First, install these required dependencies:

```bash
npm install @react-google-maps/api framer-motion
```

### Package Details:
- **@react-google-maps/api** - Google Maps React components
- **framer-motion** - Smooth animations for timeline and transitions

## Components Created

### 1. **TripMapView** (`components/trips/planning/TripMapView.tsx`)
The main interactive map component with:
- Day-by-day navigation
- Activity markers with custom icons
- Auto-play tour feature
- Photo spot integration
- Activity cards with images
- Route visualization between activities

### 2. **PhotoSpotMarker** (`components/trips/planning/PhotoSpotMarker.tsx`)
Instagram-worthy location markers featuring:
- Gradient pink/purple camera icons
- Photo count badges
- Crowd level indicators
- Best time recommendations
- Pro photography tips
- Instagram handle links
- Add to trip functionality

### 3. **TimelineView** (`components/trips/planning/TimelineView.tsx`)
Time-based itinerary visualization with:
- Morning/Afternoon/Evening/Night groupings
- Travel time between activities
- Expandable activity details
- Cost summaries
- Visual timeline with connectors
- Smooth scroll to active activity

### 4. **TripPlanningMapIntegration** (`components/trips/planning/TripPlanningMapIntegration.tsx`)
Integration component that provides:
- Tab-based view switching (Map/List/Calendar/Grid)
- Photo grid view
- Seamless switching between visualizations

### 5. **usePhotoSpots** Hook (`hooks/use-photo-spots.ts`)
Custom hook for fetching photo spots:
- Google Places integration
- Curated Instagram spots
- Smart filtering by rating
- Crowd level analysis
- Photography tips

## Usage Example

```tsx
import { TripPlanningMapIntegration } from '@/components/trips/planning/TripPlanningMapIntegration';

// In your trip planning page
export default function TripPlanningPage() {
  const { fullTripData, refetch } = useFullTrip(tripId);
  
  return (
    <div className="h-screen flex flex-col">
      <TripPlanningMapIntegration
        fullTripData={fullTripData}
        onUpdate={refetch}
      />
    </div>
  );
}
```

## Features Highlights

### 🗺️ Interactive Map
- Smooth animations between days
- Custom activity markers with time-of-day icons
- Polyline routes with directional arrows
- Info windows with activity details
- Responsive design for all screen sizes

### 📸 Photo Spots
- Popular Instagram locations
- Photography tips and best times
- Crowd level indicators
- Direct Instagram links
- Beautiful gradient markers with pulse effects

### ⏰ Timeline View
- Visual time blocks (Morning/Afternoon/Evening/Night)
- Estimated travel times
- Expandable details
- Total cost calculations
- Smooth scrolling to active items

### 🖼️ Photo Grid View
- Instagram-style grid layout
- Hover effects with details
- Activity photos from Google Places

## Customization

### Map Styles
Modify the `mapStyles` array in `TripMapView.tsx` to customize the map appearance:

```tsx
const mapStyles = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  },
  // Add more style rules
];
```

### Activity Colors
Update the `activityColors` object to change marker colors by activity type:

```tsx
const activityColors = {
  sightseeing: '#3B82F6', // blue
  restaurant: '#EF4444',  // red
  // Add more types
};
```

### Photo Spots
Add destination-specific Instagram spots in `use-photo-spots.ts`:

```tsx
const spots: Record<string, PhotoSpot[]> = {
  'London': [
    {
      id: 'ig-london-1',
      name: 'Notting Hill Colorful Houses',
      location: { lat: 51.5074, lng: -0.1278 },
      // ... more properties
    }
  ]
};
```

## Performance Considerations

1. **Lazy Loading**: Map and timeline components load on demand
2. **Image Optimization**: Uses Google Places photo API with size parameters
3. **Marker Clustering**: Consider implementing for trips with many activities
4. **Animation Performance**: Uses CSS transforms for smooth 60fps animations

## Future Enhancements

1. **Offline Support**: Cache map tiles for offline viewing
2. **Real-time Updates**: WebSocket integration for group trips
3. **AR Mode**: Camera integration for AR navigation
4. **Weather Overlay**: Real-time weather on the map
5. **Traffic Integration**: Show real-time traffic for better planning

## Troubleshooting

### Google Maps API Key
Ensure your Google Maps API key has these APIs enabled:
- Maps JavaScript API
- Places API
- Geocoding API

### Performance Issues
- Reduce marker count by clustering
- Limit animation complexity on mobile
- Use smaller image sizes for activity cards

### Styling Issues
- Check Tailwind configuration
- Ensure dark mode classes are applied correctly
- Verify z-index values for overlays