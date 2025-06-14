import { useState, useEffect } from 'react';
import { useGooglePlacesV2 } from './use-google-places-v2';

interface PhotoSpot {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  rating: number;
  photos: number;
  bestTime: string;
  tips?: string;
  crowdLevel?: 'low' | 'medium' | 'high';
  instagramHandle?: string;
  tags?: string[];
  placeId?: string;
}

interface UsePhotoSpotsOptions {
  destination: string;
  lat: number;
  lng: number;
  radius?: number; // in meters
}

export function usePhotoSpots({ destination, lat, lng, radius = 5000 }: UsePhotoSpotsOptions) {
  const [photoSpots, setPhotoSpots] = useState<PhotoSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { searchNearby } = useGooglePlacesV2();

  useEffect(() => {
    const fetchPhotoSpots = async () => {
      setLoading(true);
      setError(null);

      try {
        // Search for tourist attractions and viewpoints
        const [attractions, viewpoints, landmarks] = await Promise.all([
          searchNearby({
            location: { lat, lng },
            radius,
            type: 'tourist_attraction',
            language: 'en'
          }),
          searchNearby({
            location: { lat, lng },
            radius,
            keyword: 'viewpoint|scenic|panoramic|instagram',
            language: 'en'
          }),
          searchNearby({
            location: { lat, lng },
            radius,
            type: 'landmark',
            language: 'en'
          })
        ]);

        // Combine and deduplicate results
        const allPlaces = [...attractions, ...viewpoints, ...landmarks];
        const uniquePlaces = Array.from(
          new Map(allPlaces.map(place => [place.place_id, place])).values()
        );

        // Transform to photo spots
        const spots: PhotoSpot[] = uniquePlaces
          .filter(place => place.rating && place.rating >= 4.0) // Only highly rated spots
          .map(place => ({
            id: place.place_id,
            name: place.name,
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            },
            rating: place.rating || 0,
            photos: place.user_ratings_total || 0,
            bestTime: getBestTime(place),
            crowdLevel: getCrowdLevel(place),
            tips: getPhotoTips(place),
            tags: getPlaceTags(place),
            placeId: place.place_id
          }))
          .sort((a, b) => b.photos - a.photos) // Sort by popularity
          .slice(0, 20); // Limit to top 20 spots

        // Add some curated Instagram spots based on destination
        const instagramSpots = getInstagramSpots(destination);
        const combinedSpots = [...spots, ...instagramSpots].slice(0, 25);

        setPhotoSpots(combinedSpots);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch photo spots');
      } finally {
        setLoading(false);
      }
    };

    if (destination && lat && lng) {
      fetchPhotoSpots();
    }
  }, [destination, lat, lng, radius]);

  return { photoSpots, loading, error };
}

// Helper functions
function getBestTime(place: any): string {
  // Analyze opening hours and typical crowd patterns
  const hasGoldenHour = place.types?.some((type: string) => 
    ['viewpoint', 'natural_feature', 'park'].includes(type)
  );
  
  if (hasGoldenHour) {
    return 'Sunrise or Sunset';
  }
  
  // Check if it's an outdoor attraction
  const isOutdoor = place.types?.some((type: string) => 
    ['park', 'natural_feature', 'hiking_area'].includes(type)
  );
  
  if (isOutdoor) {
    return 'Morning (9-11 AM)';
  }
  
  return 'Afternoon (2-4 PM)';
}

function getCrowdLevel(place: any): 'low' | 'medium' | 'high' {
  const ratings = place.user_ratings_total || 0;
  
  if (ratings > 10000) return 'high';
  if (ratings > 1000) return 'medium';
  return 'low';
}

function getPhotoTips(place: any): string {
  const tips: string[] = [];
  
  if (place.types?.includes('viewpoint')) {
    tips.push('Use a wide-angle lens for panoramic shots');
  }
  
  if (place.types?.includes('historic_site')) {
    tips.push('Visit early morning to avoid crowds');
  }
  
  if (place.types?.includes('natural_feature')) {
    tips.push('Best lighting during golden hour');
  }
  
  return tips[0] || 'Bring a tripod for stable shots';
}

function getPlaceTags(place: any): string[] {
  const tags: string[] = [];
  
  // Add type-based tags
  if (place.types?.includes('viewpoint')) tags.push('scenic');
  if (place.types?.includes('historic_site')) tags.push('historic');
  if (place.types?.includes('natural_feature')) tags.push('nature');
  if (place.types?.includes('art_gallery')) tags.push('art');
  
  // Add rating-based tags
  if (place.rating >= 4.8) tags.push('mustvisit');
  if (place.user_ratings_total > 5000) tags.push('popular');
  
  return tags;
}

// Curated Instagram spots by destination
function getInstagramSpots(destination: string): PhotoSpot[] {
  const spots: Record<string, PhotoSpot[]> = {
    'Paris': [
      {
        id: 'ig-paris-1',
        name: 'Rue Crémieux',
        location: { lat: 48.8494, lng: 2.3659 },
        rating: 4.7,
        photos: 15420,
        bestTime: 'Morning (8-10 AM)',
        crowdLevel: 'medium',
        tips: 'Colorful houses perfect for Instagram',
        instagramHandle: 'parisjetaime',
        tags: ['colorful', 'street', 'instagram']
      },
      {
        id: 'ig-paris-2',
        name: 'Pink Mamma Restaurant',
        location: { lat: 48.8816, lng: 2.3342 },
        rating: 4.5,
        photos: 8930,
        bestTime: 'Lunch time',
        crowdLevel: 'high',
        tips: 'Gorgeous interior with plants everywhere',
        instagramHandle: 'bigmammagroup',
        tags: ['restaurant', 'interior', 'plants']
      }
    ],
    'Tokyo': [
      {
        id: 'ig-tokyo-1',
        name: 'TeamLab Borderless',
        location: { lat: 35.6269, lng: 139.7836 },
        rating: 4.6,
        photos: 32100,
        bestTime: 'Weekday afternoons',
        crowdLevel: 'high',
        tips: 'Wear white for best effect in lit rooms',
        instagramHandle: 'teamlab.borderless',
        tags: ['art', 'digital', 'interactive']
      }
    ],
    // Add more destinations...
  };

  return spots[destination] || [];
}