import { NextRequest, NextResponse } from 'next/server'
import { optimizeItineraryFlow } from '@/lib/ai/genkit-setup'
import { optimizeItinerary } from '@/lib/ai/vertex-firebase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { activities, constraints, destination, useFirebaseSDK = false } = await req.json()

    // Validate input
    if (!activities || !constraints || !destination) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let result;
    
    // Use Firebase SDK if requested
    if (useFirebaseSDK) {
      try {
        result = await optimizeItinerary({
          activities,
          constraints,
          destination,
        })
      } catch (firebaseError) {
        console.error('Firebase SDK error, falling back to Genkit:', firebaseError)
        // Fallback to Genkit if Firebase SDK fails
        result = await optimizeItineraryFlow({
          activities,
          constraints,
          destination,
        })
      }
    } else {
      // Use existing Genkit implementation
      result = await optimizeItineraryFlow({
        activities,
        constraints,
        destination,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Itinerary optimization error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to optimize itinerary', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}