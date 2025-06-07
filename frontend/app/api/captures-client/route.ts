import { NextRequest, NextResponse } from 'next/server';

// This endpoint acts as a proxy that adds server-side data
// The actual Firestore write will happen client-side
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Just validate the required fields
    if (!body.content || !body.source) {
      return NextResponse.json(
        { error: 'Missing required fields: content, source' },
        { status: 400 }
      );
    }

    // Return success - the extension will handle the actual save
    return NextResponse.json({ 
      success: true,
      message: 'Data validated. Extension should save directly to Firestore.'
    });
  } catch (error) {
    console.error('Error processing capture:', error);
    return NextResponse.json(
      { error: 'Failed to process capture' },
      { status: 500 }
    );
  }
}