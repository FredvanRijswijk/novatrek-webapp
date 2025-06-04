import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/config';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    // Get user document
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const subscription = userData.subscription;

    // Determine current plan
    let currentPlan = 'free';
    let isActive = false;

    if (subscription && subscription.status === 'active') {
      isActive = true;
      // Match price ID to plan
      for (const [planKey, planData] of Object.entries(SUBSCRIPTION_PLANS)) {
        if (planKey !== 'free' && 
            (planData.monthlyPriceId === subscription.planId || 
             planData.yearlyPriceId === subscription.planId)) {
          currentPlan = planKey;
          break;
        }
      }
    }

    return NextResponse.json({
      subscription: subscription || null,
      currentPlan,
      isActive,
      limits: SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS].limits,
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}