import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { smartExtract } from '@/lib/captures/extractor';
import { Timestamp } from 'firebase-admin/firestore';

// POST /api/captures-process - Process a capture with AI extraction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { captureId } = body;

    if (!captureId) {
      return NextResponse.json(
        { error: 'Missing captureId' },
        { status: 400 }
      );
    }

    // Get admin DB
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Fetch the capture
    const captureDoc = await adminDb.collection('captures').doc(captureId).get();
    
    if (!captureDoc.exists) {
      return NextResponse.json(
        { error: 'Capture not found' },
        { status: 404 }
      );
    }

    const capture: any = { id: captureDoc.id, ...captureDoc.data() };

    // Skip if already processed
    if (capture.isProcessed) {
      return NextResponse.json({ 
        message: 'Capture already processed',
        extractedData: capture.extractedData 
      });
    }

    // Extract content with AI
    console.log('Processing capture:', captureId);
    const extractedData = await smartExtract(capture);

    // Clean extracted data to remove undefined values
    const cleanData = JSON.parse(JSON.stringify(extractedData || {}));

    // Update the capture with extracted data
    await adminDb.collection('captures').doc(captureId).update({
      extractedData: cleanData,
      isProcessed: true,
      processedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // If we found a location, we could enhance it with Google Places data
    if (extractedData?.location?.name) {
      // TODO: Search Google Places for more details
      console.log('Found location:', extractedData.location.name);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Capture processed successfully',
      extractedData 
    });
  } catch (error) {
    console.error('Error processing capture:', error);
    return NextResponse.json(
      { error: 'Failed to process capture' },
      { status: 500 }
    );
  }
}

// GET /api/captures-process - Process unprocessed captures in batch
export async function GET(request: NextRequest) {
  try {
    // Get admin DB
    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error('Admin DB not initialized');
      return NextResponse.json(
        { error: 'Database not configured. Check Firebase Admin SDK setup.' },
        { status: 500 }
      );
    }

    // Get unprocessed captures (limit to prevent timeout)
    console.log('Fetching unprocessed captures...');
    const snapshot = await adminDb.collection('captures')
      .where('isProcessed', '==', false)
      .limit(10)
      .get();

    console.log(`Found ${snapshot.size} unprocessed captures`);
    
    if (snapshot.empty) {
      return NextResponse.json({ 
        processed: 0,
        message: 'No unprocessed captures found',
        results: [] 
      });
    }

    const results = [];
    
    for (const doc of snapshot.docs) {
      try {
        const capture = { id: doc.id, ...doc.data() };
        const extractedData = await smartExtract(capture);
        
        // Clean extracted data to remove undefined values
        const cleanData = JSON.parse(JSON.stringify(extractedData || {}));
        
        await doc.ref.update({
          extractedData: cleanData,
          isProcessed: true,
          processedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        
        results.push({ 
          id: doc.id, 
          success: true,
          hasLocation: !!extractedData?.location 
        });
      } catch (error: any) {
        console.error(`Failed to process capture ${doc.id}:`, error);
        results.push({ id: doc.id, success: false, error: error.message });
      }
    }

    return NextResponse.json({ 
      processed: results.length,
      results 
    });
  } catch (error: any) {
    console.error('Batch processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process batch',
        details: error.message || 'Unknown error',
        code: error.code
      },
      { status: 500 }
    );
  }
}