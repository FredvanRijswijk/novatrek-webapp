import { NextRequest, NextResponse } from 'next/server'
import { groupCompromiseFlow } from '@/lib/ai/genkit-setup'
import { generateGroupCompromise } from '@/lib/ai/vertex-firebase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { groupPreferences, destination, duration, useFirebaseSDK = false } = await req.json()

    // Validate input
    if (!groupPreferences || !destination || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let result;
    
    // Use Firebase SDK if requested
    if (useFirebaseSDK) {
      try {
        result = await generateGroupCompromise({
          groupPreferences,
          destination,
          duration,
        })
      } catch (firebaseError) {
        console.error('Firebase SDK error, falling back to Genkit:', firebaseError)
        // Fallback to Genkit if Firebase SDK fails
        result = await groupCompromiseFlow({
          groupPreferences,
          destination,
          duration,
        })
      }
    } else {
      // Use existing Genkit implementation
      result = await groupCompromiseFlow({
        groupPreferences,
        destination,
        duration,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Group compromise error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate compromises', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}