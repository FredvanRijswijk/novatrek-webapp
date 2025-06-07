import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'
import { createConnectAccount, createAccountLink } from '@/lib/stripe/connect'
import { MarketplaceModel } from '@/lib/models/marketplace'

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
    const email = decodedToken.email

    if (!email) {
      return NextResponse.json({ error: 'Email required for seller account' }, { status: 400 })
    }

    // Check if user already has an expert profile
    const existingExpert = await MarketplaceModel.getExpertByUserId(userId)
    if (existingExpert && existingExpert.stripeConnectAccountId) {
      // Generate new account link for existing account
      const accountLink = await createAccountLink(
        existingExpert.stripeConnectAccountId,
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/expert/onboarding`,
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/expert`
      )

      return NextResponse.json({
        url: accountLink.url,
        accountId: existingExpert.stripeConnectAccountId,
        isExisting: true
      })
    }

    // Check for approved application
    const application = await MarketplaceModel.getApplicationByUserId(userId)
    if (!application || application.status !== 'approved') {
      return NextResponse.json({ 
        error: 'Application not approved. Please apply to become a travel expert first.' 
      }, { status: 403 })
    }

    // Create new Connect account
    const account = await createConnectAccount(email, application.businessName)

    // Create expert profile
    await MarketplaceModel.createExpert({
      userId,
      stripeConnectAccountId: account.id,
      businessName: application.businessName,
      bio: '', // To be filled during onboarding
      specializations: application.specializations,
      rating: 0,
      reviewCount: 0,
      status: 'pending', // Will be 'active' after onboarding
      onboardingComplete: false,
      payoutSchedule: 'weekly', // Default
      contactEmail: email
    })

    // Generate account link for onboarding
    const accountLink = await createAccountLink(
      account.id,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/expert/onboarding`,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/expert/onboarding/complete`
    )

    return NextResponse.json({
      url: accountLink.url,
      accountId: account.id,
      isExisting: false
    })

  } catch (error) {
    console.error('Connect onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to create seller account' },
      { status: 500 }
    )
  }
}

// Handle return from Stripe onboarding
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get('account_id')
    
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Get expert profile
    const expert = await MarketplaceModel.getExpertByUserId(userId)
    if (!expert || expert.stripeConnectAccountId !== accountId) {
      return NextResponse.json({ error: 'Invalid account' }, { status: 403 })
    }

    // Check if onboarding is complete
    const { isAccountOnboarded } = await import('@/lib/stripe/connect')
    const isComplete = await isAccountOnboarded(accountId)

    if (isComplete) {
      // Update expert profile
      await MarketplaceModel.updateExpert(expert.id, {
        onboardingComplete: true,
        status: 'active'
      })
    }

    return NextResponse.json({
      complete: isComplete,
      accountId
    })

  } catch (error) {
    console.error('Onboarding status error:', error)
    return NextResponse.json(
      { error: 'Failed to check onboarding status' },
      { status: 500 }
    )
  }
}