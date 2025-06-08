import { useState, useCallback } from 'react';

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  geometry: {
    location: {
      lat: number | (() => number);
      lng: number | (() => number);
    };
  };
  rating?: number;
  price_level?: number;
  types?: string[];
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  photos?: Array<{
    getUrl: (opts: { maxWidth: number }) => string;
  }>;
}

interface SearchOptions {
  types?: string[];
}

export function useGooglePlacesSearch() {
  const [loading, setLoading] = useState(false);

  const searchPlaces = useCallback(async (
    query: string,
    options?: SearchOptions
  ): Promise<PlaceResult[]> => {
    if (!query.trim()) return [];

    setLoading(true);
    try {
      // Use the Google Places Text Search API directly
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('Google Maps API key not configured');
        return [];
      }

      const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
      searchUrl.searchParams.set('query', query);
      searchUrl.searchParams.set('key', apiKey);
      
      if (options?.types && options.types.length > 0) {
        searchUrl.searchParams.set('type', options.types[0]);
      }

      // Since we can't call Google Places API directly from the browser due to CORS,
      // we'll use a server-side proxy endpoint
      const response = await fetch('/api/places/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          types: options?.types
        })
      });

      if (!response.ok) {
        throw new Error('Failed to search places');
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    searchPlaces,
    loading
  };
}