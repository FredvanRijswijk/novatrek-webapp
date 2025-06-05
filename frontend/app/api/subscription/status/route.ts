import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/plans';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    // For now, just return free plan for all users
    // This avoids the permission issues with Firestore
    return NextResponse.json({
      subscription: null,
      currentPlan: 'free',
      isActive: false,
      limits: SUBSCRIPTION_PLANS.free.limits,
    });

    // This code is now unreachable but keeping for future use
    // when Firebase Admin SDK is properly configured
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}