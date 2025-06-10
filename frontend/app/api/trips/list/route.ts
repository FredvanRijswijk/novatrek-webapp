import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, adminDb } from '@/lib/firebase/admin'

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    
    // Verify the token
    const decodedToken = await verifyIdToken(token)
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decodedToken.uid

    // Get user's trips
    const tripsSnapshot = await adminDb
      .collection('trips')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()

    const trips = tripsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      destinations: doc.data().destinations || [],
      startDate: doc.data().startDate,
      endDate: doc.data().endDate,
      status: doc.data().status || 'planning'
    }))

    return NextResponse.json({ trips })
  } catch (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    )
  }
}