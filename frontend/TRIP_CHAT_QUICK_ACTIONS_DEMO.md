# Trip Chat Quick Actions Demo

## Overview
The Trip Chat now includes Quick Action buttons that provide instant, context-aware assistance using Google Places API integration.

## Features Implemented

### 1. Quick Action Buttons
Located above the chat input, these buttons provide one-click access to common travel needs:

- **🍽️ Find Nearby Food**: Searches for restaurants near current activities with dietary preference filtering
- **🧭 Get Directions**: Provides transport options and routing information
- **📸 Find Photo Spots**: Discovers scenic viewpoints and photogenic locations
- **☁️ Weather Check**: Gets weather forecasts for activity locations

### 2. Google Places Integration
- **Smart Restaurant Search**: 
  - Filters by dietary restrictions (vegan, vegetarian, gluten-free, etc.)
  - Considers budget preferences (price level filtering)
  - Shows ratings, distance, and direct Google Maps links

- **Photo Spot Discovery**:
  - Finds tourist attractions, viewpoints, and parks
  - Prioritizes highly-rated locations with photos
  - Perfect for photography enthusiasts

### 3. Context Awareness
The quick actions adapt based on:
- **Current Activity**: Uses the location of upcoming activities for targeted searches
- **User Preferences**: Applies dietary restrictions and interests automatically
- **Trip Progress**: Suggests actions based on what's needed (empty time slots, missing meals)

## How It Works

### Example 1: Finding Restaurants
```typescript
// User clicks "Find Nearby Food" while viewing Day 2 activities
// System detects:
// - Current activity: "Eiffel Tower Visit" at 2:00 PM
// - User preference: Vegetarian
// - Budget: Mid-range

// Quick action generates:
"Here are some restaurants near Eiffel Tower:

1. **Le Jules Verne** ⭐ 4.5 (0.1 km) 💰💰💰
   📍 [View on Maps](https://maps.google.com/?q=...)
   
2. **Café de l'Homme** ⭐ 4.3 (0.3 km) 💰💰
   📍 [View on Maps](https://maps.google.com/?q=...)
   
3. **Les Ombres** ⭐ 4.4 (0.5 km) 💰💰
   📍 [View on Maps](https://maps.google.com/?q=...)"
```

### Example 2: Photo Spots
```typescript
// User clicks "Find Photo Spots" near their hotel
// System searches for scenic locations within 2km

// Quick action generates:
"Here are the best photo spots near your location:

1. **Trocadéro Gardens** ⭐ 4.7 (0.8 km)
   Perfect for Eiffel Tower photos at sunrise
   
2. **Pont Alexandre III** ⭐ 4.8 (1.2 km)
   Ornate bridge with golden statues
   
3. **Arc de Triomphe Rooftop** ⭐ 4.6 (1.5 km)
   360° city views"
```

## Implementation Details

### Components
1. **QuickActions.tsx**: Main UI component with action buttons
2. **quick-actions.ts**: Google Places service for searches
3. **quick-search/route.ts**: API endpoint for secure Places API calls

### Smart Features
- **Fallback Support**: If Google Places fails, generates intelligent text prompts
- **Loading States**: Visual feedback during API calls
- **Error Handling**: Graceful degradation with toast notifications
- **Mobile Optimized**: Responsive design with abbreviated labels on small screens

## Usage in Chat

1. **Direct API Results**: When location data is available, real Places API results are shown
2. **Smart Prompts**: Without location data, generates contextual questions for the AI
3. **Auto-Send**: Results are automatically sent to the chat for immediate processing

## Future Enhancements
- [ ] Offline caching of popular searches
- [ ] Integration with booking platforms
- [ ] Real-time availability checking
- [ ] Multi-language support
- [ ] Voice input for actions