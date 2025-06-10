import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { getAdminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await verifyIdToken(token);
    
    // Check if user is admin
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Database initialization failed' }, { status: 500 });
    }
    const adminDoc = await adminDb.collection('admin_users').doc(decodedToken.uid).get();
    
    if (!adminDoc.exists || !adminDoc.data()?.isActive) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get featured status from request
    const { featured } = await request.json();

    // Update recommendation featured status
    const docRef = doc(db, 'place_recommendations', id);
    await updateDoc(docRef, {
      featured: !!featured,
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating featured status:', error);
    return NextResponse.json(
      { error: 'Failed to update featured status' },
      { status: 500 }
    );
  }
}