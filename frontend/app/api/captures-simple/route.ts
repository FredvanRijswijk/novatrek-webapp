import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// Initialize Firebase (client SDK)
// Use hardcoded values since env vars might not be available in API routes
const firebaseConfig = {
  apiKey: "AIzaSyDcwcJdE5rW5NZlBMZkVuIrAjXyY2LdV_s",
  authDomain: "novatrek-dev.firebaseapp.com",
  projectId: "novatrek-dev",
  storageBucket: "novatrek-dev.firebasestorage.app",
  messagingSenderId: "571946171510",
  appId: "1:571946171510:web:77cfa5dc825f9db8b037ef"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

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

    // Create the capture document
    const captureData: any = {
      userId,
      content: body.content,
      contentType: body.contentType || 'link',
      source: body.source,
      tags: body.tags || [],
      isProcessed: false,
      isSorted: false,
      capturedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only add optional fields if they have values
    if (body.sourceUrl) captureData.sourceUrl = body.sourceUrl;
    if (body.title) captureData.title = body.title;
    if (body.notes) captureData.notes = body.notes;
    if (body.assignedTo) captureData.assignedTo = body.assignedTo;

    // Since we're using client SDK without auth context,
    // we'll add a server timestamp to prove this came from our API
    captureData._serverValidated = true;
    captureData._apiVersion = '1.0';

    // Add to Firestore
    const capturesRef = collection(db, 'captures');
    const docRef = await addDoc(capturesRef, captureData);

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: 'Capture saved successfully'
    });
  } catch (error: any) {
    console.error('Error creating capture:', error);
    
    // Check if it's a permission error
    if (error.code === 'permission-denied') {
      return NextResponse.json(
        { error: 'Permission denied. Check Firestore rules.' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create capture' },
      { status: 500 }
    );
  }
}