import { NextRequest, NextResponse } from 'next/server'
import { optimizeItineraryFlow } from '@/lib/ai/genkit-setup'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { activities, constraints, destination } = await req.json()

    // Validate input
    if (!activities || !constraints || !destination) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Run the itinerary optimization
    const result = await optimizeItineraryFlow({
      activities,
      constraints,
      destination,
    })

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