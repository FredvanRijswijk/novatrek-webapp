import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult, RestaurantResult } from '../types';
import { 
  searchGooglePlacesDirectly, 
  searchExpertRecommendationsDirectly, 
  searchNovatrekActivitiesDirectly 
} from './helpers';

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
      // Use trip destination coordinates if location not provided
      const location = params.location || context.trip.destinationCoordinates;
      if (!location) {
        return {
          success: false,
          error: 'Location required. Please provide coordinates or ensure trip has destination set.'
        };
      }
      
      // Build intelligent query based on context
      const query = buildRestaurantQuery(params, context);
      
      // Search multiple sources in parallel using direct functions
      const [googleResults, expertRecs, novatrekFavorites] = await Promise.all([
        searchGooglePlacesDirectly({
          query,
          location,
          radius: params.radius,
          types: ['restaurant'],
          minRating: params.minRating,
          priceLevel: params.priceLevel,
          openNow: params.openNow
        }),
        searchExpertRecommendationsDirectly({
          type: 'restaurant',
          location,
          radius: params.radius,
          types: ['restaurant']
        }),
        searchNovatrekActivitiesDirectly({
          query: 'restaurant',
          types: ['restaurant', 'food']
        })
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
  
  // Add dietary preferences to search query for better results
  if (params.dietary?.length) {
    parts.push(params.dietary.join(' '));
  }
  
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
  
  // Don't add location to query string - it's handled by location parameter
  
  return parts.join(' ');
}

// Helper functions have been moved to ./helpers.ts for direct database access

function mergeRestaurantResults(
  googleResults: any[],
  expertRecs: any[],
  novatrekFavorites: any[]
): RestaurantResult[] {
  const mergedMap = new Map<string, RestaurantResult>();
  
  // Process Google results first (already processed by helper)
  googleResults.forEach(place => {
    const id = place.id;
    mergedMap.set(id, {
      ...place,
      cuisine: extractCuisineFromTypes(place.types || []),
      dietary: extractDietaryFromTypes(place.types || [])
    });
  });
  
  // Enhance with expert recommendations
  expertRecs.forEach(rec => {
    const existing = mergedMap.get(rec.id);
    if (existing) {
      existing.expertRating = rec.expertRating;
      existing.expertReviews = rec.expertReviews;
      existing.expertRecommended = true;
    } else {
      // Add expert-only recommendations
      mergedMap.set(rec.id, rec);
    }
  });
  
  // Add NovaTrek favorites
  novatrekFavorites.forEach(fav => {
    const existing = mergedMap.get(fav.id);
    if (existing) {
      existing.novatrekScore = (existing.novatrekScore || 0) + 10;
    } else {
      // Add NovaTrek-only places
      mergedMap.set(fav.id, fav);
    }
  });
  
  return Array.from(mergedMap.values());
}

function filterByDietaryPreferences(
  restaurants: RestaurantResult[],
  dietary: string[]
): RestaurantResult[] {
  if (!dietary.length) return restaurants;
  
  // For vegan/vegetarian searches, use a scoring system instead of strict filtering
  const isVeganSearch = dietary.includes('vegan');
  const isVegetarianSearch = dietary.includes('vegetarian');
  
  // Score and enhance restaurants instead of filtering them out
  const scoredRestaurants = restaurants.map(restaurant => {
    let dietaryScore = 0;
    const dietaryIndicators: string[] = [];
    
    // Check name and description for dietary keywords
    const searchText = `${restaurant.name} ${restaurant.description || ''} ${restaurant.types?.join(' ') || ''}`.toLowerCase();
    
    // Direct dietary matches
    dietary.forEach(diet => {
      if (searchText.includes(diet.toLowerCase())) {
        dietaryScore += 10;
        dietaryIndicators.push(`Mentions ${diet}`);
      }
    });
    
    // Check restaurant dietary options array
    if (restaurant.dietary?.some(d => dietary.includes(d))) {
      dietaryScore += 15;
      dietaryIndicators.push('Has dietary options');
    }
    
    // Expert recommendations for dietary
    if (restaurant.expertReviews?.some(review => 
      dietary.some(diet => review.review.toLowerCase().includes(diet.toLowerCase()))
    )) {
      dietaryScore += 20;
      dietaryIndicators.push('Expert recommended for dietary needs');
    }
    
    // For vegan searches, give points to vegetarian places
    if (isVeganSearch && searchText.includes('vegetarian')) {
      dietaryScore += 5;
      dietaryIndicators.push('Vegetarian options available');
    }
    
    // Cuisine types known for vegan options
    const veganFriendlyCuisines = ['indian', 'thai', 'vietnamese', 'middle_eastern', 'mediterranean', 'falafel', 'asian', 'ethiopian'];
    const cuisineBonus = restaurant.types?.some(type => 
      veganFriendlyCuisines.some(cuisine => type.toLowerCase().includes(cuisine))
    );
    
    if ((isVeganSearch || isVegetarianSearch) && cuisineBonus) {
      dietaryScore += 3;
      dietaryIndicators.push('Cuisine typically has vegan options');
    }
    
    // Add dietary info to restaurant
    return {
      ...restaurant,
      dietaryScore,
      dietaryIndicators,
      // Mark as dietary-friendly if score > 0
      dietaryFriendly: dietaryScore > 0
    };
  });
  
  // For allergen/celiac, be strict
  if (dietary.some(d => ['celiac', 'allergy', 'kosher', 'halal'].includes(d.toLowerCase()))) {
    return scoredRestaurants.filter(r => r.dietaryScore > 5);
  }
  
  // For vegan/vegetarian, include all but sort by dietary score
  // This ensures we show results even if none explicitly say "vegan"
  return scoredRestaurants
    .sort((a, b) => {
      // First sort by dietary score
      if (a.dietaryScore !== b.dietaryScore) {
        return b.dietaryScore - a.dietaryScore;
      }
      // Then by rating
      return (b.rating || 0) - (a.rating || 0);
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
      rankingFactors: factors,
      // Ensure all fields are properly passed through
      address: restaurant.location?.address || restaurant.address,
      userRatingCount: restaurant.reviews || restaurant.userRatingsTotal,
      description: restaurant.description || restaurant.editorial_summary?.text
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