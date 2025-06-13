import { NextRequest, NextResponse } from 'next/server';
import { FeedbackModelAdmin } from '@/lib/models/feedback-model-admin';
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

    const feedbackModel = new FeedbackModelAdmin();
    const stats = await feedbackModel.getFeedbackStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback stats' },
      { status: 500 }
    );
  }
}