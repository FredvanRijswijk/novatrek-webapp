import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/config';
import { db } from '@/lib/firebase';
import { doc, updateDoc, setDoc, collection, addDoc, getDoc } from 'firebase/firestore';
import { 
  sendSubscriptionConfirmationEmailServer,
  sendSubscriptionTrialEndingEmailServer,
  sendPaymentFailedEmailServer,
  sendSubscriptionRenewalEmailServer,
  sendSubscriptionCancelledEmailServer,
  sendBuyerOrderConfirmationEmailServer,
  sendExpertNewOrderEmailServer
} from '@/lib/email/server';
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
      // Marketplace Connect events
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Check if this is a marketplace transaction
        if (paymentIntent.metadata?.product_id) {
          await handleMarketplacePaymentSucceeded(paymentIntent);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Check if this is a marketplace transaction
        if (paymentIntent.metadata?.product_id) {
          await handleMarketplacePaymentFailed(paymentIntent);
        }
        break;
      }

      // Subscription events
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

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleTrialWillEnd(subscription);
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

      case 'invoice.upcoming': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleUpcomingInvoice(invoice);
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
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();
  
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
  
  // Send cancellation email
  if (customer.email && userData?.displayName) {
    try {
      await sendSubscriptionCancelledEmailServer(
        customer.email,
        userData.displayName || 'Valued Customer'
      );
    } catch (error) {
      console.error('Failed to send subscription cancellation email:', error);
    }
  }
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
  
  // Send payment failed email
  if (customer.email && invoice.subscription) {
    try {
      const userRef = doc(db, 'users', firebaseUid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      // Get the subscription to find the plan
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;
      const plan = Object.values(stripePlans).find(p => 
        p.priceIdMonthly === priceId || p.priceIdYearly === priceId
      );
      
      await sendPaymentFailedEmailServer(
        customer.email,
        userData?.displayName || 'Valued Customer',
        plan?.name || 'Premium',
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`
      );
    } catch (error) {
      console.error('Failed to send payment failed email:', error);
    }
  }
}

// Handle trial ending webhook
async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  
  if (!customer || customer.deleted || !customer.metadata.firebaseUid) {
    return;
  }

  const firebaseUid = customer.metadata.firebaseUid;
  
  // Calculate days until trial ends
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
  if (!trialEnd || !customer.email) return;
  
  const daysUntilEnd = Math.ceil((trialEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  // Only send if trial ends in 3 days or less
  if (daysUntilEnd <= 3 && daysUntilEnd > 0) {
    try {
      const userRef = doc(db, 'users', firebaseUid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      const priceId = subscription.items.data[0]?.price.id;
      const plan = Object.values(stripePlans).find(p => 
        p.priceIdMonthly === priceId || p.priceIdYearly === priceId
      );
      
      await sendSubscriptionTrialEndingEmailServer(
        customer.email,
        userData?.displayName || 'Valued Customer',
        daysUntilEnd,
        plan?.name || 'Premium'
      );
    } catch (error) {
      console.error('Failed to send trial ending email:', error);
    }
  }
}

// Handle upcoming invoice (renewal reminder)
async function handleUpcomingInvoice(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  
  if (!customer || customer.deleted || !customer.metadata.firebaseUid || !customer.email) {
    return;
  }

  const firebaseUid = customer.metadata.firebaseUid;
  
  // Only send renewal reminders, not trial ending invoices
  if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
    try {
      const userRef = doc(db, 'users', firebaseUid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;
      const plan = Object.values(stripePlans).find(p => 
        p.priceIdMonthly === priceId || p.priceIdYearly === priceId
      );
      
      // Calculate days until renewal
      const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
      if (!periodEnd) return;
      
      const daysUntilRenewal = Math.ceil((periodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      // Only send if renewal is in 7 days or less
      if (daysUntilRenewal <= 7 && daysUntilRenewal > 0) {
        await sendSubscriptionRenewalEmailServer(
          customer.email,
          userData?.displayName || 'Valued Customer',
          plan?.name || 'Premium',
          (invoice.amount_due / 100).toFixed(2),
          periodEnd.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        );
      }
    } catch (error) {
      console.error('Failed to send renewal reminder email:', error);
    }
  }
}

// Marketplace payment handlers
async function handleMarketplacePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const {
    product_id,
    buyer_id,
    expert_id,
  } = paymentIntent.metadata;

  if (!product_id || !buyer_id || !expert_id) {
    console.error('Missing required marketplace metadata:', paymentIntent.metadata);
    return;
  }

  // Find and update the transaction
  const transactionsRef = collection(db, 'marketplace_transactions');
  const transactionQuery = await getDoc(doc(transactionsRef, paymentIntent.metadata.transaction_id || ''));
  
  if (transactionQuery.exists()) {
    await updateDoc(transactionQuery.ref, {
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
      stripePaymentIntentId: paymentIntent.id,
    });

    // Update product sales count
    const productRef = doc(db, 'marketplace_products', product_id);
    const productDoc = await getDoc(productRef);
    
    if (productDoc.exists()) {
      const currentSales = productDoc.data().salesCount || 0;
      await updateDoc(productRef, {
        salesCount: currentSales + 1,
        lastSaleAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Send confirmation emails
    try {
      // Get buyer and expert information
      const [buyerDoc, expertDoc, productDoc] = await Promise.all([
        getDoc(doc(db, 'users', buyer_id)),
        getDoc(doc(db, 'users', expert_id)),
        getDoc(doc(db, 'marketplace_products', product_id))
      ]);
      
      const buyerData = buyerDoc.data();
      const expertData = expertDoc.data();
      const productData = productDoc.data();
      
      if (buyerData?.email && productData) {
        // Send order confirmation to buyer
        await sendBuyerOrderConfirmationEmailServer(
          buyerData.email,
          buyerData.displayName || 'Valued Customer',
          productData.name,
          expertData?.businessName || 'Expert',
          (paymentIntent.amount / 100).toFixed(2),
          new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        );
      }
      
      if (expertData?.email && productData) {
        // Send new order notification to expert
        const orderDetails = `
Product: ${productData.name}
Category: ${productData.category}
Price: $${(paymentIntent.amount / 100).toFixed(2)}
        `.trim();
        
        await sendExpertNewOrderEmailServer(
          expertData.email,
          expertData.displayName || expertData.businessName || 'Expert',
          orderDetails,
          buyerData?.displayName || 'Customer',
          (paymentIntent.amount / 100).toFixed(2)
        );
      }
    } catch (error) {
      console.error('Failed to send marketplace order emails:', error);
    }
  }
}

async function handleMarketplacePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const {
    product_id,
    buyer_id,
    expert_id,
  } = paymentIntent.metadata;

  if (!product_id || !buyer_id || !expert_id) {
    console.error('Missing required marketplace metadata:', paymentIntent.metadata);
    return;
  }

  // Find and update the transaction
  const transactionsRef = collection(db, 'marketplace_transactions');
  const transactionQuery = await getDoc(doc(transactionsRef, paymentIntent.metadata.transaction_id || ''));
  
  if (transactionQuery.exists()) {
    await updateDoc(transactionQuery.ref, {
      status: 'failed',
      failedAt: new Date(),
      updatedAt: new Date(),
      failureReason: paymentIntent.last_payment_error?.message,
    });
  }
}

export const runtime = 'nodejs';