import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult, RestaurantResult } from '../types';

const restaurantSearchParams = z.object({
  query: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  cuisine: z.array(z.string()).optional(),
  dietary: z.array(z.string()).optional(),
  mealType: z.enum(['breakfast', 'brunch', 'lunch', 'dinner', 'snack']).optional(),
  radius: z.number().default(2000),
  minRating: z.number().min(0).max(5).optional(),
  priceLevel: z.array(z.number().min(1).max(4)).optional(),
  openNow: z.boolean().optional(),
  datetime: z.string().optional(),
  partySize: z.number().optional(),
  features: z.array(z.string()).optional() // outdoor_seating, delivery, etc
});

export const restaurantSearchTool: TravelTool<z.infer<typeof restaurantSearchParams>, RestaurantResult[]> = {
  id: 'search_restaurants',
  name: 'Search Restaurants',
  description: 'Search for restaurants with dietary preferences, expert recommendations, and real-time availability',
  category: 'search',
  parameters: restaurantSearchParams,
  
  async execute(params, context) {
    try {
      // Build intelligent query based on context
      const query = buildRestaurantQuery(params, context);
      
      // Search multiple sources in parallel
      const [googleResults, expertRecs, novatrekFavorites] = await Promise.all([
        searchGooglePlaces(query, params),
        searchExpertRecommendations('restaurant', params, context),
        searchNovatrekFavorites('restaurant', params, context)
      ]);
      
      // Merge and deduplicate results
      const mergedResults = mergeRestaurantResults(
        googleResults,
        expertRecs,
        novatrekFavorites
      );
      
      // Apply dietary and preference filtering
      const filteredResults = filterByDietaryPreferences(
        mergedResults,
        params.dietary || context.preferences?.dietary || []
      );
      
      // Rank results with expert weighting
      const rankedResults = rankRestaurants(filteredResults, context, params);
      
      // Check real-time availability if requested
      if (params.datetime && params.partySize) {
        await enhanceWithAvailability(rankedResults.slice(0, 10), params);
      }
      
      return {
        success: true,
        data: rankedResults,
        metadata: {
          source: 'combined',
          confidence: calculateConfidence(rankedResults),
          alternatives: generateAlternatives(rankedResults, params),
          suggestions: generateRestaurantSuggestions(rankedResults, params, context),
          warnings: generateWarnings(params, context)
        }
      };
    } catch (error) {
      console.error('Restaurant search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Restaurant search failed'
      };
    }
  }
};

function buildRestaurantQuery(
  params: z.infer<typeof restaurantSearchParams>,
  context: ToolContext
): string {
  const parts: string[] = [];
  
  // Add cuisine if specified
  if (params.cuisine?.length) {
    parts.push(params.cuisine.join(' OR '));
  }
  
  // Add meal type
  if (params.mealType) {
    parts.push(params.mealType);
  }
  
  // Add base query
  if (params.query) {
    parts.push(params.query);
  } else {
    parts.push('restaurant');
  }
  
  // Add location context
  if (context.trip.destinations?.[0]?.name) {
    parts.push(`near ${context.trip.destinations[0].name}`);
  }
  
  return parts.join(' ');
}

async function searchGooglePlaces(
  query: string,
  params: z.infer<typeof restaurantSearchParams>
): Promise<any[]> {
  const searchParams = new URLSearchParams({
    query,
    type: 'restaurant',
    ...(params.location && {
      lat: params.location.lat.toString(),
      lng: params.location.lng.toString()
    }),
    radius: params.radius.toString(),
    ...(params.openNow !== undefined && { openNow: params.openNow.toString() }),
    ...(params.minRating && { minRating: params.minRating.toString() }),
    ...(params.priceLevel && { priceLevel: params.priceLevel.join(',') })
  });
  
  const response = await fetch(`/api/places/search?${searchParams}`);
  if (!response.ok) throw new Error('Google Places search failed');
  
  const data = await response.json();
  return data.results || [];
}

