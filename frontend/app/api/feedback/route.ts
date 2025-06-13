import { NextRequest, NextResponse } from 'next/server';
import { FeedbackCategory } from '@/lib/models/feedback-model';
import { FeedbackModelAdmin } from '@/lib/models/feedback-model-admin';
import { verifyIdToken } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { category, title, description, rating } = body;

    // Validate required fields
    if (!category || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: category, title, description' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories: FeedbackCategory[] = [
      'bug', 'feature_request', 'improvement', 'ui_ux', 'performance', 'other'
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Collect metadata
    const metadata = {
      url: request.headers.get('referer') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    };

    const feedbackModel = new FeedbackModelAdmin();
    const feedback = await feedbackModel.createFeedback({
      userId: decodedToken.uid,
      userEmail: decodedToken.email || '',
      userName: decodedToken.name,
      category,
      title,
      description,
      rating,
      metadata,
    });

    // Send Slack notification for high-priority feedback
    if (category === 'bug' || rating === 1) {
      try {
        // Send notification through the notification API
        const notificationResponse = await fetch(`${request.nextUrl.origin}/api/notifications/slack`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'custom',
            data: {
              email: decodedToken.email || 'system@novatrek.app',
              metadata: {
                customMessage: `🚨 New ${category === 'bug' ? 'Bug Report' : 'Critical Feedback'}: ${title}`,
                title,
                category,
                description,
                rating,
                url: metadata.url,
                userId: decodedToken.uid,
              },
            },
          }),
        });

        if (!notificationResponse.ok) {
          console.error('Failed to send Slack notification');
        }
      } catch (error) {
        console.error('Failed to send Slack notification:', error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      feedbackId: feedback.id,
      message: 'Thank you for your feedback! We appreciate your input.' 
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const feedbackModel = new FeedbackModelAdmin();
    const feedback = await feedbackModel.getUserFeedback(decodedToken.uid);

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