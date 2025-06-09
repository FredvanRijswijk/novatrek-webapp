import { NextRequest, NextResponse } from 'next/server'
import { auth, getAdminDb } from '@/lib/firebase/admin'
import { createConnectAccount, createAccountLink } from '@/lib/stripe/connect'
import { createConnectAccountV2, createAccountLinkV2 } from '@/lib/stripe/connect-v2'
import { MarketplaceModelEnhanced as MarketplaceModel } from '@/lib/models/marketplace-enhanced'
import { shouldUseStripeV2 } from '@/lib/feature-flags'

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

    // Check if user already has an expert profile using Admin SDK
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ error: 'Database initialization failed' }, { status: 500 })
    }
    const expertsRef = adminDb.collection('marketplace_experts')
    const existingExpertQuery = await expertsRef.where('userId', '==', userId).limit(1).get()
    
    if (!existingExpertQuery.empty) {
      const existingExpert = existingExpertQuery.docs[0].data()
      if (existingExpert.stripeConnectAccountId) {
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
    }

    // Check for approved application using Admin SDK
    const applicationsRef = adminDb.collection('marketplace_applications')
    const applicationQuery = await applicationsRef.where('userId', '==', userId).limit(1).get()
    
    if (applicationQuery.empty) {
      return NextResponse.json({ 
        error: 'No application found. Please apply to become a travel expert first.' 
      }, { status: 403 })
    }
    
    const application = applicationQuery.docs[0].data()
    if (!application || application.status !== 'approved') {
      return NextResponse.json({ 
        error: 'Application not approved. Please apply to become a travel expert first.' 
      }, { status: 403 })
    }

    // Check if we should use v2 for this new account
    const useV2 = shouldUseStripeV2(userId, true)
    
    // Create new Connect account (v1 or v2 based on feature flag)
    const account = useV2 
      ? await createConnectAccountV2(email, application.businessName)
      : await createConnectAccount(email, application.businessName)

    // Create expert profile using Admin SDK
    const expertData = {
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
      contactEmail: email,
      stripeAccountId: account.id, // Add this field too
      stripeAccountVersion: useV2 ? 'v2' : 'v1', // Track which version
      stripeAccountStatus: {
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Use Admin SDK to create expert profile
    const expertRef = adminDb.collection('marketplace_experts').doc()
    await expertRef.set({
      ...expertData,
      id: expertRef.id
    })

    // Generate account link for onboarding (v1 or v2)
    const accountLink = useV2
      ? await createAccountLinkV2(
          account.id,
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/expert/onboarding`,
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/expert/onboarding/complete`
        )
      : await createAccountLink(
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

    // Get expert profile using Admin SDK
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ error: 'Database initialization failed' }, { status: 500 })
    }
    const expertsRef = adminDb.collection('marketplace_experts')
    const expertQuery = await expertsRef.where('userId', '==', userId).limit(1).get()
    
    if (expertQuery.empty) {
      return NextResponse.json({ error: 'Expert profile not found' }, { status: 404 })
    }
    
    const expertDoc = expertQuery.docs[0]
    const expert = expertDoc.data()
    
    if (expert.stripeConnectAccountId !== accountId) {
      return NextResponse.json({ error: 'Invalid account' }, { status: 403 })
    }

    // Check if onboarding is complete (handle both v1 and v2)
    const isV2 = expert.stripeAccountVersion === 'v2'
    let isComplete = false
    let onboardingDetails: any = {}

    if (isV2) {
      const { isAccountOnboardedV2 } = await import('@/lib/stripe/connect-v2')
      const v2Status = await isAccountOnboardedV2(accountId)
      isComplete = v2Status.isComplete
      onboardingDetails = {
        canAcceptPayments: v2Status.canAcceptPayments,
        canReceivePayouts: v2Status.canReceivePayouts,
        requirementsNeeded: v2Status.requirementsNeeded
      }
    } else {
      const { isAccountOnboarded } = await import('@/lib/stripe/connect')
      isComplete = await isAccountOnboarded(accountId)
    }

    if (isComplete) {
      // Update expert profile using Admin SDK
      await expertDoc.ref.update({
        onboardingComplete: true,
        status: 'active',
        updatedAt: new Date()
      })
    }

    return NextResponse.json({
      complete: isComplete,
      accountId,
      version: isV2 ? 'v2' : 'v1',
      ...(isV2 && { details: onboardingDetails })
    })

  } catch (error) {
    console.error('Onboarding status error:', error)
    return NextResponse.json(
      { error: 'Failed to check onboarding status' },
      { status: 500 }
    )
  }
}