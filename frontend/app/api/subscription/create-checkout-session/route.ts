import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { auth, getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    console.log('Create checkout session called');
    const { priceId, trial_period_days } = await req.json();
    
    console.log('Request data:', { priceId, userId, userEmail, trial_period_days });

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
    }

    // Get admin database
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Database initialization failed' }, { status: 500 });
    }

    // Check if user already has a Stripe customer ID
    console.log('Checking Firebase for existing customer...');
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    let stripeCustomerId = userData?.stripeCustomerId;
    console.log('Existing Stripe customer ID:', stripeCustomerId);

    // Create or retrieve Stripe customer
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: userId,
          firebaseUID: userId,
        },
      });
      stripeCustomerId = customer.id;

      // Save Stripe customer ID to Firestore
      if (userDoc.exists) {
        await adminDb.collection('users').doc(userId).update({
          stripeCustomerId: customer.id,
          updatedAt: FieldValue.serverTimestamp()
        });
      } else {
        await adminDb.collection('users').doc(userId).set({
          uid: userId,
          email: userEmail,
          stripeCustomerId: customer.id,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    }

    // Create checkout session
    const sessionParams: any = {
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId,
      },
    };

    // Add trial period if specified
    if (trial_period_days) {
      sessionParams.subscription_data = {
        trial_period_days: trial_period_days,
      };
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';