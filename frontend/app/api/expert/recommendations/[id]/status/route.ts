import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { MarketplaceModelEnhanced as MarketplaceModel } from '@/lib/models/marketplace-enhanced';
import { RecommendationModel } from '@/lib/models/recommendations';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get new status from request
    const { status } = await request.json();
    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update recommendation status
    await RecommendationModel.updateRecommendationStatus(params.id, status);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating recommendation status:', error);
    return NextResponse.json(
      { error: 'Failed to update recommendation status' },
      { status: 500 }
    );
  }
}