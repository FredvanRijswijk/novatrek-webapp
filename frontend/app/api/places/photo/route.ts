import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoName = searchParams.get('name');
    const placeId = searchParams.get('placeId');
    const maxWidth = searchParams.get('maxWidth') || '800';
    const maxHeight = searchParams.get('maxHeight') || '600';

    if (!photoName && !placeId) {
      return NextResponse.json({ error: 'Photo name or place ID is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    let photoUrl: string;
    let response: Response;

    // If we have a place ID, get the first photo from place details
    if (placeId && !photoName) {
      // First, get place details to find photo references
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      if (detailsData.status !== 'OK' || !detailsData.result?.photos?.[0]) {
        return NextResponse.json({ error: 'No photos found for this place' }, { status: 404 });
      }

      // Use the first photo reference
      const photoRef = detailsData.result.photos[0].photo_reference;
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${apiKey}`;
      response = await fetch(photoUrl);
    } else if (photoName) {
      // The photo name from the new API is in format: places/{place_id}/photos/{photo_id}
      // We need to use the new Photos API endpoint
      photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxWidthPx=${maxWidth}&maxHeightPx=${maxHeight}`;

      // Fetch the photo
      response = await fetch(photoUrl, {
        headers: {
          'X-Goog-Api-Key': apiKey,
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (!response.ok) {
      console.error('Places API photo fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        photoName,
        url: photoUrl
      });
      
      // If the new API fails, try the old photo API format
      const photoRef = photoName.split('/').pop();
      const oldApiUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoRef}&key=${apiKey}`;
      
      const oldResponse = await fetch(oldApiUrl);
      if (oldResponse.ok) {
        const imageBuffer = await oldResponse.arrayBuffer();
        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }
      
      console.error('Old API photo fetch also failed:', {
        status: oldResponse.status,
        statusText: oldResponse.statusText,
        photoRef,
        url: oldApiUrl
      });
      
      return NextResponse.json({ 
        error: 'Failed to fetch photo',
        details: {
          newApiStatus: response.status,
          oldApiStatus: oldResponse.status
        }
      }, { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error fetching place photo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}