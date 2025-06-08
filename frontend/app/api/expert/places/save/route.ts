import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { MarketplaceModel } from '@/lib/models/marketplace';
import { RecommendationModel } from '@/lib/models/recommendations';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    // Check if user is an expert
    const expert = await MarketplaceModel.getExpertByUserId(userId);
    if (!expert || expert.status !== 'active') {
      return NextResponse.json({ error: 'Expert access required' }, { status: 403 });
    }

    // Get place data from request
    const placeData = await request.json();

    // Save place to expert's collection
    const savedPlace = await RecommendationModel.saveExpertPlace(expert.id, {
      googlePlaceId: placeData.googlePlaceId,
      name: placeData.name,
      location: placeData.location,
      type: placeData.type,
      tags: placeData.tags || [],
      personalNotes: placeData.personalNotes || '',
      isPublic: false
    });

    return NextResponse.json({ 
      success: true, 
      savedPlace 
    });

  } catch (error) {
    console.error('Error saving place:', error);
    return NextResponse.json(
      { error: 'Failed to save place' },
      { status: 500 }
    );
  }
}