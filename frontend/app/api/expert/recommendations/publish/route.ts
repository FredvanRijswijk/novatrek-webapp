import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { MarketplaceModelEnhanced as MarketplaceModel } from '@/lib/models/marketplace-enhanced';
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

    // Get publish data from request
    const { savedPlaceId, ...recommendationData } = await request.json();

    // Publish the recommendation
    const recommendation = await RecommendationModel.publishExpertPlace(
      expert.id,
      savedPlaceId,
      recommendationData
    );

    return NextResponse.json({ 
      success: true, 
      recommendation 
    });

  } catch (error) {
    console.error('Error publishing recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to publish recommendation' },
      { status: 500 }
    );
  }
}