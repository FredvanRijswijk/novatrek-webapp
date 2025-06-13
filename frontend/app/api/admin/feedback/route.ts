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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as any;
    const category = searchParams.get('category') as any;
    const priority = searchParams.get('priority') as any;

    const feedbackModel = new FeedbackModelAdmin();
    const feedback = await feedbackModel.getAllFeedback({
      status: status === 'all' ? undefined : status,
      category: category === 'all' ? undefined : category,
      priority: priority === 'all' ? undefined : priority,
    });

    // Convert timestamps to ISO strings for JSON serialization
    const serializedFeedback = feedback.map(entry => ({
      ...entry,
      createdAt: entry.createdAt?.toDate?.() || entry.createdAt,
      updatedAt: entry.updatedAt?.toDate?.() || entry.updatedAt,
      resolvedAt: entry.resolvedAt?.toDate?.() || entry.resolvedAt,
    }));

    return NextResponse.json(serializedFeedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}