async function searchExpertRecommendations(
  type: string,
  params: any,
  context: ToolContext
): Promise<any[]> {
  try {
    const response = await fetch('/api/expert/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.userId}`
      },
      body: JSON.stringify({
        type,
        location: params.location,
        filters: {
          cuisine: params.cuisine,
          dietary: params.dietary,
          priceLevel: params.priceLevel
        }
      })
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    return data.recommendations || [];
  } catch {
    return [];
  }
}

async function searchNovatrekFavorites(
  type: string,
  params: any,
  context: ToolContext
): Promise<any[]> {
  // Search user's saved places and community favorites
  try {
    const response = await fetch('/api/places/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.userId}`
      },
      body: JSON.stringify({
        type,
        location: params.location,
        radius: params.radius
      })
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    return data.favorites || [];
  } catch {
    return [];
  }
}

function mergeRestaurantResults(
  googleResults: any[],
  expertRecs: any[],
  novatrekFavorites: any[]
): RestaurantResult[] {
  const mergedMap = new Map<string, RestaurantResult>();
  
  // Process Google results first
  googleResults.forEach(place => {
    const id = place.place_id || place.id;
    mergedMap.set(id, {
      id,
      name: place.name,
      description: place.editorial_summary?.text,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        address: place.formatted_address
      },
      rating: place.rating,
      reviews: place.user_ratings_total,
      priceLevel: place.price_level,
      photos: place.photos?.map((p: any) => p.photo_reference),
      types: place.types,
      openingHours: place.opening_hours,
      website: place.website,
      phone: place.formatted_phone_number,
      cuisine: extractCuisineFromTypes(place.types),
      dietary: extractDietaryFromTypes(place.types)
    });
  });
  
  // Enhance with expert recommendations
  expertRecs.forEach(rec => {
    const existing = mergedMap.get(rec.placeId);
    if (existing) {
      existing.expertRating = rec.rating;
      existing.expertReviews = rec.reviews;
    } else {
      mergedMap.set(rec.placeId, {
        ...rec,
        expertRating: rec.rating,
        expertReviews: rec.reviews
      });
    }
  });
  
  // Add NovaTrek favorites
  novatrekFavorites.forEach(fav => {
    const existing = mergedMap.get(fav.id);
    if (existing) {
      existing.novatrekScore = (existing.novatrekScore || 0) + 10;
    }
  });
  
  return Array.from(mergedMap.values());
}

function filterByDietaryPreferences(
  restaurants: RestaurantResult[],
  dietary: string[]
): RestaurantResult[] {
  if (!dietary.length) return restaurants;
  
  return restaurants.filter(restaurant => {
    // Always include if expert recommended for dietary needs
    if (restaurant.expertReviews?.some(review => 
      dietary.some(diet => review.review.toLowerCase().includes(diet.toLowerCase()))
    )) {
      return true;
    }
    
    // Check restaurant dietary options
    if (restaurant.dietary?.some(d => dietary.includes(d))) {
      return true;
    }
    
    // Check name and description for dietary keywords
    const searchText = `${restaurant.name} ${restaurant.description || ''}`.toLowerCase();
    return dietary.some(diet => searchText.includes(diet.toLowerCase()));
  });
}

function rankRestaurants(
  restaurants: RestaurantResult[],
  context: ToolContext,
  params: z.infer<typeof restaurantSearchParams>
): RestaurantResult[] {
  return restaurants.map(restaurant => {
    let score = 0;
    const factors = {
      expertEndorsed: false,
      popularityScore: 0,
      matchScore: 0,
      distanceScore: 0
    };
    
    // Expert endorsement - highest priority
    if (restaurant.expertRating) {
      factors.expertEndorsed = true;
      score += 60 + (restaurant.expertRating * 8); // 60-100 points
    }
    
    // Dietary match bonus
    const userDietary = params.dietary || context.preferences?.dietary || [];
    if (userDietary.length && restaurant.dietary) {
      const dietaryMatches = restaurant.dietary.filter(d => userDietary.includes(d)).length;
      score += dietaryMatches * 15; // 15 points per match
    }
    
    // Cuisine preference match
    if (params.cuisine?.length && restaurant.cuisine) {
      const cuisineMatches = restaurant.cuisine.filter(c => params.cuisine.includes(c)).length;
      score += cuisineMatches * 10;
    }
    
    // Google rating
    if (restaurant.rating) {
      factors.popularityScore = restaurant.rating * 8; // Up to 40 points
      score += factors.popularityScore;
    }
    
    // Popularity (review count)
    if (restaurant.reviews) {
      score += Math.min(10, restaurant.reviews / 50); // Up to 10 points
    }
    
    // Price level match
    if (params.priceLevel?.length && restaurant.priceLevel) {
      if (params.priceLevel.includes(restaurant.priceLevel)) {
        score += 10;
      }
    }
    
    // Distance (closer is better)
    if (params.location && restaurant.location) {
      const distance = calculateDistance(params.location, restaurant.location);
      factors.distanceScore = Math.max(0, 20 - (distance / 100)); // Up to 20 points
      score += factors.distanceScore;
    }
    
    return {
      ...restaurant,
      novatrekScore: score,
      rankingFactors: factors
    };
  }).sort((a, b) => b.novatrekScore - a.novatrekScore);
}

