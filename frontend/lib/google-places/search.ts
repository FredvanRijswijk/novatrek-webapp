/**
 * Server-side Google Places search functionality
 * Uses the Google Places API Web Service
 */

interface SearchPlacesOptions {
  query: string;
  type?: string;
  location?: string | { lat: number; lng: number };
  radius?: number;
  language?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  openNow?: boolean;
  pageToken?: string;
}

interface PlaceSearchResult {
  place_id: string;
  name: string;
  displayName?: { text: string };
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  priceLevel?: number;
  types?: string[];
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  editorialSummary?: { text: string };
}

/**
 * Search for places using Google Places API
 */
export async function searchPlaces(
  query: string,
  type?: string,
  location?: string | { lat: number; lng: number },
  radius: number = 5000
): Promise<PlaceSearchResult[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  // Format location parameter
  let locationParam = '';
  if (location) {
    if (typeof location === 'string') {
      locationParam = location;
    } else {
      locationParam = `${location.lat},${location.lng}`;
    }
  }

  // Use Text Search API for better results
  const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
  const params = new URLSearchParams({
    query: type ? `${query} ${type}` : query,
    key: apiKey,
    ...(locationParam && { location: locationParam }),
    ...(radius && { radius: radius.toString() }),
    language: 'en',
  });

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', data.status, data.error_message);
      return [];
    }

    // Convert to our format
    return (data.results || []).map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      displayName: { text: place.name },
      formattedAddress: place.formatted_address || place.vicinity || '',
      location: {
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0,
      },
      rating: place.rating,
      priceLevel: place.price_level,
      types: place.types || [],
      photos: place.photos,
      editorialSummary: place.editorial_summary ? { text: place.editorial_summary } : undefined,
    }));
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}

/**
 * Search for nearby places
 */
export async function searchNearbyPlaces(
  location: { lat: number; lng: number },
  type: string,
  radius: number = 1500,
  keyword?: string
): Promise<PlaceSearchResult[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
  const params = new URLSearchParams({
    location: `${location.lat},${location.lng}`,
    radius: radius.toString(),
    type,
    key: apiKey,
    ...(keyword && { keyword }),
  });

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', data.status, data.error_message);
      return [];
    }

    return (data.results || []).map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      displayName: { text: place.name },
      formattedAddress: place.vicinity || '',
      location: {
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0,
      },
      rating: place.rating,
      priceLevel: place.price_level,
      types: place.types || [],
      photos: place.photos,
    }));
  } catch (error) {
    console.error('Error searching nearby places:', error);
    return [];
  }
}