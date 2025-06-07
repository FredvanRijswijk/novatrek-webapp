import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { CreateCaptureInput, TravelCapture } from '@/lib/models/capture';
import { Timestamp } from 'firebase-admin/firestore';

// Helper function to trigger background processing
async function processCapture(captureId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/captures-process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ captureId })
    });
    
    if (!response.ok) {
      console.error('Processing API error:', await response.text());
    }
  } catch (error) {
    console.error('Failed to trigger processing:', error);
  }
}

// POST /api/captures - Create a new capture
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    // TODO: Verify the token properly with Firebase Admin SDK
    // For now, we'll trust the client (ONLY for development)
    
    const body = await request.json() as CreateCaptureInput;
    
    // Validate required fields
    if (!body.content || !body.source) {
      return NextResponse.json(
        { error: 'Missing required fields: content, source' },
        { status: 400 }
      );
    }

    // Extract user ID from the request (in production, get from verified token)
    const userId = request.headers.get('x-user-id') || 'demo-user'; // TEMPORARY

    // Create the capture document - filter out undefined values
    const captureData: any = {
      userId,
      content: body.content,
      contentType: body.contentType || 'link',
      source: body.source,
      tags: body.tags || [],
      isProcessed: false,
      isSorted: false,
      capturedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Only add optional fields if they have values
    if (body.sourceUrl) captureData.sourceUrl = body.sourceUrl;
    if (body.title) captureData.title = body.title;
    if (body.notes) captureData.notes = body.notes;
    if (body.assignedTo) captureData.assignedTo = body.assignedTo;

    // Get admin DB
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Add to Firestore using admin SDK
    const docRef = await adminDb.collection('captures').add(captureData);

    // Trigger AI extraction in the background
    // Don't await this - let it run async
    processCapture(docRef.id).catch(error => {
      console.error('Background processing failed:', error);
    });

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: 'Capture saved successfully'
    });
  } catch (error) {
    console.error('Error creating capture:', error);
    return NextResponse.json(
      { error: 'Failed to create capture' },
      { status: 500 }
    );
  }
}

// GET /api/captures - Fetch user's captures
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const tripId = searchParams.get('tripId');
    const unsortedOnly = searchParams.get('unsorted') === 'true';
    const limitParam = searchParams.get('limit');
    const pageSize = limitParam ? parseInt(limitParam) : 50;

    // Get admin DB
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Extract user ID (in production, get from verified token)
    const userId = request.headers.get('x-user-id') || 'demo-user'; // TEMPORARY

    // Build query
    let capturesQuery = adminDb.collection('captures')
      .where('userId', '==', userId)
      .orderBy('capturedAt', 'desc')
      .limit(pageSize);

    // Add filters
    if (tripId) {
      capturesQuery = capturesQuery.where('assignedTo', '==', tripId);
    } else if (unsortedOnly) {
      capturesQuery = capturesQuery.where('isSorted', '==', false);
    }

    // Execute query
    const snapshot = await capturesQuery.get();
    const captures = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TravelCapture[];

    // Group by trip for better UI
    const grouped = {
      unsorted: captures.filter(c => !c.assignedTo),
      byTrip: {} as Record<string, TravelCapture[]>,
    };

    captures.forEach(capture => {
      if (capture.assignedTo) {
        if (!grouped.byTrip[capture.assignedTo]) {
          grouped.byTrip[capture.assignedTo] = [];
        }
        grouped.byTrip[capture.assignedTo].push(capture);
      }
    });

    return NextResponse.json({
      captures,
      grouped,
      total: captures.length,
    });
  } catch (error) {
    console.error('Error fetching captures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch captures' },
      { status: 500 }
    );
  }
}