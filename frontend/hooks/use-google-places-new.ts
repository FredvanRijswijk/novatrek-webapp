import { useState, useCallback } from 'react';
import { GooglePlacesClientNew } from '@/lib/google-places/client-new';
import { Destination } from '@/types/travel';

// This would come from environment variables
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface UseGooglePlacesReturn {
  isLoading: boolean;
  error: string | null;
  searchDestinations: (query: string) => Promise<Destination[]>;
  searchActivities: (location: { lat: number; lng: number }, query?: string, types?: string[]) => Promise<any[]>;
}

export function useGooglePlacesNew(): UseGooglePlacesReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create client instance
  const client = GOOGLE_MAPS_API_KEY ? new GooglePlacesClientNew(GOOGLE_MAPS_API_KEY) : null;

  const searchDestinations = useCallback(async (query: string): Promise<Destination[]> => {
    if (!client || !GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not found. Using mock data.');
      return getMockDestinations(query);
    }

    setIsLoading(true);
    setError(null);

    try {
      const destinations = await client.searchDestinations(query);
      setIsLoading(false);
      return destinations;
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to search destinations');
      setIsLoading(false);
      // Fall back to mock data on error
      return getMockDestinations(query);
    }
  }, [client]);

  const searchActivities = useCallback(async (
    location: { lat: number; lng: number },
    query?: string,
    types?: string[]
  ): Promise<any[]> => {
    if (!client || !GOOGLE_MAPS_API_KEY) {
      return getMockActivities();
    }

    setIsLoading(true);
    setError(null);

    try {
      const activities = await client.searchActivities(location, query, types);
      setIsLoading(false);
      return activities;
    } catch (err) {
      console.error('Activity search failed:', err);
      setError('Failed to search activities');
      setIsLoading(false);
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
    {
      id: 'bali-indonesia',
      name: 'Bali',
      country: 'Indonesia',
      city: 'Denpasar',
      coordinates: { lat: -8.4095, lng: 115.1889 },
      timeZone: 'Asia/Makassar',
      currency: 'IDR',
      language: ['id', 'en'],
      description: 'Tropical paradise with rich culture',
      imageUrl: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2'
    },
    {
      id: 'new-york-usa',
      name: 'New York City',
      country: 'United States',
      city: 'New York',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      timeZone: 'America/New_York',
      currency: 'USD',
      language: ['en'],
      description: 'The city that never sleeps',
      imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9'
    },
    {
      id: 'london-uk',
      name: 'London',
      country: 'United Kingdom',
      city: 'London',
      coordinates: { lat: 51.5074, lng: -0.1278 },
      timeZone: 'Europe/London',
      currency: 'GBP',
      language: ['en'],
      description: 'Historic capital with modern flair',
      imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad'
    }
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
    {
      id: 'act_2',
      name: 'Louvre Museum',
      type: 'cultural',
      description: 'World\'s largest art museum and historic monument',
      location: {
        name: 'Louvre Museum',
        address: 'Rue de Rivoli, 75001 Paris',
        coordinates: { lat: 48.8606, lng: 2.3376 }
      },
      duration: 180,
      cost: { amount: 17, currency: 'EUR', perPerson: true },
      rating: 4.7,
      images: ['https://images.unsplash.com/photo-1499856871958-5b9627545d1a'],
    }
  ];
}