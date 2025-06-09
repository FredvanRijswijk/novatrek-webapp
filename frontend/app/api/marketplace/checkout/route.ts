import { NextRequest, NextResponse } from 'next/server'
import { auth, getAdminDb } from '@/lib/firebase/admin'
import { stripe } from '@/lib/stripe/config'
import { MarketplaceModelEnhanced as MarketplaceModel } from '@/lib/models/marketplace-enhanced'
import { FieldValue } from 'firebase-admin/firestore'

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
    const userEmail = decodedToken.email

    const { productId, expertId, customerDetails } = await request.json()

    if (!productId || !expertId || !customerDetails) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify product and expert
    const [product, expert] = await Promise.all([
      MarketplaceModel.getProduct(productId),
      MarketplaceModel.getExpert(expertId)
    ])

    if (!product || product.status !== 'active') {
      return NextResponse.json({ error: 'Product not found or not available' }, { status: 404 })
    }

    if (!expert || !expert.stripeConnectAccountId) {
      return NextResponse.json({ error: 'Expert not found or not set up for payments' }, { status: 400 })
    }

    // Calculate fees
    const platformFeeAmount = Math.round(product.price * 0.15)
    const expertEarnings = product.price - platformFeeAmount

    // Create payment intent on the connected account with platform fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount: product.price,
      currency: product.currency || 'usd',
      payment_method_types: ['card'],
      metadata: {
        product_id: productId,
        buyer_id: userId,
        expert_id: expertId,
        product_type: product.type,
        product_title: product.title,
        customer_name: customerDetails.name,
        customer_email: customerDetails.email || userEmail,
        customer_phone: customerDetails.phone || '',
        customer_message: customerDetails.message || ''
      },
      receipt_email: customerDetails.email || userEmail,
      // Platform fee
      application_fee_amount: platformFeeAmount,
    }, {
      // Create the payment intent on the connected account
      stripeAccount: expert.stripeConnectAccountId,
    })

    // Create transaction record using Admin SDK
    const adminDb = getAdminDb()
    if (!adminDb) {
      console.error('Failed to get admin DB')
      // Continue anyway - payment can still process
    } else {
      const transactionData = {
        stripePaymentIntentId: paymentIntent.id,
        buyerId: userId,
        sellerId: expertId,
        productId: productId,
        productType: product.type,
        productTitle: product.title,
        amount: product.price,
        platformFee: platformFeeAmount,
        sellerEarnings: expertEarnings,
        currency: product.currency || 'usd',
        status: 'pending',
        customerDetails: {
          name: customerDetails.name,
          email: customerDetails.email || userEmail,
          phone: customerDetails.phone || null,
          message: customerDetails.message || null
        },
        metadata: {
          expertBusinessName: expert.businessName,
          productDescription: product.description
        },
        createdAt: FieldValue.serverTimestamp()
      }

      try {
        const transactionRef = adminDb.collection('marketplace_transactions').doc()
        await transactionRef.set({
          ...transactionData,
          id: transactionRef.id
        })

        // Update payment intent with transaction ID
        await stripe.paymentIntents.update(paymentIntent.id, {
          metadata: {
            ...paymentIntent.metadata,
            transaction_id: transactionRef.id
          }
        })
      } catch (dbError) {
        console.error('Failed to create transaction record:', dbError)
        // Continue - payment can still process
      }
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to process checkout' },
      { status: 500 }
    )
  }
}