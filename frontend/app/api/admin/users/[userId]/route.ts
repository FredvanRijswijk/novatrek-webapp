import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { headers } from 'next/headers';
import logger from '@/lib/logging/server-logger';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAdminAuth();
    const db = getAdminDb();

    if (!db) {
      logger.error('api', 'Firebase Admin DB not initialized');
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    // Verify token and check admin status
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user has admin claims
    const hasAdminClaim = decodedToken.admin === true;
    if (!hasAdminClaim) {
      return NextResponse.json({ error: 'Forbidden - Not an admin' }, { status: 403 });
    }
    
    // Check admin permissions in Firestore
    const adminDoc = await db.collection('admin_users').doc(decodedToken.uid).get();
    
    if (!adminDoc.exists || !adminDoc.data()?.isActive) {
      return NextResponse.json({ error: 'Forbidden - Admin not active' }, { status: 403 });
    }
    
    // Check if admin has permission to read users
    const adminData = adminDoc.data();
    const permissions = adminData?.permissions || [];
    const hasUserPermission = permissions.some((perm: any) => 
      perm.resource === 'users' && perm.actions.includes('read')
    );
    
    if (!hasUserPermission) {
      return NextResponse.json({ error: 'Forbidden - No user read permission' }, { status: 403 });
    }

    const { userId } = params;

    // Get user from Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUser(userId);
    } catch (error) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's Firestore data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Check if user is admin
    const isAdminDoc = await db.collection('admins').doc(userId).get();

    // Get user's trips with more details
    const trips: any[] = [];
    let totalSpent = 0;
    const destinationCounts: Record<string, number> = {};

    try {
      // First try with userRef (new format)
      const tripsRefSnapshot = await db.collection('trips')
        .where('userRef', '==', db.doc(`users/${userId}`))
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      
      tripsRefSnapshot.forEach(doc => {
        const tripData = doc.data();
        trips.push({
          id: doc.id,
          title: tripData.title || 'Untitled Trip',
          destination: tripData.destinationName || tripData.destination?.name || 'Unknown',
          startDate: tripData.startDate?.toDate?.()?.toISOString() || tripData.startDate,
          endDate: tripData.endDate?.toDate?.()?.toISOString() || tripData.endDate,
          status: tripData.status || 'planning',
          budget: tripData.budget?.total || 0
        });
        
        totalSpent += tripData.budget?.total || 0;
        
        // Count destinations
        const dest = tripData.destinationName || tripData.destination?.name;
        if (dest) {
          destinationCounts[dest] = (destinationCounts[dest] || 0) + 1;
        }
      });
    } catch (e) {
      // Fallback to userId (legacy format)
      try {
        const tripsSnapshot = await db.collection('trips')
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(10)
          .get();
        
        tripsSnapshot.forEach(doc => {
          const tripData = doc.data();
          trips.push({
            id: doc.id,
            title: tripData.title || 'Untitled Trip',
            destination: tripData.destinationName || tripData.destination?.name || 'Unknown',
            startDate: tripData.startDate?.toDate?.()?.toISOString() || tripData.startDate,
            endDate: tripData.endDate?.toDate?.()?.toISOString() || tripData.endDate,
            status: tripData.status || 'planning',
            budget: tripData.budget?.total || 0
          });
          
          totalSpent += tripData.budget?.total || 0;
          
          // Count destinations
          const dest = tripData.destinationName || tripData.destination?.name;
          if (dest) {
            destinationCounts[dest] = (destinationCounts[dest] || 0) + 1;
          }
        });
      } catch (err) {
        console.error('Error fetching trips:', err);
      }
    }

    // Get favorite destinations (top 5 most visited)
    const favoriteDestinations = Object.entries(destinationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([dest]) => dest);

    // Get travel preferences
    let preferences = null;
    try {
      const prefsDoc = await db.collection('travel_preferences').doc(userId).get();
      if (prefsDoc.exists) {
        preferences = prefsDoc.data();
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }

    const userDetails = {
      uid: userRecord.uid,
      email: userRecord.email || null,
      displayName: userRecord.displayName || null,
      photoURL: userRecord.photoURL || null,
      phoneNumber: userRecord.phoneNumber || null,
      createdAt: userRecord.metadata.creationTime || null,
      lastSignInAt: userRecord.metadata.lastSignInTime || null,
      lastActiveAt: userData?.lastActiveAt?.toDate?.()?.toISOString() || userRecord.metadata.lastSignInTime || null,
      disabled: userRecord.disabled,
      emailVerified: userRecord.emailVerified,
      isAdmin: isAdminDoc.exists,
      providers: userRecord.providerData.map(p => p.providerId),
      profile: userData ? {
        location: userData.location,
        bio: userData.bio,
        preferences: preferences ? {
          travelStyle: preferences.travelStyle,
          interests: preferences.activities,
          dietaryRestrictions: preferences.dietaryRestrictions,
          accommodationPreferences: preferences.accommodationTypes
        } : undefined
      } : undefined,
      subscription: userData?.subscription ? {
        subscriptionId: userData.subscription.subscriptionId,
        status: userData.subscription.status || 'free',
        planId: userData.subscription.planId,
        currentPeriodEnd: userData.subscription.currentPeriodEnd?.toDate?.()?.toISOString(),
        cancelAtPeriodEnd: userData.subscription.cancelAtPeriodEnd || false
      } : null,
      stats: {
        tripCount: trips.length,
        lastTripDate: trips[0]?.startDate || null,
        totalSpent,
        favoriteDestinations
      },
      trips
    };

    return NextResponse.json(userDetails);

  } catch (error) {
    logger.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}