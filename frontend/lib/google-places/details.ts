/**
 * Server-side Google Places details functionality
 * Uses the Google Places API Web Service
 */

interface PlaceDetailsOptions {
  fields?: string[];
  language?: string;
  region?: string;
  sessionToken?: string;
}

interface PlaceDetailsResult {
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
  opening_hours?: {
    open_now?: boolean;
    periods?: Array<{
      open: { day: number; time: string };
      close?: { day: number; time: string };
    }>;
    weekday_text?: string[];
  };
  website?: string;
  phone_number?: string;
  user_ratings_total?: number;
}

/**
 * Get detailed information about a place
 */
export async function getPlaceDetails(
  placeId: string,
  options: PlaceDetailsOptions = {}
): Promise<PlaceDetailsResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const defaultFields = [
    'place_id',
    'name',
    'formatted_address',
    'geometry',
    'rating',
    'price_level',
    'types',
    'photos',
    'editorial_summary',
    'opening_hours',
    'website',
    'formatted_phone_number',
    'user_ratings_total'
  ];

  const fields = options.fields || defaultFields;
  
  const baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
  const params = new URLSearchParams({
    place_id: placeId,
    fields: fields.join(','),
    key: apiKey,
    ...(options.language && { language: options.language }),
    ...(options.region && { region: options.region }),
    ...(options.sessionToken && { sessiontoken: options.sessionToken }),
  });

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Places Details API error:', data.status, data.error_message);
      return null;
    }

    const place = data.result;
    if (!place) return null;

    return {
      place_id: place.place_id,
      name: place.name,
      displayName: { text: place.name },
      formattedAddress: place.formatted_address || '',
      location: {
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0,
      },
      rating: place.rating,
      priceLevel: place.price_level,
      types: place.types || [],
      photos: place.photos,
      editorialSummary: place.editorial_summary,
      opening_hours: place.opening_hours,
      website: place.website,
      phone_number: place.formatted_phone_number,
      user_ratings_total: place.user_ratings_total,
    };
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}

/**
 * Get details for multiple places (batch)
 */
export async function getMultiplePlaceDetails(
  placeIds: string[],
  options: PlaceDetailsOptions = {}
): Promise<Map<string, PlaceDetailsResult | null>> {
  const results = new Map<string, PlaceDetailsResult | null>();
  
  // Process in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < placeIds.length; i += batchSize) {
    const batch = placeIds.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (placeId) => {
        const details = await getPlaceDetails(placeId, options);
        results.set(placeId, details);
      })
    );
    
    // Add a small delay between batches to avoid rate limits
    if (i + batchSize < placeIds.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return results;
}