async function enhanceWithAvailability(
  restaurants: RestaurantResult[],
  params: { datetime: string; partySize: number }
): Promise<void> {
  // In a real implementation, this would check OpenTable, Resy, etc.
  // For now, we'll add mock availability data
  restaurants.forEach(restaurant => {
    if (restaurant.expertRating && restaurant.expertRating > 4) {
      // Popular expert-recommended places are likely to be busy
      restaurant.reservationUrl = `https://book.example.com/${restaurant.id}`;
    }
  });
}

function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371e3;
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

function extractCuisineFromTypes(types: string[]): string[] {
  const cuisineMap: Record<string, string> = {
    'italian_restaurant': 'Italian',
    'chinese_restaurant': 'Chinese',
    'japanese_restaurant': 'Japanese',
    'mexican_restaurant': 'Mexican',
    'indian_restaurant': 'Indian',
    'thai_restaurant': 'Thai',
    'french_restaurant': 'French',
    'vietnamese_restaurant': 'Vietnamese',
    'korean_restaurant': 'Korean',
    'mediterranean_restaurant': 'Mediterranean'
  };
  
  return types
    .map(type => cuisineMap[type])
    .filter(Boolean);
}

function extractDietaryFromTypes(types: string[]): string[] {
  const dietary: string[] = [];
  if (types.includes('vegan_restaurant')) dietary.push('vegan');
  if (types.includes('vegetarian_restaurant')) dietary.push('vegetarian');
  return dietary;
}

function calculateConfidence(results: RestaurantResult[]): number {
  if (results.length === 0) return 0;
  
  const expertCount = results.filter(r => r.expertRating).length;
  const highRatedCount = results.filter(r => (r.rating || 0) >= 4).length;
  
  return Math.min(1, 0.4 + (expertCount / results.length) * 0.4 + (highRatedCount / results.length) * 0.2);
}

function generateAlternatives(
  results: RestaurantResult[],
  params: z.infer<typeof restaurantSearchParams>
): any[] {
  // Suggest alternatives if results are limited
  const alternatives = [];
  
  if (results.length < 5 && params.dietary?.includes('vegan')) {
    alternatives.push({
      suggestion: 'Try searching for "vegetarian" restaurants as they often have vegan options',
      action: 'search_restaurants',
      params: { ...params, dietary: ['vegetarian'] }
    });
  }
  
  return alternatives;
}

function generateRestaurantSuggestions(
  results: RestaurantResult[],
  params: z.infer<typeof restaurantSearchParams>,
  context: ToolContext
): string[] {
  const suggestions: string[] = [];
  
  const expertCount = results.filter(r => r.expertRating).length;
  if (expertCount > 0) {
    suggestions.push(`Found ${expertCount} expert-recommended restaurants that match your criteria`);
  }
  
  if (params.datetime) {
    suggestions.push('Consider making reservations for popular restaurants in advance');
  }
  
  return suggestions;
}

function generateWarnings(
  params: z.infer<typeof restaurantSearchParams>,
  context: ToolContext
): string[] {
  const warnings: string[] = [];
  
  if (params.dietary?.includes('vegan') && (!params.location || params.radius < 3000)) {
    warnings.push('Vegan options might be limited in some areas. Consider expanding search radius.');
  }
  
  return warnings;
}