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
    const maxWidth = searchParams.get('maxWidth') || '800';
    const maxHeight = searchParams.get('maxHeight') || '600';

    if (!photoName) {
      return NextResponse.json({ error: 'Photo name is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // The photo name from the new API is in format: places/{place_id}/photos/{photo_id}
    // We need to use the new Photos API endpoint
    const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxWidthPx=${maxWidth}&maxHeightPx=${maxHeight}`;

    // Fetch the photo
    const response = await fetch(photoUrl, {
      headers: {
        'X-Goog-Api-Key': apiKey,
      },
    });

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