import { NextRequest, NextResponse } from 'next/server';
import { WaitlistModel } from '@/lib/models/waitlist-model';
import { signupRateLimit, getIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { notifyWaitlistSignup } from '@/lib/notifications/slack';

export async function POST(request: NextRequest) {
  try {
    // Check rate limit based on IP
    const identifier = getIdentifier(request);
    const { success, limit, reset } = await signupRateLimit.limit(identifier);
    
    if (!success) {
      return rateLimitResponse(limit, reset);
    }

    const body = await request.json();
    const { email, name, interests, referralSource, metadata } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const waitlistModel = new WaitlistModel();

    // Add IP to metadata
    const enhancedMetadata = {
      ...metadata,
      ip: identifier,
    };

    // Add to waitlist
    const entry = await waitlistModel.addToWaitlist({
      email: email.toLowerCase(),
      name,
      interests,
      referralSource,
      metadata: enhancedMetadata,
    });

    // Send welcome email
    try {
      const { sendWaitlistWelcomeEmail } = await import('@/lib/email/waitlist-emails');
      await sendWaitlistWelcomeEmail({
        email: email.toLowerCase(),
        name,
        position: entry.position,
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail the request if email fails
    }

    // Send Slack notification (non-blocking)
    try {
      await notifyWaitlistSignup({
        email: email.toLowerCase(),
        name,
        position: entry.position,
        interests,
        referralSource,
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      // Don't fail the request if Slack notification fails
    }

    return NextResponse.json({
      success: true,
      position: entry.position,
      message: 'Successfully added to waitlist',
    });

  } catch (error) {
    console.error('Waitlist error:', error);
    
    if (error instanceof Error && error.message === 'Email already on waitlist') {
      return NextResponse.json(
        { error: 'This email is already on the waitlist' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // This endpoint can be used to check waitlist position
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const waitlistModel = new WaitlistModel();
    const entry = await waitlistModel.getByEmail(email.toLowerCase());

    if (!entry) {
      return NextResponse.json(
        { error: 'Email not found on waitlist' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      position: entry.position,
      status: entry.status,
      joinedAt: entry.createdAt.toDate().toISOString(),
    });

  } catch (error) {
    console.error('Waitlist check error:', error);
    return NextResponse.json(
      { error: 'Failed to check waitlist status' },
      { status: 500 }
    );
  }
}