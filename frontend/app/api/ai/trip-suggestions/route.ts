import { NextRequest, NextResponse } from 'next/server';
import { searchPlaces } from '@/lib/google-places/search';
import { getPlaceDetails } from '@/lib/google-places/details';

interface SuggestionRequest {
  destination: {
    name: string;
    place_id?: string;
    coordinates?: { lat: number; lng: number };
  };
  startDate: string;
  endDate: string;
  travelers: Array<{ name: string; relationship: string; age?: number }>;
  budget: { min: number; max: number; currency: string };
  travelStyle: string;
  activityTypes: string[];
  accommodationType: string;
}

interface AISuggestion {
  id: string;
  type: 'activity' | 'restaurant' | 'accommodation' | 'experience';
  title: string;
  description: string;
  location: string;
  estimatedCost: number;
  duration: string;
  category: string;
  reasoning: string;
  confidence: number;
  placeId?: string;
  photoUrl?: string;
  rating?: number;
  coordinates?: { lat: number; lng: number };
}

// Helper to estimate costs based on price level
function estimateCost(priceLevel: number | undefined, type: string, budget: number): number {
  const baseMultiplier = budget / 2000; // Adjust based on budget
  
  switch (type) {
    case 'accommodation':
      const hotelBase: Record<number, number> = { 0: 50, 1: 80, 2: 150, 3: 250, 4: 400 };
      return Math.round((hotelBase[priceLevel || 2] || 150) * baseMultiplier);
    case 'restaurant':
      const restaurantBase: Record<number, number> = { 0: 10, 1: 20, 2: 40, 3: 80, 4: 150 };
      return Math.round((restaurantBase[priceLevel || 2] || 40) * baseMultiplier);
    default:
      const activityBase: Record<number, number> = { 0: 0, 1: 10, 2: 25, 3: 50, 4: 100 };
      return Math.round((activityBase[priceLevel || 2] || 25) * baseMultiplier);
  }
}

// Helper to generate reasoning based on user preferences
function generateReasoning(place: any, preferences: any): string {
  const reasons = [];
  
  if (place.rating >= 4.5) {
    reasons.push('Highly rated by travelers');
  }
  
  if (preferences.activityTypes?.includes('photography') && place.types?.includes('point_of_interest')) {
    reasons.push('Great photography opportunities');
  }
  
  if (preferences.activityTypes?.includes('culture') && 
      (place.types?.includes('museum') || place.types?.includes('art_gallery'))) {
    reasons.push('Perfect for cultural exploration');
  }
  
  if (preferences.activityTypes?.includes('food') && place.types?.includes('restaurant')) {
    reasons.push('Authentic local cuisine experience');
  }
  
  if (preferences.travelStyle === 'budget' && (!place.priceLevel || place.priceLevel <= 1)) {
    reasons.push('Budget-friendly option');
  }
  
  if (preferences.travelStyle === 'luxury' && place.priceLevel >= 3) {
    reasons.push('Premium experience matching your travel style');
  }
  
  return reasons.length > 0 ? reasons.join('. ') : 'Recommended based on your preferences';
}

