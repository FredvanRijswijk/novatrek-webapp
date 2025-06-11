/**
 * Google Places API service for quick actions in chat
 * Provides specialized search methods for common travel queries
 */

import { GooglePlacesClientV2 } from './client-v2';
import { getPhotoUrl, getFallbackImage } from './photo-utils';
import type { 
  DietaryRestriction, 
  Interest, 
  TravelPreferences 
} from '@/types/preferences';

// Types for quick action results
export interface QuickActionPlace {
  id: string;
  name: string;
  address: string;
  rating?: number;
  priceLevel?: number;
  distance?: number; // in meters
  photos: string[];
  types: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  isOpen?: boolean;
  googleMapsUrl?: string;
}

export interface QuickActionSearchOptions {
  location: { lat: number; lng: number };
  radius?: number; // in meters, default 5000 (5km)
  limit?: number; // max results, default 10
}

export interface RestaurantSearchOptions extends QuickActionSearchOptions {
  dietaryRestrictions?: DietaryRestriction[];
  priceLevel?: number[]; // 1-4 scale
  cuisineType?: string;
}

export interface AttractionSearchOptions extends QuickActionSearchOptions {
  interests?: Interest[];
  activityTypes?: string[];
}

export class QuickActionsPlacesService extends GooglePlacesClientV2 {
  private apiKey: string;

  constructor() {
    super();
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  }

  /**
   * Find nearby restaurants with dietary preferences
   */
  async findNearbyRestaurants(
    options: RestaurantSearchOptions
  ): Promise<QuickActionPlace[]> {
    try {
      const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
      
      // Build search query based on dietary restrictions
      const dietaryKeywords = this.mapDietaryRestrictionsToKeywords(
        options.dietaryRestrictions || []
      );
      
      const textQuery = dietaryKeywords.length > 0
        ? `restaurants ${dietaryKeywords.join(' ')}`
        : 'restaurants';

      const request = {
        fields: [
          'id',
          'displayName',
          'formattedAddress',
          'location',
          'rating',
          'priceLevel',
          'photos',
          'types',
          'currentOpeningHours',
          'googleMapsURI'
        ],
        locationRestriction: {
          center: options.location,
          radius: options.radius || 5000, // 5km default
        },
        includedTypes: ['restaurant'],
        textQuery,
        maxResultCount: options.limit || 10,
        rankPreference: 'DISTANCE', // Sort by distance
      };

      const { places } = await Place.searchNearby(request);
      
      if (!places || places.length === 0) {
        return [];
      }

      // Process and format results
      return places.map(place => this.formatPlaceResult(place, options.location));
    } catch (error) {
      console.error('Error searching restaurants:', error);
      throw error;
    }
  }

  /**
   * Find scenic spots and photo opportunities
   */
  async findPhotoSpots(
    options: QuickActionSearchOptions
  ): Promise<QuickActionPlace[]> {
    try {
      const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
      
      const request = {
        fields: [
          'id',
          'displayName',
          'formattedAddress',
          'location',
          'rating',
          'photos',
          'types',
          'googleMapsURI'
        ],
        locationRestriction: {
          center: options.location,
          radius: options.radius || 10000, // 10km for scenic spots
        },
        includedTypes: [
          'tourist_attraction',
          'park',
          'natural_feature',
          'point_of_interest'
        ],
        textQuery: 'scenic viewpoint photography spots landmarks',
        maxResultCount: options.limit || 10,
        rankPreference: 'RELEVANCE',
      };

      const { places } = await Place.searchNearby(request);
      
      if (!places || places.length === 0) {
        return [];
      }

      // Filter and sort by rating and photo availability
      const filteredPlaces = places
        .filter(place => place.photos && place.photos.length > 0)
        .sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
        });

