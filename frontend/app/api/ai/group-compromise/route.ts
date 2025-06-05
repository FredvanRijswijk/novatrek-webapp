import { NextRequest, NextResponse } from 'next/server'
import { groupCompromiseFlow } from '@/lib/ai/genkit-setup'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { groupPreferences, destination, duration } = await req.json()

    // Validate input
    if (!groupPreferences || !destination || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Run the compromise analysis
    const result = await groupCompromiseFlow({
      groupPreferences,
      destination,
      duration,
    })

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