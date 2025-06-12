import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult, ActivityResult } from '../types';
import { searchGooglePlacesDirectly, searchExpertRecommendationsDirectly } from '../search/helpers';

const groupActivitySearchParams = z.object({
  query: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  groupSize: z.number().min(2).default(4),
  aggregatedPreferences: z.object({
    dietary: z.array(z.string()).optional(),
    activityLevel: z.string().optional(),
    budget: z.string().optional(),
    interests: z.array(z.string()).optional(),
    accessibility: z.array(z.string()).optional(),
    mixedActivityLevels: z.boolean().optional()
  }).optional(),
  searchType: z.enum(['activities', 'restaurants', 'both']).default('both'),
  radius: z.number().default(3000)
});

interface GroupActivityResult extends ActivityResult {
  groupSuitability: {
    score: number;
    reasons: string[];
    warnings: string[];
  };
  groupFeatures: {
    hasGroupDiscounts: boolean;
    accommodatesLargeGroups: boolean;
    hasPrivateOptions: boolean;
    flexibleParticipation: boolean;
  };
}

export const groupActivitySearchTool: TravelTool<z.infer<typeof groupActivitySearchParams>, GroupActivityResult[]> = {
  id: 'group_activity_search',
  name: 'Search Group-Friendly Activities',
  description: 'Finds activities and restaurants that work well for groups with diverse preferences',
  category: 'planning',
  parameters: groupActivitySearchParams,
  requiresAuth: true,
  
  async execute(params, context) {
    try {
      const { 
        query, 
        location, 
        groupSize, 
        aggregatedPreferences = {}, 
        searchType,
        radius 
      } = params;
      
      // Build search query optimized for groups
      const groupQuery = buildGroupSearchQuery(query, groupSize, aggregatedPreferences);
      
      // Search for activities and restaurants
      const searchPromises = [];
      
      if (searchType === 'activities' || searchType === 'both') {
        searchPromises.push(
          searchGooglePlacesDirectly({
            query: groupQuery.activities,
            location,
            radius,
            types: ['tourist_attraction', 'museum', 'park', 'entertainment']
          })
        );
      }
      
      if (searchType === 'restaurants' || searchType === 'both') {
        searchPromises.push(
          searchGooglePlacesDirectly({
            query: groupQuery.restaurants,
            location,
            radius,
            types: ['restaurant'],
            minRating: 4.0 // Higher standards for groups
          })
        );
      }
      
      // Also get expert recommendations
      searchPromises.push(
        searchExpertRecommendationsDirectly({
          type: searchType === 'restaurants' ? 'restaurant' : 'activity',
          location,
          radius,
          types: []
        })
      );
      
      const results = await Promise.all(searchPromises);
      const allResults = results.flat();
      
      // Analyze each result for group suitability
      const groupResults = allResults.map(result => 
        analyzeGroupSuitability(result, groupSize, aggregatedPreferences)
      );
      
      // Sort by group suitability score
      const sortedResults = groupResults.sort((a, b) => 
        b.groupSuitability.score - a.groupSuitability.score
      );
      
      // Filter out low-scoring options
      const suitableResults = sortedResults.filter(r => 
        r.groupSuitability.score >= 60
      );
      
      return {
        success: true,
        data: suitableResults.slice(0, 20), // Top 20 results
        metadata: {
          totalFound: allResults.length,
          suitableFound: suitableResults.length,
          confidence: 0.9,
          suggestions: generateGroupSuggestions(suitableResults, groupSize, aggregatedPreferences)
        }
      };
      
    } catch (error) {
      console.error('Group activity search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Group search failed'
      };
    }
  }
};

function buildGroupSearchQuery(
  baseQuery: string | undefined,
  groupSize: number,
  preferences: any
): { activities: string; restaurants: string } {
  const parts = {
    activities: [],
    restaurants: []
  };
  
  // Base query
  if (baseQuery) {
    parts.activities.push(baseQuery);
    parts.restaurants.push(baseQuery);
  }
  
  // Group size considerations
  if (groupSize >= 8) {
    parts.activities.push('group tours', 'large group activities');
    parts.restaurants.push('large group dining', 'private dining room');
  } else if (groupSize >= 4) {
    parts.activities.push('group friendly');
    parts.restaurants.push('group dining');
  }
  
  // Dietary preferences for restaurants
  if (preferences.dietary?.length) {
    const dietaryString = preferences.dietary.join(' ');
    parts.restaurants.push(dietaryString);
  }
  
  // Activity level
  if (preferences.mixedActivityLevels) {
    parts.activities.push('all ages', 'flexible', 'optional activities');
  } else if (preferences.activityLevel) {
    switch (preferences.activityLevel) {
      case 'low':
        parts.activities.push('easy', 'relaxed', 'accessible');
        break;
      case 'high':
        parts.activities.push('active', 'adventure');
        break;
    }
  }
  
  // Budget considerations
  if (preferences.budget === 'budget') {
    parts.activities.push('free', 'affordable', 'budget');
    parts.restaurants.push('affordable', 'casual dining');
  }
  
  // Interests
  if (preferences.interests?.length) {
    parts.activities.push(...preferences.interests.slice(0, 2));
  }
  
  return {
    activities: parts.activities.join(' '),
    restaurants: parts.restaurants.join(' ')
  };
}