      return filteredPlaces.map(place => this.formatPlaceResult(place, options.location));
    } catch (error) {
      console.error('Error searching photo spots:', error);
      throw error;
    }
  }

  /**
   * Find nearby attractions based on user interests
   */
  async findNearbyAttractions(
    options: AttractionSearchOptions
  ): Promise<QuickActionPlace[]> {
    try {
      const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
      
      // Map interests to search keywords
      const interestKeywords = this.mapInterestsToKeywords(
        options.interests || []
      );
      
      const textQuery = interestKeywords.length > 0
        ? `attractions ${interestKeywords.join(' ')}`
        : 'things to do attractions';

      // Map interests to place types
      const includedTypes = this.mapInterestsToPlaceTypes(
        options.interests || []
      );

      const request = {
        fields: [
          'id',
          'displayName',
          'formattedAddress',
          'location',
          'rating',
          'priceLevel',
          'photos',
          'types',
          'currentOpeningHours',
          'googleMapsURI'
        ],
        locationRestriction: {
          center: options.location,
          radius: options.radius || 10000, // 10km default for attractions
        },
        includedTypes: includedTypes.length > 0 ? includedTypes : ['tourist_attraction'],
        textQuery,
        maxResultCount: options.limit || 15,
        rankPreference: 'RELEVANCE',
      };

      const { places } = await Place.searchNearby(request);
      
      if (!places || places.length === 0) {
        return [];
      }

      return places.map(place => this.formatPlaceResult(place, options.location));
    } catch (error) {
      console.error('Error searching attractions:', error);
      throw error;
    }
  }

  /**
   * Helper: Map dietary restrictions to search keywords
   */
  private mapDietaryRestrictionsToKeywords(
    restrictions: DietaryRestriction[]
  ): string[] {
    const keywordMap: Record<DietaryRestriction, string[]> = {
      'vegetarian': ['vegetarian'],
      'vegan': ['vegan', 'plant-based'],
      'gluten-free': ['gluten-free', 'celiac'],
      'halal': ['halal'],
      'kosher': ['kosher'],
      'dairy-free': ['dairy-free', 'lactose-free'],
      'nut-allergy': ['nut-free'],
      'seafood-allergy': ['no seafood'],
      'low-sodium': ['healthy', 'low-sodium'],
      'diabetic': ['healthy', 'sugar-free'],
    };

    const keywords = new Set<string>();
    restrictions.forEach(restriction => {
      const mapped = keywordMap[restriction];
      if (mapped) {
        mapped.forEach(keyword => keywords.add(keyword));
      }
    });

    return Array.from(keywords);
  }

  /**
   * Helper: Map interests to search keywords
   */
  private mapInterestsToKeywords(interests: Interest[]): string[] {
    const keywordMap: Record<Interest, string[]> = {
      'history': ['historical', 'heritage', 'historic sites'],
      'art': ['art gallery', 'art museum', 'contemporary art'],
      'architecture': ['architecture', 'buildings', 'landmarks'],
      'nature': ['nature', 'parks', 'gardens', 'outdoors'],
      'food': ['food market', 'local cuisine', 'cooking class'],
      'music': ['music venue', 'concert hall', 'live music'],
      'sports': ['stadium', 'sports', 'recreation'],
      'technology': ['science museum', 'technology', 'innovation'],
      'spirituality': ['temple', 'church', 'spiritual', 'meditation'],
      'photography': ['scenic', 'viewpoint', 'photogenic'],
      'local-culture': ['cultural', 'traditional', 'local experience'],
      'crafts': ['artisan', 'handicrafts', 'workshop'],
    };

    const keywords = new Set<string>();
    interests.forEach(interest => {
      const mapped = keywordMap[interest];
      if (mapped) {
        mapped.forEach(keyword => keywords.add(keyword));
      }
    });

    return Array.from(keywords);
  }

  /**
   * Helper: Map interests to Google Places types
   */
  private mapInterestsToPlaceTypes(interests: Interest[]): string[] {
    const typeMap: Record<Interest, string[]> = {
      'history': ['museum', 'historical_landmark'],
      'art': ['art_gallery', 'museum'],
      'architecture': ['historical_landmark', 'tourist_attraction'],
      'nature': ['park', 'natural_feature'],
      'food': ['restaurant', 'food'],
      'music': ['performing_arts_theater', 'night_club'],
      'sports': ['stadium', 'sports_complex'],
      'technology': ['museum', 'science_museum'],
      'spirituality': ['place_of_worship', 'hindu_temple', 'church', 'mosque'],
      'photography': ['tourist_attraction', 'natural_feature'],
      'local-culture': ['museum', 'cultural_center'],
      'crafts': ['shopping_mall', 'store'],
    };

    const types = new Set<string>();
    interests.forEach(interest => {
      const mapped = typeMap[interest];
      if (mapped) {
        mapped.forEach(type => types.add(type));
      }
    });

    return Array.from(types);
  }

  /**
   * Helper: Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (from.lat * Math.PI) / 180;
    const φ2 = (to.lat * Math.PI) / 180;
    const Δφ = ((to.lat - from.lat) * Math.PI) / 180;
    const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Helper: Format place result for chat display
   */
  private formatPlaceResult(
    place: any,
    userLocation: { lat: number; lng: number }
  ): QuickActionPlace {
    // Get photo URLs
    const photos: string[] = [];
    if (place.photos && place.photos.length > 0) {
      place.photos.slice(0, 3).forEach((photo: any) => {
        const photoUrl = getPhotoUrl(photo, this.apiKey);
        if (photoUrl) photos.push(photoUrl);
      });
    }

    // Add fallback image if no photos
    if (photos.length === 0) {
      photos.push(getFallbackImage(place.displayName || 'place'));
    }

    // Calculate distance
    const placeLocation = {
      lat: place.location.lat(),
      lng: place.location.lng(),
    };
    const distance = this.calculateDistance(userLocation, placeLocation);

    // Check if open
    let isOpen: boolean | undefined;
    if (place.currentOpeningHours) {
      isOpen = place.currentOpeningHours.isOpen();
    }

    return {
      id: place.id,
      name: place.displayName || 'Unknown Place',
      address: place.formattedAddress || 'Address not available',
      rating: place.rating,
      priceLevel: place.priceLevel,
      distance: Math.round(distance),
      photos,
      types: place.types || [],
      coordinates: placeLocation,
      isOpen,
      googleMapsUrl: place.googleMapsURI,
    };
  }

  /**
   * Format results for chat display with markdown
   */
  static formatForChat(places: QuickActionPlace[]): string {
    if (places.length === 0) {
      return "I couldn't find any places matching your criteria in this area.";
    }

    let response = "Here are some options I found for you:\n\n";

    places.forEach((place, index) => {
      response += `**${index + 1}. ${place.name}**\n`;
      
      if (place.rating) {
        response += `⭐ ${place.rating.toFixed(1)} rating\n`;
      }
      
      if (place.distance) {
        const distanceKm = (place.distance / 1000).toFixed(1);
        response += `📍 ${distanceKm} km away\n`;
      }
      
      if (place.priceLevel) {
        response += `💰 ${'$'.repeat(place.priceLevel)}\n`;
      }
      
      if (place.isOpen !== undefined) {
        response += place.isOpen ? '🟢 Open now\n' : '🔴 Closed\n';
      }
      
      response += `📍 ${place.address}\n`;
      
      if (place.googleMapsUrl) {
        response += `[View on Google Maps](${place.googleMapsUrl})\n`;
      }
      
      response += '\n';
    });

    return response;
  }
}

// Export a singleton instance
export const quickActionsPlacesService = new QuickActionsPlacesService();