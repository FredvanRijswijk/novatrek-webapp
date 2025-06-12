import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tripId = searchParams.get('tripId');
  const userId = searchParams.get('userId');

  if (!tripId || !userId) {
    return NextResponse.json({ error: 'Missing tripId or userId' }, { status: 400 });
  }

  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Admin DB not initialized' }, { status: 500 });
    }

    // Get trip document
    const tripDoc = await adminDb.collection('trips').doc(tripId).get();
    
    if (!tripDoc.exists) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const tripData = tripDoc.data();
    
    // Check ownership
    const ownershipInfo = {
      tripId,
      requestingUserId: userId,
      trip: {
        userId: tripData?.userId,
        userRef: tripData?.userRef?.path,
        sharedWith: tripData?.sharedWith || [],
        createdAt: tripData?.createdAt,
        title: tripData?.title || tripData?.name
      },
      ownership: {
        hasUserId: !!tripData?.userId,
        hasUserRef: !!tripData?.userRef,
        userIdMatches: tripData?.userId === userId,
        userRefMatches: tripData?.userRef?.path === `users/${userId}`,
        isSharedWith: tripData?.sharedWith?.includes(userId) || false
      },
      canAccess: 
        tripData?.userId === userId || 
        tripData?.userRef?.path === `users/${userId}` ||
        tripData?.sharedWith?.includes(userId)
    };

    return NextResponse.json(ownershipInfo);
  } catch (error) {
    console.error('Error checking trip:', error);
    return NextResponse.json({ 
      error: 'Failed to check trip',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}