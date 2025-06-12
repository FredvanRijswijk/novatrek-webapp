import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tripId = searchParams.get('tripId');

  if (!tripId) {
    return NextResponse.json({ error: 'Missing tripId' }, { status: 400 });
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
    
    // Get days subcollection
    const daysSnapshot = await adminDb
      .collection('trips')
      .doc(tripId)
      .collection('days')
      .orderBy('date', 'asc')
      .get();
    
    const days = daysSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      activities: [] // Will be populated below
    }));
    
    // Get activities for each day
    for (const day of days) {
      const activitiesSnapshot = await adminDb
        .collection('trips')
        .doc(tripId)
        .collection('days')
        .doc(day.id)
        .collection('activities')
        .orderBy('startTime', 'asc')
        .get();
      
      day.activities = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    
    // Analyze trip structure
    const analysis = {
      tripId,
      tripData: {
        ...tripData,
        // Mask sensitive data
        travelers: tripData?.travelers?.map((t: any) => ({ 
          name: t.name, 
          email: t.email ? '***' : undefined 
        }))
      },
      structure: {
        hasV1Fields: {
          destination: !!tripData?.destination,
          destinations: !!tripData?.destinations,
          itinerary: !!tripData?.itinerary
        },
        hasV2Fields: {
          destinationName: !!tripData?.destinationName,
          destinationCoordinates: !!tripData?.destinationCoordinates,
          destinationId: !!tripData?.destinationId,
          userId: !!tripData?.userId,
          userRef: !!tripData?.userRef
        },
        subcollections: {
          daysCount: days.length,
          totalActivities: days.reduce((sum, day) => sum + day.activities.length, 0)
        }
      },
      missingFields: [],
      recommendations: []
    };
    
    // Check for missing fields
    if (!tripData?.destinationName) {
      analysis.missingFields.push('destinationName');
      analysis.recommendations.push('Add destinationName field to trip document');
    }
    
    if (!tripData?.destinationCoordinates) {
      analysis.missingFields.push('destinationCoordinates');
      analysis.recommendations.push('Add destinationCoordinates (lat/lng) to trip document');
    }
    
    if (!tripData?.userId && !tripData?.userRef) {
      analysis.missingFields.push('userId or userRef');
      analysis.recommendations.push('Add userId field for proper ownership');
    }
    
    // Extract destination info from various sources
    const extractedDestination = {
      fromTitle: extractDestinationFromTitle(tripData?.title || tripData?.name),
      fromDestination: tripData?.destination?.name,
      fromDestinations: tripData?.destinations?.[0]?.destination?.name,
      fromDays: days[0]?.destinationName
    };
    
    return NextResponse.json({
      analysis,
      extractedDestination,
      days: days.map(d => ({
        id: d.id,
        date: d.date,
        dayNumber: d.dayNumber,
        destinationName: d.destinationName,
        activityCount: d.activities.length
      })),
      migrationNeeded: analysis.missingFields.length > 0,
      migrationEndpoint: analysis.missingFields.length > 0 
        ? `/api/trips/migrate-v2?tripId=${tripId}`
        : null
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('Error analyzing trip:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze trip',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function extractDestinationFromTitle(title?: string): string | null {
  if (!title) return null;
  
  // Common patterns: "Trip to X", "X Trip", "Visit to X", etc.
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