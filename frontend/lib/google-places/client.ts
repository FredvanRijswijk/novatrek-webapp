/**
 * Google Places API client-side integration
 * Uses the Google Maps JavaScript API with Places library
 */

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  photos?: Array<{
    getUrl: (options: { maxWidth: number }) => string;
  }>;
  types: string[];
  utc_offset_minutes?: number;
}

export class GooglePlacesClient {
  private autocompleteService: google.maps.places.AutocompleteService | null = null;
  private placesService: google.maps.places.PlacesService | null = null;
  private sessionToken: google.maps.places.AutocompleteSessionToken | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.google) {
      this.initializeServices();
    }
  }

  private initializeServices() {
    try {
      this.autocompleteService = new google.maps.places.AutocompleteService();
      // Create a dummy element for PlacesService
      const dummyElement = document.createElement('div');
      this.placesService = new google.maps.places.PlacesService(dummyElement);
      this.sessionToken = new google.maps.places.AutocompleteSessionToken();
    } catch (error) {
      console.error('Failed to initialize Google Places services:', error);
    }
  }

  /**
   * Search for destination suggestions
   */
  async searchDestinations(input: string): Promise<google.maps.places.AutocompletePrediction[]> {
    return new Promise((resolve, reject) => {
      if (!this.autocompleteService) {
        reject(new Error('Google Places service not initialized'));
        return;
      }

      this.autocompleteService.getPlacePredictions(
        {
          input,
          types: ['(cities)'], // Focus on cities for travel destinations
          sessionToken: this.sessionToken,
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions);
          } else {
            reject(new Error(`Places search failed: ${status}`));
          }
        }
      );
    });
  }

  /**
   * Get detailed place information
   */
  async getPlaceDetails(placeId: string): Promise<PlaceResult> {
    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        reject(new Error('Google Places service not initialized'));
        return;
      }

      this.placesService.getDetails(
        {
          placeId,
          fields: [
            'place_id',
            'name',
            'formatted_address',
            'geometry',
            'address_components',
            'photos',
            'types',
            'utc_offset_minutes'
          ],
          sessionToken: this.sessionToken,
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            // Reset session token after successful place selection
            this.sessionToken = new google.maps.places.AutocompleteSessionToken();
            resolve(place as PlaceResult);
          } else {
            reject(new Error(`Place details failed: ${status}`));
          }
        }
      );
    });
  }

  /**
   * Convert Google Place to our Destination format
   */
  static placeToDestination(place: PlaceResult): {
    id: string;
    name: string;
    country: string;
    city: string;
    coordinates: { lat: number; lng: number };
    timeZone: string;
    currency: string;
    language: string[];
    description: string;
    imageUrl?: string;
  } {
    // Extract country from address components
    const countryComponent = place.address_components?.find(
      component => component.types.includes('country')
    );
    const country = countryComponent?.long_name || 'Unknown';
    const countryCode = countryComponent?.short_name || 'XX';

    // Extract city name
    const cityComponent = place.address_components?.find(
      component => 
        component.types.includes('locality') || 
        component.types.includes('administrative_area_level_1')
    );
    const city = cityComponent?.long_name || place.name;

    // Get photo URL if available
    const imageUrl = place.photos?.[0]?.getUrl({ maxWidth: 800 });

    // Map country code to currency (simplified - in production use a proper mapping)
    const currencyMap: Record<string, string> = {
      'US': 'USD', 'GB': 'GBP', 'FR': 'EUR', 'DE': 'EUR', 'IT': 'EUR', 'ES': 'EUR',
      'JP': 'JPY', 'CN': 'CNY', 'AU': 'AUD', 'CA': 'CAD', 'IN': 'INR',
      // Add more mappings as needed
    };
    const currency = currencyMap[countryCode] || 'USD';

    // Map country code to language (simplified)
    const languageMap: Record<string, string[]> = {
      'US': ['en'], 'GB': ['en'], 'FR': ['fr'], 'DE': ['de'], 'IT': ['it'], 'ES': ['es'],
      'JP': ['ja'], 'CN': ['zh'], 'AU': ['en'], 'CA': ['en', 'fr'], 'IN': ['hi', 'en'],
      // Add more mappings as needed
    };
    const language = languageMap[countryCode] || ['en'];

    return {
      id: place.place_id,
      name: city,
      country,
      city,
      coordinates: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      },
      timeZone: '', // Would need additional API call to get timezone
      currency,
      language,
      description: `Explore ${city}, ${country}`,
      imageUrl,
    };
  }

  /**
   * Search for activities/attractions near a location
   */
  async searchActivities(
    location: { lat: number; lng: number },
    query?: string,
    type?: string
  ): Promise<google.maps.places.PlaceResult[]> {
    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        reject(new Error('Google Places service not initialized'));
        return;
      }

      const request: google.maps.places.TextSearchRequest = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius: 50000, // 50km radius
        query: query || 'things to do attractions restaurants',
        type: type as any,
      };

      this.placesService.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else {
          reject(new Error(`Activity search failed: ${status}`));
        }
      });
    });
  }
}