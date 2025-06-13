import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { headers } from 'next/headers';
import logger from '@/lib/logging/server-logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

    const { userId } = await params;

    // Get all user's trips
    const trips: any[] = [];

    try {
      // First try with userRef (new format)
      const tripsRefSnapshot = await db.collection('trips')
        .where('userRef', '==', db.doc(`users/${userId}`))
        .orderBy('createdAt', 'desc')
        .get();
      
      for (const doc of tripsRefSnapshot.docs) {
        const tripData = doc.data();
        
        // Get activity count
        let activityCount = 0;
        let accommodationCount = 0;
        
        try {
          // Count days and activities
          const daysSnapshot = await db.collection('trips').doc(doc.id).collection('days').get();
          
          for (const dayDoc of daysSnapshot.docs) {
            const activitiesSnapshot = await db.collection('trips')
              .doc(doc.id)
              .collection('days')
              .doc(dayDoc.id)
              .collection('activities')
              .get();
            
            activityCount += activitiesSnapshot.size;
          }
        } catch (error) {
          console.error('Error counting activities:', error);
        }
        
        trips.push({
          id: doc.id,
          title: tripData.title || 'Untitled Trip',
          destination: tripData.destinationName || tripData.destination?.name || 'Unknown',
          destinations: tripData.destinations?.map((d: any) => ({
            name: d.destination?.name || d.destinationName || 'Unknown',
            arrivalDate: d.arrivalDate?.toDate?.()?.toISOString() || d.arrivalDate,
            departureDate: d.departureDate?.toDate?.()?.toISOString() || d.departureDate
          })),
          startDate: tripData.startDate?.toDate?.()?.toISOString() || tripData.startDate,
          endDate: tripData.endDate?.toDate?.()?.toISOString() || tripData.endDate,
          status: tripData.status || 'planning',
          budget: {
            total: tripData.budget?.total || 0,
            currency: tripData.budget?.currency || 'USD',
            breakdown: tripData.budget?.breakdown
          },
          travelers: tripData.travelers || [],
          createdAt: tripData.createdAt?.toDate?.()?.toISOString() || doc.createTime?.toDate?.()?.toISOString(),
          updatedAt: tripData.updatedAt?.toDate?.()?.toISOString() || doc.updateTime?.toDate?.()?.toISOString(),
          activities: activityCount,
          accommodations: accommodationCount
        });
      }
    } catch (e) {
      // Fallback to userId (legacy format)
      try {
        const tripsSnapshot = await db.collection('trips')
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .get();
        
        for (const doc of tripsSnapshot.docs) {
          const tripData = doc.data();
          
          // Get activity count
          let activityCount = 0;
          let accommodationCount = 0;
          
          try {
            // Count days and activities
            const daysSnapshot = await db.collection('trips').doc(doc.id).collection('days').get();
            
            for (const dayDoc of daysSnapshot.docs) {
              const activitiesSnapshot = await db.collection('trips')
                .doc(doc.id)
                .collection('days')
                .doc(dayDoc.id)
                .collection('activities')
                .get();
              
              activityCount += activitiesSnapshot.size;
            }
          } catch (error) {
            console.error('Error counting activities:', error);
          }
          
          trips.push({
            id: doc.id,
            title: tripData.title || 'Untitled Trip',
            destination: tripData.destinationName || tripData.destination?.name || 'Unknown',
            destinations: tripData.destinations?.map((d: any) => ({
              name: d.destination?.name || d.destinationName || 'Unknown',
              arrivalDate: d.arrivalDate?.toDate?.()?.toISOString() || d.arrivalDate,
              departureDate: d.departureDate?.toDate?.()?.toISOString() || d.departureDate
            })),
            startDate: tripData.startDate?.toDate?.()?.toISOString() || tripData.startDate,
            endDate: tripData.endDate?.toDate?.()?.toISOString() || tripData.endDate,
            status: tripData.status || 'planning',
            budget: {
              total: tripData.budget?.total || 0,
              currency: tripData.budget?.currency || 'USD',
              breakdown: tripData.budget?.breakdown
            },
            travelers: tripData.travelers || [],
            createdAt: tripData.createdAt?.toDate?.()?.toISOString() || doc.createTime?.toDate?.()?.toISOString(),
            updatedAt: tripData.updatedAt?.toDate?.()?.toISOString() || doc.updateTime?.toDate?.()?.toISOString(),
            activities: activityCount,
            accommodations: accommodationCount
          });
        }
      } catch (err) {
        console.error('Error fetching trips:', err);
      }
    }

    return NextResponse.json({ trips });

  } catch (error) {
    logger.error('api', 'Error fetching user trips:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}