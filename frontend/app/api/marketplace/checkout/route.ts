import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { createConnectPaymentIntent } from '@/lib/stripe/connect'
import { stripe } from '@/lib/stripe/config'
import { auth } from 'firebase-admin'
import { MarketplaceModel } from '@/lib/models/marketplace'
import logger from '@/lib/logging/logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    logger.info('marketplace', 'Checkout request initiated')
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth().verifyIdToken(token)
    } catch (error) {
      console.error('Error verifying token:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decodedToken.uid
    const { productId, quantity = 1 } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Get product details
    const product = await MarketplaceModel.getProduct(productId)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.status !== 'active') {
      return NextResponse.json({ error: 'Product is not available' }, { status: 400 })
    }

    // Get expert details to get their Stripe account
    const expert = await MarketplaceModel.getExpert(product.expertId)
    if (!expert || !expert.stripeAccountId) {
      return NextResponse.json({ error: 'Expert not properly configured' }, { status: 400 })
    }

    // Calculate total amount
    const amount = product.price * quantity

    // Create payment intent with platform fee (but don't include transaction_id yet)
    const paymentIntent = await createConnectPaymentIntent(
      amount,
      'usd',
      expert.stripeAccountId,
      {
        product_id: productId,
        product_title: product.title,
        product_type: product.type,
        quantity: quantity.toString(),
        buyer_id: userId,
        expert_id: expert.id,
      }
    )

    // Create pending transaction record
    const transaction = await MarketplaceModel.createTransaction({
      productId,
      productTitle: product.title,
      productType: product.type,
      buyerId: userId,
      sellerId: expert.id,
      sellerStripeAccountId: expert.stripeAccountId,
      amount,
      platformFee: parseInt(paymentIntent.metadata.platform_fee),
      sellerEarnings: parseInt(paymentIntent.metadata.seller_earnings),
      quantity,
      status: 'pending',
      paymentIntentId: paymentIntent.id,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Update payment intent with transaction ID
    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: {
        ...paymentIntent.metadata,
        transaction_id: transaction.id,
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction.id,
      amount,
      platformFee: parseInt(paymentIntent.metadata.platform_fee),
      sellerEarnings: parseInt(paymentIntent.metadata.seller_earnings)
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}