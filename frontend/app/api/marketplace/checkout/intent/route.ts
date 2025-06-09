import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'
import { stripe } from '@/lib/stripe/config'
import { MarketplaceModelEnhanced as MarketplaceModel } from '@/lib/models/marketplace-enhanced'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    const { productId, amount } = await request.json()

    if (!productId || !amount) {
      return NextResponse.json({ error: 'Product ID and amount required' }, { status: 400 })
    }

    // Verify product exists and is active
    const product = await MarketplaceModel.getProduct(productId)
    if (!product || product.status !== 'active') {
      return NextResponse.json({ error: 'Product not found or not available' }, { status: 404 })
    }

    // Verify amount matches product price
    if (product.price !== amount) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Get expert info
    const expert = await MarketplaceModel.getExpert(product.expertId)
    if (!expert || !expert.stripeConnectAccountId) {
      return NextResponse.json({ error: 'Expert not found or not set up for payments' }, { status: 400 })
    }

    // Calculate platform fee (15%)
    const platformFeeAmount = Math.round(amount * 0.15)

    // Create payment intent on the connected account with platform fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: product.currency || 'usd',
      payment_method_types: ['card'],
      metadata: {
        product_id: productId,
        buyer_id: userId,
        expert_id: product.expertId,
        product_type: product.type,
        product_title: product.title
      },
      // Platform fee
      application_fee_amount: platformFeeAmount,
    }, {
      // Create the payment intent on the connected account
      stripeAccount: expert.stripeConnectAccountId,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      stripeAccount: expert.stripeConnectAccountId
    })

  } catch (error) {
    console.error('Checkout intent error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}