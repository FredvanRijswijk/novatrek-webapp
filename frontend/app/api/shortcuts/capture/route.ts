import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// Initialize Firebase
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

// POST /api/shortcuts/capture - iOS Shortcut endpoint
export async function POST(request: NextRequest) {
  try {
    // Get API key from header
    const headersList = headers();
    const apiKey = headersList.get('x-api-key');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      );
    }

    // Validate API key against Firestore
    const apiKeysRef = collection(db, 'apiKeys');
    const q = query(
      apiKeysRef,
      where('key', '==', apiKey),
      where('active', '==', true)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    const apiKeyDoc = snapshot.docs[0];
    const apiKeyData = apiKeyDoc.data();
    const userId = apiKeyData.userId;
    
    // Update last used timestamp
    await updateDoc(doc(db, 'apiKeys', apiKeyDoc.id), {
      lastUsed: Timestamp.now(),
      usageCount: (apiKeyData.usageCount || 0) + 1
    });

    const body = await request.json();
    
    // Validate required fields
    if (!body.url && !body.text) {
      return NextResponse.json(
        { error: 'URL or text is required' },
        { status: 400 }
      );
    }

    // Forward to the captures API
    const captureData = {
      content: body.url || body.text || '',
      contentType: body.url ? 'link' : 'text',
      source: 'ios-shortcuts',
      sourceUrl: body.url,
      title: body.title || body.name || 'Saved from iOS',
      notes: body.notes || body.text,
      tags: body.tags || ['ios-shortcut'],
    };

    // Use the existing capture endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/captures-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(captureData),
    });

    if (!response.ok) {
      throw new Error('Failed to save capture');
    }

    const result = await response.json();

    // Return success response for Shortcuts
    return NextResponse.json({
      success: true,
      message: 'Saved to NovaTrek!',
      captureId: result.id,
      viewUrl: `${baseUrl}/dashboard/captures`,
    });
  } catch (error: any) {
    console.error('Shortcuts API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: 'NovaTrek Shortcuts API',
    version: '1.0',
    endpoints: {
      capture: {
        method: 'POST',
        url: '/api/shortcuts/capture',
        headers: {
          'x-api-key': 'Your API key',
          'Content-Type': 'application/json'
        },
        body: {
          url: 'URL to save (optional)',
          text: 'Text content (optional)',
          title: 'Title (optional)',
          notes: 'Additional notes (optional)',
          tags: ['array', 'of', 'tags'] // optional
        }
      }
    }
  });
}