export async function POST(request: NextRequest) {
  try {
    const body: SuggestionRequest = await request.json();
    const { destination, budget, travelStyle, activityTypes, accommodationType } = body;
    
    if (!destination?.name) {
      return NextResponse.json(
        { error: 'Destination is required' },
        { status: 400 }
      );
    }

    const suggestions: AISuggestion[] = [];
    const location = destination.coordinates 
      ? `${destination.coordinates.lat},${destination.coordinates.lng}`
      : destination.name;

    // Search for activities/attractions
    const attractions = await searchPlaces(
      `tourist attractions in ${destination.name}`,
      'tourist_attraction',
      location,
      5000 // 5km radius
    );

    // Add top attractions
    for (let i = 0; i < Math.min(2, attractions.length); i++) {
      const place = attractions[i];
      suggestions.push({
        id: `activity-${i}`,
        type: 'activity',
        title: place.displayName?.text || place.name || 'Unknown Attraction',
        description: place.editorialSummary?.text || place.types?.join(', ') || 'Popular tourist attraction',
        location: place.formattedAddress || destination.name,
        estimatedCost: estimateCost(place.priceLevel, 'activity', budget.max),
        duration: '2-3 hours',
        category: 'cultural',
        reasoning: generateReasoning(place, { travelStyle, activityTypes }),
        confidence: 0.85 + (place.rating ? place.rating / 50 : 0),
        placeId: place.place_id,
        photoUrl: place.photos?.[0]?.photo_reference,
        rating: place.rating,
        coordinates: place.location
      });
    }

    // Search for restaurants
    const restaurants = await searchPlaces(
      `restaurants in ${destination.name}`,
      'restaurant',
      location,
      2000 // 2km radius
    );

    // Add top restaurant
    if (restaurants.length > 0) {
      const restaurant = restaurants[0];
      suggestions.push({
        id: 'restaurant-1',
        type: 'restaurant',
        title: restaurant.displayName?.text || restaurant.name || 'Local Restaurant',
        description: restaurant.editorialSummary?.text || 'Highly rated local dining',
        location: restaurant.formattedAddress || destination.name,
        estimatedCost: estimateCost(restaurant.priceLevel, 'restaurant', budget.max),
        duration: '1-2 hours',
        category: 'food',
        reasoning: generateReasoning(restaurant, { travelStyle, activityTypes }),
        confidence: 0.88,
        placeId: restaurant.place_id,
        photoUrl: restaurant.photos?.[0]?.photo_reference,
        rating: restaurant.rating,
        coordinates: restaurant.location
      });
    }

    // Search for accommodations
    const hotels = await searchPlaces(
      `${accommodationType || 'hotels'} in ${destination.name}`,
      'lodging',
      location,
      3000 // 3km radius
    );

    // Add accommodation suggestion
    if (hotels.length > 0) {
      const hotel = hotels.find(h => {
        // Try to match budget preferences
        if (travelStyle === 'budget') return !h.priceLevel || h.priceLevel <= 2;
        if (travelStyle === 'luxury') return h.priceLevel && h.priceLevel >= 3;
        return true;
      }) || hotels[0];

      suggestions.push({
        id: 'accommodation-1',
        type: 'accommodation',
        title: hotel.displayName?.text || hotel.name || 'Recommended Hotel',
        description: hotel.editorialSummary?.text || 'Well-located accommodation',
        location: hotel.formattedAddress || destination.name,
        estimatedCost: estimateCost(hotel.priceLevel, 'accommodation', budget.max),
        duration: 'per night',
        category: 'accommodation',
        reasoning: generateReasoning(hotel, { travelStyle, accommodationType }),
        confidence: 0.85,
        placeId: hotel.place_id,
        photoUrl: hotel.photos?.[0]?.photo_reference,
        rating: hotel.rating,
        coordinates: hotel.location
      });
    }

    // Search for unique experiences based on interests
    if (activityTypes.includes('photography')) {
      const photoSpots = await searchPlaces(
        `best photography spots viewpoints in ${destination.name}`,
        'point_of_interest',
        location,
        5000
      );
      
      if (photoSpots.length > 0) {
        const spot = photoSpots[0];
        suggestions.push({
          id: 'experience-1',
          type: 'experience',
          title: spot.displayName?.text || 'Scenic Viewpoint',
          description: 'Perfect spot for photography enthusiasts',
          location: spot.formattedAddress || destination.name,
          estimatedCost: 0,
          duration: '1 hour',
          category: 'photography',
          reasoning: 'Ideal for capturing stunning photos based on your photography interest',
          confidence: 0.90,
          placeId: spot.place_id,
          photoUrl: spot.photos?.[0]?.photo_reference,
          rating: spot.rating,
          coordinates: spot.location
        });
      }
    }

    // If we want to enhance with AI, we could call OpenAI here to:
    // 1. Better format the descriptions
    // 2. Generate more personalized reasoning
    // 3. Create a cohesive narrative for the suggestions
    
    // For now, return the Google Places based suggestions
    return NextResponse.json({ 
      suggestions,
      metadata: {
        destination: destination.name,
        totalSuggestions: suggestions.length,
        dataSource: 'google_places'
      }
    });

  } catch (error) {
    console.error('Error generating trip suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}