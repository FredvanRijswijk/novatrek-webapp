import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { getAdminDb } from '@/lib/firebase/admin';
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
    
    // Check if user is admin
    const adminDb = getAdminDb();
    const adminDoc = await adminDb.collection('admin_users').doc(decodedToken.uid).get();
    
    if (!adminDoc.exists || !adminDoc.data()?.isActive) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get recommendation data from request
    const data = await request.json();

    // Create NovaTrek recommendation
    const recommendation = await RecommendationModel.createRecommendation({
      googlePlaceId: data.googlePlaceId,
      name: data.name,
      location: data.location,
      type: data.type,
      recommendedBy: {
        type: 'novatrek',
        id: 'novatrek',
        name: 'NovaTrek'
      },
      reason: data.reason,
      description: data.description,
      tags: data.tags || [],
      seasons: data.seasons,
      priceLevel: data.priceLevel,
      rating: data.rating,
      images: data.images || [],
      tips: data.tips || [],
      highlights: data.highlights || [],
      openingHours: data.openingHours,
      phone: data.phone,
      website: data.website,
      bookingUrl: data.bookingUrl,
      status: 'active',
      featured: data.featured || false
    });

    return NextResponse.json({ 
      success: true, 
      recommendation 
    });

  } catch (error) {
    console.error('Error creating NovaTrek recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to create recommendation' },
      { status: 500 }
    );
  }
}