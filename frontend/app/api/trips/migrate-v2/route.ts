import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

// Destination coordinates for common cities
const DESTINATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'trier': { lat: 49.7490, lng: 6.6371 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'rome': { lat: 41.9028, lng: 12.4964 },
  'berlin': { lat: 52.5200, lng: 13.4050 },
  'amsterdam': { lat: 52.3676, lng: 4.9041 },
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'madrid': { lat: 40.4168, lng: -3.7038 },
  'vienna': { lat: 48.2082, lng: 16.3738 },
  'prague': { lat: 50.0755, lng: 14.4378 },
  'budapest': { lat: 47.4979, lng: 19.0402 },
  'lisbon': { lat: 38.7223, lng: -9.1393 },
  'dublin': { lat: 53.3498, lng: -6.2603 },
  'edinburgh': { lat: 55.9533, lng: -3.1883 },
  'munich': { lat: 48.1351, lng: 11.5820 },
  'brussels': { lat: 50.8503, lng: 4.3517 },
  'copenhagen': { lat: 55.6761, lng: 12.5683 },
  'stockholm': { lat: 59.3293, lng: 18.0686 },
  'oslo': { lat: 59.9139, lng: 10.7522 },
  'helsinki': { lat: 60.1699, lng: 24.9384 }
};

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tripId = searchParams.get('tripId');
  const dryRun = searchParams.get('dryRun') === 'true';

  if (!tripId) {
    return NextResponse.json({ error: 'Missing tripId' }, { status: 400 });
  }

  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Admin DB not initialized' }, { status: 500 });
    }

    // Get trip document
    const tripRef = adminDb.collection('trips').doc(tripId);
    const tripDoc = await tripRef.get();
    
    if (!tripDoc.exists) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const tripData = tripDoc.data();
    const updates: any = {};
    const migrationLog: string[] = [];

    // 1. Extract and add destinationName
    if (!tripData?.destinationName) {
      // Try to extract from various sources
      let destinationName = null;
      
      // From V1 destination field
      if (tripData?.destination?.name) {
        destinationName = tripData.destination.name;
        migrationLog.push(`Extracted destinationName from destination.name: ${destinationName}`);
      }
      // From destinations array
      else if (tripData?.destinations?.[0]?.destination?.name) {
        destinationName = tripData.destinations[0].destination.name;
        migrationLog.push(`Extracted destinationName from destinations[0]: ${destinationName}`);
      }
      // From title
      else if (tripData?.title) {
        destinationName = extractDestinationFromTitle(tripData.title);
        if (destinationName) {
          migrationLog.push(`Extracted destinationName from title: ${destinationName}`);
        }
      }
      
      if (destinationName) {
        updates.destinationName = destinationName;
      }
    }

    // 2. Add destinationCoordinates
    if (!tripData?.destinationCoordinates && updates.destinationName) {
      const coordinates = lookupCoordinates(updates.destinationName);
      if (coordinates) {
        updates.destinationCoordinates = coordinates;
        migrationLog.push(`Added coordinates for ${updates.destinationName}: ${coordinates.lat}, ${coordinates.lng}`);
      } else {
        migrationLog.push(`WARNING: Could not find coordinates for ${updates.destinationName}`);
      }
    }

    // 3. Add destinationId if missing
    if (!tripData?.destinationId && tripData?.destination?.id) {
      updates.destinationId = tripData.destination.id;
      migrationLog.push(`Added destinationId from destination.id: ${updates.destinationId}`);
    }

    // 4. Ensure userId field exists (for V1/V2 compatibility)
    if (!tripData?.userId && tripData?.userRef) {
      // Extract userId from userRef path
      const userRefPath = tripData.userRef._path || tripData.userRef.path;
      const userId = userRefPath?.split('/').pop();
      if (userId) {
        updates.userId = userId;
        migrationLog.push(`Added userId from userRef: ${userId}`);
      }
    }

    // 5. Update days subcollection if needed
    const daysSnapshot = await adminDb
      .collection('trips')
      .doc(tripId)
      .collection('days')
      .get();
    
    if (!daysSnapshot.empty && updates.destinationName) {
      migrationLog.push(`Found ${daysSnapshot.size} days to update`);
      
      if (!dryRun) {
        const batch = adminDb.batch();
        daysSnapshot.docs.forEach(dayDoc => {
          const dayData = dayDoc.data();
          if (!dayData.destinationName) {
            batch.update(dayDoc.ref, { 
              destinationName: updates.destinationName,
              destinationId: updates.destinationId || dayData.destinationId
            });
          }
        });
        await batch.commit();
        migrationLog.push(`Updated ${daysSnapshot.size} days with destination info`);
      }
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      if (!dryRun) {
        await tripRef.update({
          ...updates,
          updatedAt: new Date()
        });
        migrationLog.push(`Trip updated successfully`);
      } else {
        migrationLog.push(`DRY RUN: Would update trip with: ${JSON.stringify(updates, null, 2)}`);
      }
    } else {
      migrationLog.push(`No updates needed - trip already has V2 fields`);
    }

    return NextResponse.json({
      success: true,
      tripId,
      updates,
      migrationLog,
      dryRun
    });

  } catch (error) {
    console.error('Error migrating trip:', error);
    return NextResponse.json({ 
      error: 'Failed to migrate trip',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function extractDestinationFromTitle(title: string): string | null {
  const patterns = [
    /Trip to (.+)$/i,
    /^(.+) Trip$/i,
    /Visit to (.+)$/i,
    /^(.+) Vacation$/i,
    /^(.+) Holiday$/i,
    /Travel to (.+)$/i
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

function lookupCoordinates(destination: string): { lat: number; lng: number } | null {
  const normalized = destination.toLowerCase().trim();
  return DESTINATION_COORDINATES[normalized] || null;
}