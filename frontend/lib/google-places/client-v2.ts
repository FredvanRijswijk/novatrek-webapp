/**
 * Google Places API client-side integration using the new Place API
 * Uses the Google Maps JavaScript API with Places library (v2)
 */

interface PlaceResult {
  id: string;
  displayName: string;
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  addressComponents: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
  photos?: Array<{
    getURI: (options: { maxWidth: number; maxHeight: number }) => string;
  }>;
  types: string[];
  utcOffsetMinutes?: number;
  primaryType?: string;
  googleMapsURI?: string;
}

export class GooglePlacesClientV2 {
  private autocompleteService: google.maps.places.AutocompleteService | null = null;
  private sessionToken: google.maps.places.AutocompleteSessionToken | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.google) {
      this.initializeServices();
    }
  }

  private initializeServices() {
    try {
      this.autocompleteService = new google.maps.places.AutocompleteService();
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
   * Get detailed place information using the new Place API
   */
  async getPlaceDetails(placeId: string): Promise<PlaceResult> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!window.google || !window.google.maps) {
          reject(new Error('Google Maps not loaded'));
          return;
        }

        // Use the new Place class
        const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
        const place = new Place({
          id: placeId,
          requestedLanguage: 'en',
        });

        // Fetch fields using the new API
        await place.fetchFields({
          fields: [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'addressComponents',
            'photos',
            'types',
            'utcOffsetMinutes',
            'primaryType',
            'googleMapsURI'
          ],
        });

        // Reset session token after successful place selection
        this.sessionToken = new google.maps.places.AutocompleteSessionToken();

        // Convert to our format
        const result: PlaceResult = {
          id: place.id || placeId,
          displayName: place.displayName || '',
          formattedAddress: place.formattedAddress || '',
          location: place.location ? {
            lat: place.location.lat(),
            lng: place.location.lng(),
          } : { lat: 0, lng: 0 },
          addressComponents: place.addressComponents || [],
          photos: place.photos,
          types: place.types || [],
          utcOffsetMinutes: place.utcOffsetMinutes,
          primaryType: place.primaryType,
          googleMapsURI: place.googleMapsURI,
        };

        resolve(result);
      } catch (error) {
        console.error('Error fetching place details:', error);
        reject(error);
      }
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
    const city = cityComponent?.longText || place.displayName;

    // Get photo URL if available
    const imageUrl = place.photos?.[0]?.getURI({ maxWidth: 800, maxHeight: 600 });

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
      id: place.id,
      name: city,
      country,
      city,
      coordinates: place.location,
      timeZone: '', // Would need additional API call to get timezone
      currency,
      language,
      description: `Explore ${city}, ${country}`,
      imageUrl,
    };
  }

  /**
   * Search for activities/attractions near a location using the new API
   */
  async searchActivities(
    location: { lat: number; lng: number },
    query?: string,
    type?: string
  ): Promise<any[]> {
    try {
      if (!window.google || !window.google.maps) {
        throw new Error('Google Maps not loaded');
      }

      // Use the new searchNearby method
      const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
      
      const request = {
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'primaryType', 'photos', 'rating', 'userRatingCount'],
        locationRestriction: {
          center: location,
          radius: 50000, // 50km radius
        },
        includedTypes: type ? [type] : ['tourist_attraction', 'restaurant', 'museum', 'park'],
        textQuery: query || 'things to do attractions restaurants',
        maxResultCount: 20,
      };

      const { places } = await Place.searchNearby(request);
      
      return places || [];
    } catch (error) {
      console.error('Error searching activities:', error);
      throw error;
    }
  }
}