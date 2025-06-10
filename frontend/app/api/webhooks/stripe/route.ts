import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/config';
import { db } from '@/lib/firebase';
import { doc, updateDoc, setDoc, collection, addDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
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
import { handleConnectWebhook, isAccountOnboarded } from '@/lib/stripe/connect';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function to check if event was already processed
async function isEventProcessed(eventId: string): Promise<boolean> {
  const eventRef = doc(db, 'webhook_events', eventId);
  const eventDoc = await getDoc(eventRef);
  return eventDoc.exists();
}

// Helper function to mark event as processed
async function markEventAsProcessed(event: Stripe.Event) {
  const eventRef = doc(db, 'webhook_events', event.id);
  await setDoc(eventRef, {
    eventId: event.id,
    type: event.type,
    processedAt: new Date(),
    livemode: event.livemode,
    createdAt: new Date(event.created * 1000),
  });
}

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
    // Check if event was already processed
    if (await isEventProcessed(event.id)) {
      console.log(`Event ${event.id} already processed, skipping`);
      return NextResponse.json({ received: true });
    }

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

      // Stripe Connect Account Events
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;
      }

      case 'account.application.authorized': {
        const account = event.data.object as Stripe.Account;
        await handleAccountAuthorized(account);
        break;
      }

      case 'account.application.deauthorized': {
        const account = event.data.object as Stripe.Account;
        await handleAccountDeauthorized(account);
        break;
      }

      case 'capability.updated': {
        const capability = event.data.object as Stripe.Capability;
        await handleCapabilityUpdated(capability);
        break;
      }

      // Payout Events
      case 'payout.created': {
        const payout = event.data.object as Stripe.Payout;
        await handlePayoutCreated(payout);
        break;
      }

      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;
        await handlePayoutPaid(payout);
        break;
      }

      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;
        await handlePayoutFailed(payout);
        break;
      }

      // Transfer Events
      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        await handleTransferCreated(transfer);
        break;
      }

      case 'transfer.updated': {
        const transfer = event.data.object as Stripe.Transfer;
        await handleTransferUpdated(transfer);
        break;
      }

      // Subscription events
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription, event);
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

    // Mark event as processed after successful handling
    await markEventAsProcessed(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    // Don't mark as processed if there was an error
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription, event: Stripe.Event) {
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
  // Check event type to avoid sending multiple emails for updates
  if (isNewSubscription && subscription.status === 'active' && customer.email && event.type === 'customer.subscription.created') {
    try {
      // Check if we already sent an email for this subscription
      const emailSentRef = doc(db, 'email_tracking', `sub_confirm_${subscription.id}`);
      const emailSentDoc = await getDoc(emailSentRef);
      
      if (!emailSentDoc.exists()) {
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
          
          // Mark email as sent
          await setDoc(emailSentRef, {
            sentAt: new Date(),
            subscriptionId: subscription.id,
            customerId: customerId,
            email: customer.email,
          });
        }
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
  
  // Send cancellation email with idempotency check
  if (customer.email && userData?.displayName) {
    try {
      const emailSentRef = doc(db, 'email_tracking', `sub_cancel_${subscription.id}`);
      const emailSentDoc = await getDoc(emailSentRef);
      
      if (!emailSentDoc.exists()) {
        await sendSubscriptionCancelledEmailServer(
          customer.email,
          userData.displayName || 'Valued Customer'
        );
        
        // Mark email as sent
        await setDoc(emailSentRef, {
          sentAt: new Date(),
          subscriptionId: subscription.id,
          customerId: customerId,
          email: customer.email,
        });
      }
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
  
  // Use invoice ID as document ID for idempotency
  const paymentRef = doc(db, 'users', firebaseUid, 'payments', invoice.id);
  
  // Check if payment already recorded
  const paymentDoc = await getDoc(paymentRef);
  if (!paymentDoc.exists()) {
    await setDoc(paymentRef, {
      invoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      paidAt: new Date(invoice.created * 1000),
      createdAt: new Date(),
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  
  if (!customer || customer.deleted || !customer.metadata.firebaseUid) {
    return;
  }

  const firebaseUid = customer.metadata.firebaseUid;
  
  // Use invoice ID as document ID for idempotency
  const paymentRef = doc(db, 'users', firebaseUid, 'payments', `${invoice.id}_failed_${Date.now()}`);
  
  await setDoc(paymentRef, {
    invoiceId: invoice.id,
    amount: invoice.amount_due,
    currency: invoice.currency,
    status: 'failed',
    attemptedAt: new Date(invoice.created * 1000),
    createdAt: new Date(),
  });
  
  // Send payment failed email with idempotency check
  if (customer.email && invoice.subscription) {
    try {
      const emailSentRef = doc(db, 'email_tracking', `payment_failed_${invoice.id}_${invoice.attempt_count}`);
      const emailSentDoc = await getDoc(emailSentRef);
      
      if (!emailSentDoc.exists()) {
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
        
        // Mark email as sent
        await setDoc(emailSentRef, {
          sentAt: new Date(),
          invoiceId: invoice.id,
          attemptCount: invoice.attempt_count,
          customerId: customerId,
          email: customer.email,
        });
      }
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
      const emailSentRef = doc(db, 'email_tracking', `trial_ending_${subscription.id}_${daysUntilEnd}d`);
      const emailSentDoc = await getDoc(emailSentRef);
      
      if (!emailSentDoc.exists()) {
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
        
        // Mark email as sent
        await setDoc(emailSentRef, {
          sentAt: new Date(),
          subscriptionId: subscription.id,
          daysUntilEnd: daysUntilEnd,
          customerId: customerId,
          email: customer.email,
        });
      }
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
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
      if (!periodEnd) return;
      
      const daysUntilRenewal = Math.ceil((periodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      // Only send if renewal is in 7 days or less
      if (daysUntilRenewal <= 7 && daysUntilRenewal > 0) {
        const emailSentRef = doc(db, 'email_tracking', `renewal_${subscription.id}_${periodEnd.getTime()}`);
        const emailSentDoc = await getDoc(emailSentRef);
        
        if (!emailSentDoc.exists()) {
          const userRef = doc(db, 'users', firebaseUid);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data();
          
          const priceId = subscription.items.data[0]?.price.id;
          const plan = Object.values(stripePlans).find(p => 
            p.priceIdMonthly === priceId || p.priceIdYearly === priceId
          );
          
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
          
          // Mark email as sent
          await setDoc(emailSentRef, {
            sentAt: new Date(),
            subscriptionId: subscription.id,
            periodEnd: periodEnd,
            customerId: customerId,
            email: customer.email,
          });
        }
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
    transaction_id,
  } = paymentIntent.metadata;

  if (!product_id || !buyer_id || !expert_id || !transaction_id) {
    console.error('Missing required marketplace metadata:', paymentIntent.metadata);
    return;
  }

  // Find and update the transaction
  const transactionRef = doc(db, 'marketplace_transactions', transaction_id);
  const transactionDoc = await getDoc(transactionRef);
  
  if (transactionDoc.exists()) {
    const currentData = transactionDoc.data();
    
    // Only update if not already completed (idempotency)
    if (currentData.status !== 'completed') {
      await updateDoc(transactionRef, {
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

      // Send confirmation emails with idempotency
      try {
        const emailSentRef = doc(db, 'email_tracking', `order_${transaction_id}`);
        const emailSentDoc = await getDoc(emailSentRef);
        
        if (!emailSentDoc.exists()) {
          // Get buyer and expert information
          const [buyerDoc, expertDoc, productDataDoc] = await Promise.all([
            getDoc(doc(db, 'users', buyer_id)),
            getDoc(doc(db, 'users', expert_id)),
            getDoc(doc(db, 'marketplace_products', product_id))
          ]);
          
          const buyerData = buyerDoc.data();
          const expertData = expertDoc.data();
          const productData = productDataDoc.data();
          
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
          
          // Mark emails as sent
          await setDoc(emailSentRef, {
            sentAt: new Date(),
            transactionId: transaction_id,
            buyerEmail: buyerData?.email,
            expertEmail: expertData?.email,
          });
        }
      } catch (error) {
        console.error('Failed to send marketplace order emails:', error);
      }
    }
  }
}

async function handleMarketplacePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const {
    product_id,
    buyer_id,
    expert_id,
    transaction_id,
  } = paymentIntent.metadata;

  if (!product_id || !buyer_id || !expert_id || !transaction_id) {
    console.error('Missing required marketplace metadata:', paymentIntent.metadata);
    return;
  }

  // Find and update the transaction
  const transactionRef = doc(db, 'marketplace_transactions', transaction_id);
  const transactionDoc = await getDoc(transactionRef);
  
  if (transactionDoc.exists()) {
    const currentData = transactionDoc.data();
    
    // Only update if not already marked as failed
    if (currentData.status !== 'failed' && currentData.status !== 'completed') {
      await updateDoc(transactionRef, {
        status: 'failed',
        failedAt: new Date(),
        updatedAt: new Date(),
        failureReason: paymentIntent.last_payment_error?.message,
      });
    }
  }
}

// Connect Account Event Handlers
async function handleAccountUpdated(account: Stripe.Account) {
  try {
    // Find the expert by Stripe account ID
    const expertsRef = collection(db, 'marketplace_experts');
    const q = query(expertsRef, where('stripeAccountId', '==', account.id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const expertDoc = querySnapshot.docs[0];
      const expertData = expertDoc.data();
      
      // Update expert's account status
      await updateDoc(expertDoc.ref, {
        stripeAccountStatus: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          capabilities: account.capabilities,
        },
        updatedAt: new Date(),
      });

      // Log the update
      console.log(`Updated Connect account status for expert ${expertData.userId}`);
    }
  } catch (error) {
    console.error('Error handling account.updated:', error);
  }
}

async function handleAccountAuthorized(account: Stripe.Account) {
  try {
    console.log(`Connect account ${account.id} authorized the application`);
    // Additional logic for when an expert authorizes your platform
  } catch (error) {
    console.error('Error handling account.application.authorized:', error);
  }
}

async function handleAccountDeauthorized(account: Stripe.Account) {
  try {
    // Find and deactivate the expert
    const expertsRef = collection(db, 'marketplace_experts');
    const q = query(expertsRef, where('stripeAccountId', '==', account.id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const expertDoc = querySnapshot.docs[0];
      
      // Deactivate the expert account
      await updateDoc(expertDoc.ref, {
        status: 'inactive',
        stripeAccountId: null,
        stripeAccountStatus: null,
        deactivatedAt: new Date(),
        deactivationReason: 'stripe_deauthorized',
        updatedAt: new Date(),
      });

      console.log(`Deactivated expert account due to Stripe deauthorization`);
    }
  } catch (error) {
    console.error('Error handling account.application.deauthorized:', error);
  }
}

async function handleCapabilityUpdated(capability: Stripe.Capability) {
  try {
    // Find the expert by account ID
    const expertsRef = collection(db, 'marketplace_experts');
    const q = query(expertsRef, where('stripeAccountId', '==', capability.account));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const expertDoc = querySnapshot.docs[0];
      
      // Update specific capability status
      await updateDoc(expertDoc.ref, {
        [`stripeAccountStatus.capabilities.${capability.id}`]: capability.status,
        updatedAt: new Date(),
      });

      console.log(`Updated capability ${capability.id} to ${capability.status} for account ${capability.account}`);
    }
  } catch (error) {
    console.error('Error handling capability.updated:', error);
  }
}

// Payout Event Handlers
async function handlePayoutCreated(payout: Stripe.Payout) {
  try {
    // Find the expert by Stripe account ID
    const expertsRef = collection(db, 'marketplace_experts');
    const q = query(expertsRef, where('stripeAccountId', '==', payout.destination));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const expertDoc = querySnapshot.docs[0];
      const expertData = expertDoc.data();
      
      // Check if payout already exists (idempotency)
      const payoutsRef = collection(db, 'marketplace_payouts');
      const existingPayoutQuery = query(payoutsRef, where('stripePayoutId', '==', payout.id));
      const existingPayout = await getDocs(existingPayoutQuery);
      
      if (existingPayout.empty) {
        // Record the payout
        await addDoc(payoutsRef, {
          expertId: expertDoc.id,
          userId: expertData.userId,
          stripePayoutId: payout.id,
          amount: payout.amount,
          currency: payout.currency,
          status: payout.status,
          type: payout.type,
          method: payout.method,
          arrivalDate: payout.arrival_date ? new Date(payout.arrival_date * 1000) : null,
          createdAt: new Date(),
        });

        console.log(`Recorded payout ${payout.id} for expert ${expertData.userId}`);
      }
    }
  } catch (error) {
    console.error('Error handling payout.created:', error);
  }
}

async function handlePayoutPaid(payout: Stripe.Payout) {
  try {
    // Update payout status to paid
    const payoutsRef = collection(db, 'marketplace_payouts');
    const q = query(payoutsRef, where('stripePayoutId', '==', payout.id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const payoutDoc = querySnapshot.docs[0];
      const currentData = payoutDoc.data();
      
      // Only update if not already marked as paid
      if (currentData.status !== 'paid') {
        await updateDoc(payoutDoc.ref, {
          status: 'paid',
          paidAt: new Date(),
          updatedAt: new Date(),
        });

        // TODO: Send payout confirmation email to expert
        console.log(`Payout ${payout.id} marked as paid`);
      }
    }
  } catch (error) {
    console.error('Error handling payout.paid:', error);
  }
}

async function handlePayoutFailed(payout: Stripe.Payout) {
  try {
    // Update payout status to failed
    const payoutsRef = collection(db, 'marketplace_payouts');
    const q = query(payoutsRef, where('stripePayoutId', '==', payout.id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const payoutDoc = querySnapshot.docs[0];
      
      await updateDoc(payoutDoc.ref, {
        status: 'failed',
        failureCode: payout.failure_code,
        failureMessage: payout.failure_message,
        failedAt: new Date(),
        updatedAt: new Date(),
      });

      // TODO: Send payout failure notification to expert
      console.log(`Payout ${payout.id} failed: ${payout.failure_message}`);
    }
  } catch (error) {
    console.error('Error handling payout.failed:', error);
  }
}

// Transfer Event Handlers
async function handleTransferCreated(transfer: Stripe.Transfer) {
  try {
    // Check if transfer already exists (idempotency)
    const transfersRef = collection(db, 'marketplace_transfers');
    const existingTransferQuery = query(transfersRef, where('stripeTransferId', '==', transfer.id));
    const existingTransfer = await getDocs(existingTransferQuery);
    
    if (existingTransfer.empty) {
      // Record the transfer (platform fee split)
      await addDoc(transfersRef, {
        stripeTransferId: transfer.id,
        amount: transfer.amount,
        currency: transfer.currency,
        destination: transfer.destination,
        sourceTransaction: transfer.source_transaction,
        metadata: transfer.metadata,
        createdAt: new Date(),
      });

      console.log(`Recorded transfer ${transfer.id} to ${transfer.destination}`);
    }
  } catch (error) {
    console.error('Error handling transfer.created:', error);
  }
}

async function handleTransferUpdated(transfer: Stripe.Transfer) {
  try {
    // Update transfer status
    const transfersRef = collection(db, 'marketplace_transfers');
    const q = query(transfersRef, where('stripeTransferId', '==', transfer.id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const transferDoc = querySnapshot.docs[0];
      
      await updateDoc(transferDoc.ref, {
        reversed: transfer.reversed,
        reversals: transfer.reversals?.data || [],
        updatedAt: new Date(),
      });

      if (transfer.reversed) {
        console.log(`Transfer ${transfer.id} was reversed`);
      }
    }
  } catch (error) {
    console.error('Error handling transfer.updated:', error);
  }
}

// V2 Account Handlers
async function handleAccountUpdatedV2(account: Stripe.Account, v2Data: any) {
  try {
    // Find the expert by Stripe account ID
    const expertsRef = collection(db, 'marketplace_experts');
    const q = query(expertsRef, where('stripeAccountId', '==', account.id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const expertDoc = querySnapshot.docs[0];
      const expertData = expertDoc.data();
      
      // Update expert's account status with v2 data
      const updateData: any = {
        stripeAccountStatus: {
          chargesEnabled: v2Data.onboardingStatus.canAcceptPayments,
          payoutsEnabled: v2Data.onboardingStatus.canReceivePayouts,
          detailsSubmitted: account.details_submitted,
          capabilities: account.capabilities,
          requirementsNeeded: v2Data.onboardingStatus.requirementsNeeded,
        },
        updatedAt: new Date(),
      };
      
      // If configurations are available, store them
      if (v2Data.configurations) {
        updateData.stripeAccountConfigurations = v2Data.configurations;
      }
      
      await updateDoc(expertDoc.ref, updateData);
      
      // If onboarding is complete, update status
      if (v2Data.onboardingStatus.isComplete && expertData.status === 'pending') {
        await updateDoc(expertDoc.ref, {
          onboardingComplete: true,
          status: 'active',
        });
      }
      
      console.log(`Updated Connect v2 account status for expert ${expertData.userId}`);
    }
  } catch (error) {
    console.error('Error handling v2 account.updated:', error);
  }
}

async function handleCapabilityUpdatedV2(capability: Stripe.Capability, v2Data: any) {
  try {
    // Find the expert by account ID
    const expertsRef = collection(db, 'marketplace_experts');
    const q = query(expertsRef, where('stripeAccountId', '==', capability.account));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const expertDoc = querySnapshot.docs[0];
      
      // Update specific capability status
      await updateDoc(expertDoc.ref, {
        [`stripeAccountStatus.capabilities.${capability.id}`]: capability.status,
        [`stripeAccountConfigurations.${v2Data.capability}_status`]: v2Data.status,
        updatedAt: new Date(),
      });

      console.log(`Updated v2 capability ${capability.id} to ${capability.status} for account ${capability.account}`);
    }
  } catch (error) {
    console.error('Error handling v2 capability.updated:', error);
  }
}

export const runtime = 'nodejs';
