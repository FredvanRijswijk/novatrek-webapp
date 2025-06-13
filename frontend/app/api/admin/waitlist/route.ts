import { NextRequest, NextResponse } from 'next/server';
import { WaitlistModel } from '@/lib/models/waitlist-model';
import { verifyToken } from '@/lib/firebase/auth-admin';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await verifyToken(token);
    if (!decodedToken || !decodedToken.admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const waitlistModel = new WaitlistModel();
    const entries = await waitlistModel.getWaitlistEntries(
      status === 'all' ? undefined : status as any
    );

    // Convert Firestore timestamps to ISO strings for JSON serialization
    const serializedEntries = entries.map(entry => ({
      ...entry,
      createdAt: entry.createdAt?.toDate?.() || entry.createdAt,
      approvedAt: entry.approvedAt?.toDate?.() || entry.approvedAt,
      invitedAt: entry.invitedAt?.toDate?.() || entry.invitedAt,
    }));

    return NextResponse.json(serializedEntries);
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waitlist' },
      { status: 500 }
    );
  }
}