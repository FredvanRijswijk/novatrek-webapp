import { NextRequest, NextResponse } from 'next/server';
import { quickActionsPlacesService, QuickActionsPlacesService } from '@/lib/google-places/quick-actions';
import { auth } from '@/lib/firebase/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await auth.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, location, radius = 1500, preferences = {}, interests = [] } = body;

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
    }

    let results;
    let formattedResponse;

    switch (action) {
      case 'nearby-food':
        results = await quickActionsPlacesService.findNearbyRestaurants({
          location,
          radius,
          dietaryRestrictions: preferences.dietaryRestrictions || [],
          priceLevel: preferences.priceLevel,
          limit: 5
        });
        formattedResponse = QuickActionsPlacesService.formatForChat(results, 'restaurants');
        break;

      case 'photo-spots':
        results = await quickActionsPlacesService.findPhotoSpots({
          location,
          radius,
          limit: 5
        });
        formattedResponse = QuickActionsPlacesService.formatForChat(results, 'photo spots');
        break;

      case 'attractions':
        results = await quickActionsPlacesService.findNearbyAttractions({
          location,
          radius,
          interests,
          limit: 5
        });
        formattedResponse = QuickActionsPlacesService.formatForChat(results, 'attractions');
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      results,
      formatted: formattedResponse,
      count: results.length
    });

  } catch (error) {
    console.error('Quick search error:', error);
    return NextResponse.json(
      { error: 'Failed to search places' },
      { status: 500 }
    );
  }
}