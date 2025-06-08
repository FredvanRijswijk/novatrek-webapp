import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query, types } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not configured');
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      );
    }

    // Build the search URL
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    searchUrl.searchParams.set('query', query);
    searchUrl.searchParams.set('key', apiKey);
    
    // Add type filter if provided
    if (types && types.length > 0) {
      searchUrl.searchParams.set('type', types[0]);
    }

    // Make the request to Google Places API
    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return NextResponse.json(
        { error: 'Failed to search places' },
        { status: 500 }
      );
    }

    // Transform the results to ensure consistent format
    const results = (data.results || []).map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      vicinity: place.vicinity,
      geometry: {
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        }
      },
      rating: place.rating,
      price_level: place.price_level,
      types: place.types,
      address_components: place.address_components,
      photos: place.photos?.map((photo: any) => ({
        photo_reference: photo.photo_reference,
        height: photo.height,
        width: photo.width,
        getUrl: (opts: { maxWidth: number }) => 
          `/api/places/photo?name=${photo.photo_reference}&maxWidth=${opts.maxWidth}`
      }))
    }));

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Places search error:', error);
    return NextResponse.json(
      { error: 'Failed to search places' },
      { status: 500 }
    );
  }
}