import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult, ActivityResult } from '../types';
import { 
  searchGooglePlacesDirectly, 
  searchExpertRecommendationsDirectly, 
  searchNovatrekActivitiesDirectly 
} from './helpers';

const activitySearchParams = z.object({
  query: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  types: z.array(z.string()).optional(),
  radius: z.number().default(5000),
  minRating: z.number().min(0).max(5).optional(),
  priceLevel: z.array(z.number()).optional(),
  openNow: z.boolean().optional(),
  date: z.string().optional(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
  duration: z.number().optional(),
  suitableFor: z.array(z.string()).optional()
});

export const activitySearchTool: TravelTool<z.infer<typeof activitySearchParams>, ActivityResult[]> = {
  id: 'search_activities',
  name: 'Search Activities',
  description: 'Search for activities and attractions with intelligent ranking based on expert recommendations, user preferences, and context',
  category: 'search',
  parameters: activitySearchParams,
  
  async execute(params, context) {
    try {
      // Determine location to search
      let searchLocation = params.location;
      if (!searchLocation) {
        // Try V2 structure first
        if (context.trip.destinationCoordinates) {
          searchLocation = context.trip.destinationCoordinates;
        }
        // Try destinations array
        else if (context.trip.destinations?.[0]) {
          const dest = context.trip.destinations[0];
          if (dest.coordinates) {
            searchLocation = {
              lat: dest.coordinates.lat,
              lng: dest.coordinates.lng
            };
          }
        } 
        // Fall back to single destination
        else if (context.trip.destination) {
          const dest = context.trip.destination;
          if (dest.coordinates || dest.location) {
            searchLocation = {
              lat: dest.coordinates?.lat || dest.location?.lat,
              lng: dest.coordinates?.lng || dest.location?.lng
            };
          }
        }
      }
      
      // Build query string
      const query = params.query || 'things to do attractions activities';
      
      // Search multiple sources in parallel
      const [googleResults, expertRecs, novatrekActivities] = await Promise.all([
        searchGooglePlacesDirectly({
          query,
          location: searchLocation,
          radius: params.radius,
          types: params.types || ['tourist_attraction', 'museum', 'park', 'point_of_interest'],
          minRating: params.minRating,
          priceLevel: params.priceLevel,
          openNow: params.openNow
        }),
        searchExpertRecommendationsDirectly({
          type: 'activity',
          location: searchLocation,
          radius: params.radius,
          types: params.types || []
        }),
        searchNovatrekActivitiesDirectly({
          query: params.query,
          types: params.types || []
        })
      ]);
      
      // Merge all results
      const allResults = [...googleResults, ...expertRecs, ...novatrekActivities];
      
      // Process and rank results
      const rankedResults = await rankActivities(allResults, context, params);
      
      return {
        success: true,
        data: rankedResults,
        metadata: {
          source: 'combined', // Google Places + Expert recommendations + NovaTrek DB
          confidence: calculateSearchConfidence(rankedResults, params),
          alternatives: [],
          suggestions: generateSearchSuggestions(rankedResults, params, context)
        }
      };
    } catch (error) {
      console.error('Activity search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }
};

async function rankActivities(
  activities: any[], 
  context: ToolContext,
  params: z.infer<typeof activitySearchParams>
): Promise<ActivityResult[]> {
  return activities.map(activity => {
    let score = 0;
    const factors = {
      expertEndorsed: false,
      popularityScore: 0,
      matchScore: 0,
      distanceScore: 0
    };
    
    // Expert endorsement - highest weight
    if (activity.expertRecommendations?.length > 0) {
      factors.expertEndorsed = true;
      score += 50; // Base expert boost
      
      // Average expert rating
      const avgExpertRating = activity.expertRecommendations.reduce(
        (sum: number, rec: any) => sum + rec.rating, 0
      ) / activity.expertRecommendations.length;
      score += avgExpertRating * 10; // Up to 50 more points
    }
    
    // Google rating and popularity
    if (activity.rating) {
      factors.popularityScore = activity.rating * 4; // Up to 20 points
      score += factors.popularityScore;
    }
    
    if (activity.userRatingsTotal) {
      score += Math.min(10, activity.userRatingsTotal / 100); // Up to 10 points for popularity
    }
    
    // Match with user preferences
    if (context.preferences) {
      let matchCount = 0;
      const activityTypes = activity.types || [];
      
      // Check activity type matches
      context.preferences.activityTypes?.forEach(prefType => {
        if (activityTypes.some((t: string) => t.includes(prefType))) {
          matchCount++;
        }
      });
      
      // Check interest matches
      context.preferences.interests?.forEach(interest => {
        if (activity.description?.toLowerCase().includes(interest.toLowerCase()) ||
            activity.name?.toLowerCase().includes(interest.toLowerCase())) {
          matchCount++;
        }
      });
      
      factors.matchScore = matchCount * 5; // Up to ~25 points
      score += factors.matchScore;
    }
    
    // Distance penalty (if location provided)
    if (params.location && activity.location) {
      const distance = calculateDistance(
        params.location,
        { lat: activity.location.lat, lng: activity.location.lng }
      );
      factors.distanceScore = Math.max(0, 10 - (distance / 1000)); // Penalty for distance
      score += factors.distanceScore;
    }
    
    // Weather suitability
    if (context.weather && activity.indoorOutdoor) {
      if (context.weather.conditions === 'rain' && activity.indoorOutdoor === 'indoor') {
        score += 10;
      } else if (context.weather.conditions === 'clear' && activity.indoorOutdoor === 'outdoor') {
        score += 5;
      }
    }
    
    return {
      ...activity,
      novatrekScore: score,
      rankingFactors: factors,
      // Ensure all fields are properly passed through
      address: activity.location?.address || activity.address,
      userRatingCount: activity.reviews || activity.userRatingsTotal,
      description: activity.description || activity.editorial_summary?.text
    };
  }).sort((a, b) => b.novatrekScore - a.novatrekScore);
}

function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 6371e3; // Earth's radius in meters
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

function calculateSearchConfidence(results: ActivityResult[], params: any): number {
  if (results.length === 0) return 0;
  
  // Base confidence on result quality
  let confidence = 0.5;
  
  // Boost for expert-endorsed results
  const expertEndorsed = results.filter(r => r.rankingFactors?.expertEndorsed).length;
  confidence += (expertEndorsed / results.length) * 0.3;
  
  // Boost for high-rated results
  const highRated = results.filter(r => (r.rating || 0) >= 4).length;
  confidence += (highRated / results.length) * 0.2;
  
  return Math.min(1, confidence);
}

function generateSearchSuggestions(
  results: ActivityResult[], 
  params: any,
  context: ToolContext
): string[] {
  const suggestions: string[] = [];
  
  if (results.length === 0) {
    suggestions.push('Try expanding your search radius or being less specific with filters');
  }
  
  // Suggest expert-recommended if not many in results
  const expertCount = results.filter(r => r.rankingFactors?.expertEndorsed).length;
  if (expertCount < 3 && results.length > 5) {
    suggestions.push('Consider activities recommended by local experts for authentic experiences');
  }
  
  // Weather-based suggestions
  if (context.weather?.conditions === 'rain' && 
      results.filter(r => r.indoorOutdoor === 'indoor').length < 3) {
    suggestions.push('Limited indoor options found. Consider checking museum or shopping options.');
  }
  
  return suggestions;
}