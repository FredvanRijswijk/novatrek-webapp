import { GooglePlacesClientV2 } from './client-v2';

interface GeocodingResult {
  placeId: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export class GeocodingService extends GooglePlacesClientV2 {
  /**
   * Geocode a location name to get coordinates and place details
   */
  async geocodeLocation(
    locationName: string,
    nearLocation?: { lat: number; lng: number }
  ): Promise<GeocodingResult | null> {
    try {
      // First try to find the place using text search
      const searchResults = await this.searchPlaces({
        textQuery: locationName,
        location: nearLocation,
        maxResultCount: 1
      });

      if (searchResults.length === 0) {
        console.warn(`No results found for location: ${locationName}`);
        return null;
      }

      const place = searchResults[0];
      
      // Get full place details if we only have basic info
      let fullPlace = place;
      if (!place.location?.latitude || !place.formattedAddress) {
        const details = await this.getPlaceDetails(place.id, {
          fields: ['location', 'formattedAddress', 'displayName']
        });
        fullPlace = { ...place, ...details };
      }

      return {
        placeId: fullPlace.id,
        name: fullPlace.displayName?.text || locationName,
        address: fullPlace.formattedAddress || '',
        coordinates: {
          lat: fullPlace.location?.latitude || 0,
          lng: fullPlace.location?.longitude || 0
        }
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Batch geocode multiple locations
   */
  async geocodeMultipleLocations(
    locations: Array<{ name: string; address?: string }>,
    nearLocation?: { lat: number; lng: number }
  ): Promise<Map<string, GeocodingResult | null>> {
    const results = new Map<string, GeocodingResult | null>();
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (location) => {
          const searchQuery = location.address 
            ? `${location.name} ${location.address}`
            : location.name;
            
          const result = await this.geocodeLocation(searchQuery, nearLocation);
          results.set(location.name, result);
        })
      );
      
      // Add a small delay between batches to avoid rate limits
      if (i + batchSize < locations.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService();