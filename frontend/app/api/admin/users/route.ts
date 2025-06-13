import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { headers } from 'next/headers';
import logger from '@/lib/logging/server-logger';

type UserWithMetadata = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  lastActiveAt: string | null;
  disabled: boolean;
  emailVerified: boolean;
  isAdmin: boolean;
  profile?: {
    location?: string;
    bio?: string;
    preferences?: any;
  };
  subscription?: {
    status: string;
    plan: string;
  };
  stats?: {
    tripCount: number;
    lastTripDate: string | null;
  };
};

export async function GET(req: NextRequest) {
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

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const orderBy = searchParams.get('orderBy') || 'createdAt';
    const order = searchParams.get('order') as 'asc' | 'desc' || 'desc';

    // Fetch users from Firebase Auth with pagination
    let listUsersResult = await auth.listUsers(1000); // Max allowed
    let allUsers: UserWithMetadata[] = [];
    
    // Process current batch
    for (const userRecord of listUsersResult.users) {
      // Skip if searching and doesn't match
      if (search && !userRecord.email?.toLowerCase().includes(search.toLowerCase()) &&
          !userRecord.displayName?.toLowerCase().includes(search.toLowerCase())) {
        continue;
      }

      // Get user's Firestore data
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      const userData = userDoc.data();

      // Check if user is admin
      const isAdminDoc = await db.collection('admins').doc(userRecord.uid).get();

      // Get user's trip count and last trip date
      let tripCount = 0;
      let lastTripDate = null;
      
      try {
        // First try with userRef (new format)
        const tripsRefSnapshot = await db.collection('trips')
          .where('userRef', '==', db.doc(`users/${userRecord.uid}`))
          .get();
        
        tripCount = tripsRefSnapshot.size;
        
        if (tripCount > 0) {
          // Get the most recent trip
          const sortedTrips = tripsRefSnapshot.docs.sort((a, b) => {
            const aDate = a.data().createdAt?.toDate() || new Date(0);
            const bDate = b.data().createdAt?.toDate() || new Date(0);
            return bDate.getTime() - aDate.getTime();
          });
          lastTripDate = sortedTrips[0].data().createdAt?.toDate().toISOString() || null;
        }
      } catch (e) {
        // Fallback to userId (legacy format)
        try {
          const tripsSnapshot = await db.collection('trips')
            .where('userId', '==', userRecord.uid)
            .get();
          
          tripCount = tripsSnapshot.size;
          
          if (tripCount > 0) {
            // Get the most recent trip
            const sortedTrips = tripsSnapshot.docs.sort((a, b) => {
              const aDate = a.data().createdAt?.toDate() || new Date(0);
              const bDate = b.data().createdAt?.toDate() || new Date(0);
              return bDate.getTime() - aDate.getTime();
            });
            lastTripDate = sortedTrips[0].data().createdAt?.toDate().toISOString() || null;
          }
        } catch (err) {
          console.error('Error fetching trips:', err);
        }
      }

      const user: UserWithMetadata = {
        uid: userRecord.uid,
        email: userRecord.email || null,
        displayName: userRecord.displayName || null,
        photoURL: userRecord.photoURL || null,
        createdAt: userRecord.metadata.creationTime || null,
        lastSignInAt: userRecord.metadata.lastSignInTime || null,
        lastActiveAt: userData?.lastActiveAt?.toDate?.()?.toISOString() || userRecord.metadata.lastSignInTime || null,
        disabled: userRecord.disabled,
        emailVerified: userRecord.emailVerified,
        isAdmin: isAdminDoc.exists,
        profile: userData ? {
          location: userData.location,
          bio: userData.bio,
          preferences: userData.preferences
        } : undefined,
        subscription: userData?.subscription ? {
          status: userData.subscription.status || 'free',
          plan: userData.subscription.plan || 'free'
        } : { status: 'free', plan: 'free' },
        stats: {
          tripCount,
          lastTripDate
        }
      };

      allUsers.push(user);
    }

    // Handle pagination token for next batch if needed
    while (listUsersResult.pageToken) {
      listUsersResult = await auth.listUsers(1000, listUsersResult.pageToken);
      
      for (const userRecord of listUsersResult.users) {
        if (search && !userRecord.email?.toLowerCase().includes(search.toLowerCase()) &&
            !userRecord.displayName?.toLowerCase().includes(search.toLowerCase())) {
          continue;
        }

        const userDoc = await db.collection('users').doc(userRecord.uid).get();
        const userData = userDoc.data();
        const isAdminDoc = await db.collection('admins').doc(userRecord.uid).get();
        
        // Get user's trip count and last trip date
        let tripCount = 0;
        let lastTripDate = null;
        
        try {
          // First try with userRef (new format)
          const tripsRefSnapshot = await db.collection('trips')
            .where('userRef', '==', db.doc(`users/${userRecord.uid}`))
            .get();
          
          tripCount = tripsRefSnapshot.size;
          
          if (tripCount > 0) {
            // Get the most recent trip
            const sortedTrips = tripsRefSnapshot.docs.sort((a, b) => {
              const aDate = a.data().createdAt?.toDate() || new Date(0);
              const bDate = b.data().createdAt?.toDate() || new Date(0);
              return bDate.getTime() - aDate.getTime();
            });
            lastTripDate = sortedTrips[0].data().createdAt?.toDate().toISOString() || null;
          }
        } catch (e) {
          // Fallback to userId (legacy format)
          try {
            const tripsSnapshot = await db.collection('trips')
              .where('userId', '==', userRecord.uid)
              .get();
            
            tripCount = tripsSnapshot.size;
            
            if (tripCount > 0) {
              // Get the most recent trip
              const sortedTrips = tripsSnapshot.docs.sort((a, b) => {
                const aDate = a.data().createdAt?.toDate() || new Date(0);
                const bDate = b.data().createdAt?.toDate() || new Date(0);
                return bDate.getTime() - aDate.getTime();
              });
              lastTripDate = sortedTrips[0].data().createdAt?.toDate().toISOString() || null;
            }
          } catch (err) {
            console.error('Error fetching trips:', err);
          }
        }

        const user: UserWithMetadata = {
          uid: userRecord.uid,
          email: userRecord.email || null,
          displayName: userRecord.displayName || null,
          photoURL: userRecord.photoURL || null,
          createdAt: userRecord.metadata.creationTime || null,
          lastSignInAt: userRecord.metadata.lastSignInTime || null,
          lastActiveAt: userData?.lastActiveAt?.toDate?.()?.toISOString() || userRecord.metadata.lastSignInTime || null,
          disabled: userRecord.disabled,
          emailVerified: userRecord.emailVerified,
          isAdmin: isAdminDoc.exists,
          profile: userData ? {
            location: userData.location,
            bio: userData.bio,
            preferences: userData.preferences
          } : undefined,
          subscription: userData?.subscription ? {
            status: userData.subscription.status || 'free',
            plan: userData.subscription.plan || 'free'
          } : { status: 'free', plan: 'free' },
          stats: {
            tripCount,
            lastTripDate
          }
        };

        allUsers.push(user);
      }
    }

    // Sort users
    allUsers.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (orderBy) {
        case 'email':
          aVal = a.email || '';
          bVal = b.email || '';
          break;
        case 'displayName':
          aVal = a.displayName || '';
          bVal = b.displayName || '';
          break;
        case 'lastSignInAt':
          aVal = a.lastSignInAt || '';
          bVal = b.lastSignInAt || '';
          break;
        case 'lastActiveAt':
          aVal = a.lastActiveAt || a.lastSignInAt || '';
          bVal = b.lastActiveAt || b.lastSignInAt || '';
          break;
        case 'tripCount':
          aVal = a.stats?.tripCount || 0;
          bVal = b.stats?.tripCount || 0;
          break;
        case 'createdAt':
        default:
          aVal = a.createdAt || '';
          bVal = b.createdAt || '';
      }

      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = allUsers.slice(startIndex, endIndex);

    // Calculate stats
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(u => !u.disabled).length;
    const verifiedUsers = allUsers.filter(u => u.emailVerified).length;
    const subscribedUsers = allUsers.filter(u => u.subscription?.status === 'active').length;

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit)
      },
      stats: {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
        subscribed: subscribedUsers
      }
    });

  } catch (error) {
    logger.error('api', 'Error fetching users:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user endpoint
export async function PATCH(req: NextRequest) {
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
    
    // Check if admin has permission to update users
    const adminData = adminDoc.data();
    const permissions = adminData?.permissions || [];
    const hasUserPermission = permissions.some((perm: any) => 
      perm.resource === 'users' && perm.actions.includes('update')
    );
    
    if (!hasUserPermission) {
      return NextResponse.json({ error: 'Forbidden - No user update permission' }, { status: 403 });
    }

    const body = await req.json();
    const { uid, updates } = body;

    if (!uid) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Update Firebase Auth user if needed
    if (updates.disabled !== undefined || updates.emailVerified !== undefined) {
      await auth.updateUser(uid, {
        disabled: updates.disabled,
        emailVerified: updates.emailVerified
      });
    }

    // Update Firestore user document if profile data provided
    if (updates.profile) {
      await db.collection('users').doc(uid).update({
        ...updates.profile,
        updatedAt: new Date()
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('api', 'Error updating user:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}