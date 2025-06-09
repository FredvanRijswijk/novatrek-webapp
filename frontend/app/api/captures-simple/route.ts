import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get user ID from header (temporary solution)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }
    
    // Validate required fields
    if (!body.content || !body.source) {
      return NextResponse.json(
        { error: 'Missing required fields: content, source' },
        { status: 400 }
      );
    }

    // Get admin DB
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Create the capture document with DocumentReference fields
    const userRef = adminDb.doc(`users/${userId}`);
    
    const captureData: any = {
      userId, // Keep for backward compatibility
      userRef, // Add DocumentReference for better querying
      content: body.content,
      contentType: body.contentType || 'link',
      source: body.source,
      tags: body.tags || [],
      isProcessed: false,
      isSorted: false,
      capturedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Only add optional fields if they have values
    if (body.sourceUrl) captureData.sourceUrl = body.sourceUrl;
    if (body.title) captureData.title = body.title;
    if (body.notes) captureData.notes = body.notes;
    
    // Handle trip assignment with DocumentReference
    if (body.assignedTo) {
      captureData.assignedTo = body.assignedTo;
      captureData.tripRef = adminDb.doc(`trips/${body.assignedTo}`);
      captureData.isSorted = true;
    }

    // Add to Firestore using admin SDK
    const docRef = await adminDb.collection('captures').add(captureData);

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: 'Capture saved successfully'
    });
  } catch (error: any) {
    console.error('Error creating capture:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create capture' },
      { status: 500 }
    );
  }
}