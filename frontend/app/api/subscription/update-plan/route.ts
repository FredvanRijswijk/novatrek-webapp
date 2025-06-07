import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { auth, getAdminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import serverLogger from '@/lib/logging/server-logger'

export async function POST(request: NextRequest) {
  const endpoint = '/api/subscription/update-plan'
  
  try {
    // Verify authentication from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await serverLogger.logApiResponse(endpoint, 'POST', 401)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid
    
    await serverLogger.logApiRequest(endpoint, 'POST', userId)

    const { priceId, isYearly } = await request.json()

    if (!priceId) {
      await serverLogger.logApiResponse(endpoint, 'POST', 400, userId, { error: 'Price ID is required' })
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 })
    }

    // Get user's Stripe customer ID using Admin SDK
    const adminDb = getAdminDb()
    if (!adminDb) {
      await serverLogger.logApiError(endpoint, 'POST', new Error('Database initialization failed'), userId)
      return NextResponse.json({ error: 'Database initialization failed' }, { status: 500 })
    }
    
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()

    if (!userData?.stripeCustomerId) {
      await serverLogger.logApiResponse(endpoint, 'POST', 400, userId, { error: 'No Stripe customer found' })
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 })
    }

    // Get current subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripeCustomerId,
      status: 'active',
      limit: 1
    })

    if (subscriptions.data.length === 0) {
      // No active subscription - create new one
      await serverLogger.logSubscriptionEvent('create_subscription', userId, { priceId })
      
      const subscription = await stripe.subscriptions.create({
        customer: userData.stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent']
      })

      const invoice = subscription.latest_invoice as any
      
      await serverLogger.logStripeOperation('subscription.create', true, {
        subscriptionId: subscription.id,
        customerId: userData.stripeCustomerId,
        priceId
      })
      
      await serverLogger.logApiResponse(endpoint, 'POST', 200, userId, { type: 'new_subscription' })
      
      return NextResponse.json({
        type: 'new_subscription',
        clientSecret: invoice.payment_intent.client_secret,
        subscriptionId: subscription.id
      })
    }

    // Update existing subscription
    const currentSubscription = subscriptions.data[0]
    const currentItem = currentSubscription.items.data[0]

    // Check if it's the same price (no change needed)
    if (currentItem.price.id === priceId) {
      await serverLogger.logApiResponse(endpoint, 'POST', 200, userId, { type: 'no_change' })
      return NextResponse.json({ 
        message: 'Already subscribed to this plan',
        type: 'no_change'
      })
    }

    // Update the subscription with proration
    await serverLogger.logSubscriptionEvent('update_subscription', userId, { 
      fromPriceId: currentItem.price.id,
      toPriceId: priceId 
    })
    
    const updatedSubscription = await stripe.subscriptions.update(
      currentSubscription.id,
      {
        items: [{
          id: currentItem.id,
          price: priceId,
        }],
        proration_behavior: 'always_invoice', // Create invoice immediately for the difference
        expand: ['latest_invoice.payment_intent']
      }
    )
    
    await serverLogger.logStripeOperation('subscription.update', true, {
      subscriptionId: currentSubscription.id,
      fromPriceId: currentItem.price.id,
      toPriceId: priceId
    })

    // Get the latest invoice to check if payment is needed
    const latestInvoice = updatedSubscription.latest_invoice as any
    
    if (latestInvoice && latestInvoice.payment_intent && latestInvoice.payment_intent.status === 'requires_payment_method') {
      // Payment required for upgrade
      await serverLogger.logApiResponse(endpoint, 'POST', 200, userId, { 
        type: 'payment_required',
        amount: latestInvoice.amount_due 
      })
      
      return NextResponse.json({
        type: 'payment_required',
        clientSecret: latestInvoice.payment_intent.client_secret,
        amount: latestInvoice.amount_due
      })
    }

    // No payment required (likely a downgrade with credit)
    
    // Update user's subscription data in Firestore using Admin SDK
    await adminDb.collection('users').doc(userId).update({
      subscription: {
        tier: isYearly ? 'premium_yearly' : 'premium_monthly',
        priceId: priceId,
        status: 'active',
        updatedAt: FieldValue.serverTimestamp()
      }
    })
    
    await serverLogger.logApiResponse(endpoint, 'POST', 200, userId, { type: 'updated' })
    
    return NextResponse.json({
      type: 'updated',
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
        priceId: priceId
      }
    })

  } catch (error: any) {
    await serverLogger.logApiError(endpoint, 'POST', error, userId)
    console.error('Subscription update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update subscription' },
      { status: 500 }
    )
  }
}