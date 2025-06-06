import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/config';
import { db } from '@/lib/firebase';
import { doc, updateDoc, setDoc, collection, addDoc, getDoc } from 'firebase/firestore';
import { sendSubscriptionConfirmationEmailServer } from '@/lib/email/server';
import { stripePlans } from '@/lib/stripe/plans';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  
  if (!customer || customer.deleted || !customer.metadata.firebaseUid) {
    console.error('Customer not found or missing Firebase UID');
    return;
  }

  const firebaseUid = customer.metadata.firebaseUid;
  const priceId = subscription.items.data[0]?.price.id;
  
  // Check if this is a new subscription (first payment)
  const userRef = doc(db, 'users', firebaseUid);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();
  const isNewSubscription = !userData?.subscription?.subscriptionId || 
    userData.subscription.subscriptionId !== subscription.id;
  
  const subscriptionData = {
    subscriptionId: subscription.id,
    status: subscription.status,
    planId: priceId,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    updatedAt: new Date(),
  };

  await setDoc(userRef, {
    subscription: subscriptionData,
    updatedAt: new Date(),
  }, { merge: true });

  // Send confirmation email for new subscriptions
  if (isNewSubscription && subscription.status === 'active' && customer.email) {
    try {
      // Find the plan name and features
      const plan = Object.values(stripePlans).find(p => 
        p.priceIdMonthly === priceId || p.priceIdYearly === priceId
      );
      
      if (plan) {
        await sendSubscriptionConfirmationEmailServer(
          customer.email,
          plan.name,
          plan.features
        );
      }
    } catch (error) {
      console.error('Failed to send subscription confirmation email:', error);
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  
  if (!customer || customer.deleted || !customer.metadata.firebaseUid) {
    console.error('Customer not found or missing Firebase UID');
    return;
  }

  const firebaseUid = customer.metadata.firebaseUid;
  
  const userRef = doc(db, 'users', firebaseUid);
  await setDoc(userRef, {
    subscription: {
      subscriptionId: subscription.id,
      status: 'canceled',
      planId: null,
      canceledAt: new Date(),
      updatedAt: new Date(),
    },
    updatedAt: new Date(),
  }, { merge: true });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  
  if (!customer || customer.deleted || !customer.metadata.firebaseUid) {
    return;
  }

  const firebaseUid = customer.metadata.firebaseUid;
  
  const paymentsRef = collection(db, 'users', firebaseUid, 'payments');
  await addDoc(paymentsRef, {
    invoiceId: invoice.id,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: 'succeeded',
    paidAt: new Date(invoice.created * 1000),
    createdAt: new Date(),
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  
  if (!customer || customer.deleted || !customer.metadata.firebaseUid) {
    return;
  }

  const firebaseUid = customer.metadata.firebaseUid;
  
  const paymentsRef = collection(db, 'users', firebaseUid, 'payments');
  await addDoc(paymentsRef, {
    invoiceId: invoice.id,
    amount: invoice.amount_due,
    currency: invoice.currency,
    status: 'failed',
    attemptedAt: new Date(invoice.created * 1000),
    createdAt: new Date(),
  });
}

export const runtime = 'nodejs';