function analyzeGroupSuitability(
  place: any,
  groupSize: number,
  preferences: any
): GroupActivityResult {
  let score = 70; // Base score
  const reasons: string[] = [];
  const warnings: string[] = [];
  const groupFeatures = {
    hasGroupDiscounts: false,
    accommodatesLargeGroups: false,
    hasPrivateOptions: false,
    flexibleParticipation: false
  };
  
  // Check name and description for group-related keywords
  const searchText = `${place.name} ${place.description || ''} ${place.types?.join(' ') || ''}`.toLowerCase();
  
  // Positive indicators
  if (searchText.includes('group')) {
    score += 15;
    reasons.push('Mentions group accommodation');
    groupFeatures.accommodatesLargeGroups = true;
  }
  
  if (searchText.includes('tour') && place.category !== 'restaurant') {
    score += 10;
    reasons.push('Organized tours work well for groups');
    groupFeatures.hasGroupDiscounts = true;
  }
  
  if (searchText.includes('private') || searchText.includes('exclusive')) {
    score += 10;
    reasons.push('Private options available');
    groupFeatures.hasPrivateOptions = true;
  }
  
  // Restaurant-specific scoring
  if (place.category === 'restaurant' || place.types?.includes('restaurant')) {
    // Check for large group accommodation
    if (place.userRatingCount > 500 && place.rating >= 4.3) {
      score += 5;
      reasons.push('Popular venue likely handles groups well');
    }
    
    // Dietary accommodation
    if (preferences.dietary?.length) {
      const accommodatesDietary = preferences.dietary.some((diet: string) => 
        searchText.includes(diet.toLowerCase())
      );
      
      if (accommodatesDietary) {
        score += 20;
        reasons.push('Accommodates group dietary needs');
      } else if (preferences.dietary.includes('vegan') || preferences.dietary.includes('vegetarian')) {
        // Check for flexible cuisines
        const flexibleCuisines = ['indian', 'thai', 'mediterranean', 'italian'];
        if (flexibleCuisines.some(cuisine => searchText.includes(cuisine))) {
          score += 10;
          reasons.push('Cuisine typically has vegetarian/vegan options');
        }
      }
    }
    
    // Price considerations for groups
    if (place.priceLevel) {
      if (preferences.budget === 'budget' && place.priceLevel > 2) {
        score -= 15;
        warnings.push('May be expensive for budget-conscious group members');
      } else if (place.priceLevel <= 2) {
        score += 5;
        reasons.push('Affordable for groups');
      }
    }
  }
  
  // Activity-specific scoring
  if (place.category === 'activity' || !place.types?.includes('restaurant')) {
    // Museums and cultural sites
    if (place.types?.some((type: string) => ['museum', 'art_gallery', 'cultural_site'].includes(type))) {
      score += 10;
      reasons.push('Educational activities unite diverse groups');
      groupFeatures.hasGroupDiscounts = true;
      groupFeatures.flexibleParticipation = true;
    }
    
    // Parks and outdoor spaces
    if (place.types?.includes('park') || searchText.includes('garden')) {
      score += 15;
      reasons.push('Open spaces allow groups to spread out');
      groupFeatures.flexibleParticipation = true;
    }
    
    // Check for accessibility
    if (preferences.accessibility?.length && searchText.includes('accessible')) {
      score += 10;
      reasons.push('Accessible for all group members');
    }
    
    // Activity level considerations
    if (preferences.mixedActivityLevels) {
      if (searchText.includes('optional') || searchText.includes('flexible')) {
        score += 15;
        reasons.push('Flexible participation levels');
        groupFeatures.flexibleParticipation = true;
      }
    }
  }
  
  // Size-specific warnings
  if (groupSize > 10) {
    if (!groupFeatures.accommodatesLargeGroups && place.category === 'restaurant') {
      warnings.push('Call ahead to confirm large group seating');
      score -= 10;
    }
    if (place.category === 'activity' && !searchText.includes('group')) {
      warnings.push('May need to book as multiple smaller groups');
    }
  }
  
  // Weather considerations for outdoor activities
  if (place.types?.includes('park') || searchText.includes('outdoor')) {
    warnings.push('Weather-dependent - have a backup plan');
  }
  
  // Expert recommendations boost
  if (place.expertRecommended || place.rankingFactors?.expertEndorsed) {
    score += 10;
    reasons.push('Expert recommended');
  }
  
  return {
    ...place,
    groupSuitability: {
      score: Math.min(100, Math.max(0, score)),
      reasons,
      warnings
    },
    groupFeatures
  };
}

function generateGroupSuggestions(
  results: GroupActivityResult[],
  groupSize: number,
  preferences: any
): string[] {
  const suggestions: string[] = [];
  
  // Analyze results
  const hasGroupDiscounts = results.some(r => r.groupFeatures.hasGroupDiscounts);
  const hasFlexibleOptions = results.some(r => r.groupFeatures.flexibleParticipation);
  const hasDietaryOptions = results.some(r => 
    r.groupSuitability.reasons.some(reason => reason.includes('dietary'))
  );
  
  // Generate suggestions based on findings
  if (hasGroupDiscounts) {
    suggestions.push(`Several venues offer group discounts - ask about rates for ${groupSize} people`);
  }
  
  if (!hasFlexibleOptions && preferences.mixedActivityLevels) {
    suggestions.push('Consider booking separate activities for different energy levels');
  }
  
  if (preferences.dietary?.length && !hasDietaryOptions) {
    suggestions.push('Call restaurants in advance to confirm dietary accommodations');
  }
  
  if (groupSize >= 8) {
    suggestions.push(
      'For large groups, book restaurants at off-peak hours for better service',
      'Consider hiring a private guide for a more personalized experience'
    );
  }
  
  // Time-based suggestions
  suggestions.push(
    'Book morning slots for popular attractions to avoid crowds',
    'Schedule free time between activities for bathroom breaks and regrouping'
  );
  
  return suggestions.slice(0, 5); // Limit to 5 most relevant
}