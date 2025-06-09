import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'
import { MarketplaceModelEnhanced as MarketplaceModel } from '@/lib/models/marketplace-enhanced'

export async function POST(request: NextRequest) {
  try {
    // This endpoint is handled directly by the client-side form
    // which uses Firebase Auth and Firestore security rules
    return NextResponse.json(
      { error: 'This endpoint is deprecated. Use client-side Firestore instead.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Application submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}