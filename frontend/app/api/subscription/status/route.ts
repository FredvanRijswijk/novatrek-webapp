import { NextRequest, NextResponse } from 'next/server';
import { auth, getAdminDb } from '@/lib/firebase/admin';
import { SUBSCRIPTION_PLANS, stripePlans } from '@/lib/stripe/plans';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get admin database
    const adminDb = getAdminDb();
    if (!adminDb) {
      // Fallback to free plan if database is not available
      return NextResponse.json({
        subscription: null,
        currentPlan: 'free',
        isActive: false,
        limits: SUBSCRIPTION_PLANS.free.limits,
      });
    }

    // Get user document
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.subscription || userData.subscription.status !== 'active') {
      // No active subscription - return free plan
      return NextResponse.json({
        subscription: null,
        currentPlan: 'free',
        isActive: false,
        limits: SUBSCRIPTION_PLANS.free.limits,
      });
    }

    // Determine the plan based on priceId
    let currentPlan = 'free';
    let planLimits = SUBSCRIPTION_PLANS.free.limits;

    const priceId = userData.subscription.priceId;
    
    if (priceId === stripePlans.basic.priceIdMonthly || priceId === stripePlans.basic.priceIdYearly) {
      currentPlan = 'basic';
      planLimits = SUBSCRIPTION_PLANS.basic.limits;
    } else if (priceId === stripePlans.pro.priceIdMonthly || priceId === stripePlans.pro.priceIdYearly) {
      currentPlan = 'pro';
      planLimits = SUBSCRIPTION_PLANS.pro.limits;
    }

    return NextResponse.json({
      subscription: userData.subscription,
      currentPlan,
      isActive: true,
      limits: planLimits,
      priceId: priceId,
    });

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    // Fallback to free plan on error
    return NextResponse.json({
      subscription: null,
      currentPlan: 'free',
      isActive: false,
      limits: SUBSCRIPTION_PLANS.free.limits,
    });
  }
}