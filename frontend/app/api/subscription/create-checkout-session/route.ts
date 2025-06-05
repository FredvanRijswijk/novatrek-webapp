import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    console.log('Create checkout session called');
    const { priceId, userId, userEmail, trial_period_days } = await req.json();
    
    console.log('Request data:', { priceId, userId, userEmail, trial_period_days });

    if (!priceId || !userId || !userEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already has a Stripe customer ID
    console.log('Checking Firebase for existing customer...');
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    let stripeCustomerId = userDoc.data()?.stripeCustomerId;
    console.log('Existing Stripe customer ID:', stripeCustomerId);

    // Create or retrieve Stripe customer
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          firebaseUid: userId,
        },
      });
      stripeCustomerId = customer.id;

      // Save Stripe customer ID to Firestore
      await setDoc(userRef, { stripeCustomerId }, { merge: true });
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