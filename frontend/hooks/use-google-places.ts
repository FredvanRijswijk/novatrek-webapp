import { useState, useEffect, useCallback } from 'react';
import { GooglePlacesClient } from '@/lib/google-places/client';
import { loadGoogleMapsAPI, isGoogleMapsLoaded } from '@/lib/google-places/loader';
import { Destination } from '@/types/travel';

// This would come from environment variables
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface UseGooglePlacesReturn {
  isLoading: boolean;
  error: string | null;
  searchDestinations: (query: string) => Promise<Destination[]>;
  searchActivities: (location: { lat: number; lng: number }, query?: string) => Promise<any[]>;
}

export function useGooglePlaces(): UseGooglePlacesReturn {
  const [isLoading, setIsLoading] = useState(!isGoogleMapsLoaded());
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<GooglePlacesClient | null>(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not found. Using mock data.');
      return;
    }

    if (!isGoogleMapsLoaded()) {
      loadGoogleMapsAPI(GOOGLE_MAPS_API_KEY)
        .then(() => {
          setClient(new GooglePlacesClient());
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load Google Maps:', err);
          setError('Failed to load Google Maps');
          setIsLoading(false);
        });
    } else {
      setClient(new GooglePlacesClient());
      setIsLoading(false);
    }
  }, []);

  const searchDestinations = useCallback(async (query: string): Promise<Destination[]> => {
    if (!client || !GOOGLE_MAPS_API_KEY) {
      // Return mock data if API is not available
      return getMockDestinations(query);
    }

    try {
      const predictions = await client.searchDestinations(query);
      
      // Get details for each prediction
      const destinations = await Promise.all(
        predictions.slice(0, 5).map(async (prediction) => {
          try {
            const placeDetails = await client.getPlaceDetails(prediction.place_id);
            return GooglePlacesClient.placeToDestination(placeDetails);
          } catch (err) {
            console.error('Failed to get place details:', err);
            return null;
          }
        })
      );

      return destinations.filter((d): d is Destination => d !== null);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to search destinations');
      return getMockDestinations(query);
    }
  }, [client]);

  const searchActivities = useCallback(async (
    location: { lat: number; lng: number },
    query?: string
  ): Promise<any[]> => {
    if (!client || !GOOGLE_MAPS_API_KEY) {
      return getMockActivities();
    }

    try {
      const results = await client.searchActivities(location, query);
      return results.map(place => ({
        id: place.place_id,
        name: place.name || '',
        type: mapPlaceTypeToActivityType(place.types || []),
        description: place.vicinity,
        location: place.geometry ? {
          name: place.name || '',
          address: place.formatted_address || place.vicinity || '',
          coordinates: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          }
        } : undefined,
        rating: place.rating,
        images: place.photos?.map(photo => photo.getUrl({ maxWidth: 400 })),
        cost: place.price_level ? {
          amount: place.price_level * 25, // Rough estimate
          currency: 'USD',
          perPerson: true
        } : undefined
      }));
    } catch (err) {
      console.error('Activity search failed:', err);
      return getMockActivities();
    }
  }, [client]);

  return {
    isLoading,
    error,
    searchDestinations,
    searchActivities
  };
}

// Helper function to map Google place types to our activity types
function mapPlaceTypeToActivityType(types: string[]): string {
  const typeMap: Record<string, string> = {
    'tourist_attraction': 'sightseeing',
    'museum': 'cultural',
    'restaurant': 'dining',
    'food': 'dining',
    'park': 'outdoor',
    'natural_feature': 'outdoor',
    'shopping_mall': 'shopping',
    'store': 'shopping',
    'spa': 'wellness',
    'gym': 'wellness',
    'night_club': 'entertainment',
    'bar': 'entertainment',
  };

  for (const type of types) {
    if (typeMap[type]) {
      return typeMap[type];
    }
  }
  return 'activity';
}

// Mock data functions for fallback
function getMockDestinations(query: string): Destination[] {
  const mockDestinations: Destination[] = [
    {
      id: 'paris-france',
      name: 'Paris',
      country: 'France',
      city: 'Paris',
      coordinates: { lat: 48.8566, lng: 2.3522 },
      timeZone: 'Europe/Paris',
      currency: 'EUR',
      language: ['fr', 'en'],
      description: 'City of Light with iconic landmarks',
      imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34'
    },
    {
      id: 'tokyo-japan',
      name: 'Tokyo',
      country: 'Japan',
      city: 'Tokyo',
      coordinates: { lat: 35.6762, lng: 139.6503 },
      timeZone: 'Asia/Tokyo',
      currency: 'JPY',
      language: ['ja', 'en'],
      description: 'Modern metropolis blending tradition and innovation',
      imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf'
    },
    // Add more mock destinations...
  ];

  const filtered = mockDestinations.filter(dest =>
    dest.name.toLowerCase().includes(query.toLowerCase()) ||
    dest.country.toLowerCase().includes(query.toLowerCase())
  );

  return filtered.slice(0, 5);
}

function getMockActivities(): any[] {
  return [
    {
      id: 'act_1',
      name: 'Eiffel Tower Visit',
      type: 'sightseeing',
      description: 'Iconic iron lattice tower with stunning city views',
      location: {
        name: 'Eiffel Tower',
        address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
        coordinates: { lat: 48.8584, lng: 2.2945 }
      },
      duration: 120,
      cost: { amount: 25, currency: 'EUR', perPerson: true },
      rating: 4.8,
      images: ['https://images.unsplash.com/photo-1511739001486-6bfe10ce785f'],
    },
    // Add more mock activities...
  ];
}