import { NextRequest, NextResponse } from 'next/server'
import { auth, getAdminDb } from '@/lib/firebase/admin'
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

    // Create new Connect account
    const account = await createConnectAccount(email, application.businessName)

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

    // Check if onboarding is complete
    const { isAccountOnboarded } = await import('@/lib/stripe/connect')
    const isComplete = await isAccountOnboarded(accountId)

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