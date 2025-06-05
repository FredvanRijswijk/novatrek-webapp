/**
 * Google Places API (New) client implementation
 * Uses the new Google Places API REST endpoints
 * https://developers.google.com/maps/documentation/places/web-service/op-overview
 */

import { Destination } from '@/types/travel';

interface PlacePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
  authorAttributions: Array<{
    displayName: string;
    uri: string;
  }>;
}

interface Place {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
  photos?: PlacePhoto[];
  types?: string[];
  primaryType?: string;
  rating?: number;
  priceLevel?: string;
  regularOpeningHours?: {
    openNow: boolean;
    periods: Array<{
      open: { day: number; hour: number; minute: number };
      close: { day: number; hour: number; minute: number };
    }>;
  };
}

interface SearchTextResponse {
  places: Place[];
}

interface SearchNearbyResponse {
  places: Place[];
}

export class GooglePlacesClientNew {
  private apiKey: string;
  private baseUrl = 'https://places.googleapis.com/v1/places';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for destinations using Text Search
   */
  async searchDestinations(query: string): Promise<Destination[]> {
    try {
      const response = await fetch(`${this.baseUrl}:searchText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.addressComponents,places.photos,places.types,places.primaryType'
        },
        body: JSON.stringify({
          textQuery: query,
          languageCode: 'en',
          includedType: 'locality', // Focus on cities
          maxResultCount: 10
        })
      });

      if (!response.ok) {
        throw new Error(`Places API error: ${response.status} ${response.statusText}`);
      }

      const data: SearchTextResponse = await response.json();
      
      // Convert Places to Destinations
      const destinations = await Promise.all(
        data.places.map(place => this.placeToDestination(place))
      );

      return destinations.filter((d): d is Destination => d !== null);
    } catch (error) {
      console.error('Failed to search destinations:', error);
      throw error;
    }
  }

  /**
   * Search for activities near a location
   */
  async searchActivities(
    location: { lat: number; lng: number },
    query?: string,
    types?: string[]
  ): Promise<any[]> {
    try {
      // Use Text Search if query provided, otherwise Nearby Search
      if (query) {
        const response = await fetch(`${this.baseUrl}:searchText`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.rating,places.priceLevel,places.photos,places.regularOpeningHours'
          },
          body: JSON.stringify({
            textQuery: query,
            locationBias: {
              circle: {
                center: {
                  latitude: location.lat,
                  longitude: location.lng
                },
                radius: 50000 // 50km radius
              }
            },
            languageCode: 'en',
            maxResultCount: 20
          })
        });

        if (!response.ok) {
          throw new Error(`Places API error: ${response.status} ${response.statusText}`);
        }

        const data: SearchTextResponse = await response.json();
        return this.placesToActivities(data.places);
      } else {
        // Nearby Search for general activities
        const response = await fetch(`${this.baseUrl}:searchNearby`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.rating,places.priceLevel,places.photos,places.regularOpeningHours'
          },
          body: JSON.stringify({
            includedTypes: types || ['tourist_attraction', 'restaurant', 'museum', 'park'],
            maxResultCount: 20,
            locationRestriction: {
              circle: {
                center: {
                  latitude: location.lat,
                  longitude: location.lng
                },
                radius: 50000 // 50km radius
              }
            },
            languageCode: 'en'
          })
        });

        if (!response.ok) {
          throw new Error(`Places API error: ${response.status} ${response.statusText}`);
        }

        const data: SearchNearbyResponse = await response.json();
        return this.placesToActivities(data.places);
      }
    } catch (error) {
      console.error('Failed to search activities:', error);
      throw error;
    }
  }

  /**
   * Get photo URL for a place photo
   */
  getPhotoUrl(photoName: string, maxWidth: number = 400): string {
    return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${this.apiKey}`;
  }

  /**
   * Convert Google Place to our Destination format
   */
  private async placeToDestination(place: Place): Promise<Destination | null> {
    try {
      // Extract country from address components
      const countryComponent = place.addressComponents?.find(
        component => component.types.includes('country')
      );
      const country = countryComponent?.longText || 'Unknown';
      const countryCode = countryComponent?.shortText || 'XX';

      // Extract city name
      const cityComponent = place.addressComponents?.find(
        component => 
          component.types.includes('locality') || 
          component.types.includes('administrative_area_level_1')
      );
      const city = cityComponent?.longText || place.displayName.text;

      // Get photo URL if available
      const imageUrl = place.photos?.[0] 
        ? this.getPhotoUrl(place.photos[0].name, 800)
        : undefined;

      // Map country code to currency (simplified)
      const currencyMap: Record<string, string> = {
        'US': 'USD', 'GB': 'GBP', 'FR': 'EUR', 'DE': 'EUR', 'IT': 'EUR', 'ES': 'EUR',
        'JP': 'JPY', 'CN': 'CNY', 'AU': 'AUD', 'CA': 'CAD', 'IN': 'INR',
        'BR': 'BRL', 'MX': 'MXN', 'KR': 'KRW', 'TH': 'THB', 'ID': 'IDR'
      };
      const currency = currencyMap[countryCode] || 'USD';

      // Map country code to language (simplified)
      const languageMap: Record<string, string[]> = {
        'US': ['en'], 'GB': ['en'], 'FR': ['fr'], 'DE': ['de'], 'IT': ['it'], 'ES': ['es'],
        'JP': ['ja'], 'CN': ['zh'], 'AU': ['en'], 'CA': ['en', 'fr'], 'IN': ['hi', 'en'],
        'BR': ['pt'], 'MX': ['es'], 'KR': ['ko'], 'TH': ['th'], 'ID': ['id']
      };
      const language = languageMap[countryCode] || ['en'];

      return {
        id: place.id,
        name: city,
        country,
        city,
        coordinates: {
          lat: place.location.latitude,
          lng: place.location.longitude,
        },
        timeZone: '', // Would need additional API call
        currency,
        language,
        description: `Explore ${city}, ${country}`,
        imageUrl,
      };
    } catch (error) {
      console.error('Failed to convert place to destination:', error);
      return null;
    }
  }

  /**
   * Convert Places to Activities format
   */
  private placesToActivities(places: Place[]): any[] {
    return places.map(place => ({
      id: place.id,
      name: place.displayName.text,
      type: this.mapPlaceTypeToActivityType(place.types || [], place.primaryType),
      description: place.formattedAddress,
      location: {
        name: place.displayName.text,
        address: place.formattedAddress,
        coordinates: {
          lat: place.location.latitude,
          lng: place.location.longitude
        }
      },
      rating: place.rating,
      images: place.photos?.map(photo => this.getPhotoUrl(photo.name, 400)),
      cost: place.priceLevel ? {
        amount: this.priceLevelToAmount(place.priceLevel),
        currency: 'USD',
        perPerson: true
      } : undefined,
      isOpen: place.regularOpeningHours?.openNow
    }));
  }

  /**
   * Map Google place types to our activity types
   */
  private mapPlaceTypeToActivityType(types: string[], primaryType?: string): string {
    const typeMap: Record<string, string> = {
      'tourist_attraction': 'sightseeing',
      'museum': 'cultural',
      'art_gallery': 'cultural',
      'restaurant': 'dining',
      'cafe': 'dining',
      'bar': 'entertainment',
      'night_club': 'entertainment',
      'park': 'outdoor',
      'hiking_area': 'outdoor',
      'beach': 'outdoor',
      'shopping_mall': 'shopping',
      'store': 'shopping',
      'spa': 'wellness',
      'gym': 'wellness',
      'movie_theater': 'entertainment',
      'amusement_park': 'entertainment'
    };

    // Check primary type first
    if (primaryType && typeMap[primaryType]) {
      return typeMap[primaryType];
    }

    // Then check other types
    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type];
      }
    }

    return 'activity';
  }

  /**
   * Convert price level to estimated amount
   */
  private priceLevelToAmount(priceLevel: string): number {
    const priceLevels: Record<string, number> = {
      'PRICE_LEVEL_FREE': 0,
      'PRICE_LEVEL_INEXPENSIVE': 15,
      'PRICE_LEVEL_MODERATE': 30,
      'PRICE_LEVEL_EXPENSIVE': 60,
      'PRICE_LEVEL_VERY_EXPENSIVE': 100
    };
    return priceLevels[priceLevel] || 30;
  }
}