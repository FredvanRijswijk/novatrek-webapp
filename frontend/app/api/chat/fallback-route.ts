import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { SYSTEM_PROMPTS } from '@/lib/ai/vertex-config'

// Fallback chat route using OpenAI when Vertex AI is not configured
export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { messages, tripContext } = await req.json()

    // Enhanced system prompt with trip context if available
    let systemPrompt = SYSTEM_PROMPTS.travelAssistant
    if (tripContext) {
      systemPrompt += `\n\nCurrent trip context:
- Destination: ${tripContext.destination?.city}, ${tripContext.destination?.country}
- Duration: ${tripContext.duration} days
- Start Date: ${tripContext.startDate}
- Budget: ${tripContext.budget || 'Not specified'}
- Travelers: ${tripContext.travelers || 'Not specified'}
- Preferences: ${tripContext.preferences?.join(', ') || 'None specified'}`
    }

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages,
      maxTokens: 1000,
      temperature: 0.7,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}