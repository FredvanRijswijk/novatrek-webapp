import { streamText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { SYSTEM_PROMPTS } from '@/lib/ai/vertex-config'

// Use Node.js runtime for Vertex AI authentication
export const runtime = 'nodejs'

// Check if Vertex AI is properly configured
const isVertexConfigured = () => {
  const project = process.env.GOOGLE_VERTEX_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  return !!project
}

export async function POST(req: NextRequest) {
  try {
    const { messages, tripContext, userPreferences, useCase = 'chat' } = await req.json()

    // Check if Vertex AI is configured
    if (!isVertexConfigured()) {
      // Fallback to OpenAI
      const { openai } = await import('@ai-sdk/openai')
      
      let systemPrompt = SYSTEM_PROMPTS.travelAssistant
      
      // Add user preferences to context
      if (userPreferences) {
        systemPrompt += `\n\nUser Travel Preferences:
- Travel Style: ${userPreferences.travelStyle?.join(', ') || 'Not specified'}
- Pace: ${userPreferences.pacePreference || 'moderate'}
- Interests: ${userPreferences.interests?.join(', ') || 'General'}
- Activity Types: ${userPreferences.activityTypes?.join(', ') || 'Various'}
- Dietary: ${userPreferences.dietaryRestrictions?.join(', ') || 'None'}
- Fitness Level: ${userPreferences.fitnessLevel || 'moderate'}`
      }
      
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
    }

    // Use Vertex AI
    const { getVertexModel } = await import('@/lib/ai/vertex-provider')
    
    // Select appropriate system prompt
    let systemPrompt = SYSTEM_PROMPTS.travelAssistant
    
    // Add user preferences to context
    if (userPreferences) {
      systemPrompt += `\n\nUser Travel Preferences:
- Travel Style: ${userPreferences.travelStyle?.join(', ') || 'Not specified'}
- Pace: ${userPreferences.pacePreference || 'moderate'}
- Interests: ${userPreferences.interests?.join(', ') || 'General'}
- Activity Types: ${userPreferences.activityTypes?.join(', ') || 'Various'}
- Dietary: ${userPreferences.dietaryRestrictions?.join(', ') || 'None'}
- Fitness Level: ${userPreferences.fitnessLevel || 'moderate'}`
    }
    
    // Add trip context if available
    if (tripContext) {
      systemPrompt += `\n\nCurrent trip context:
- Destination: ${tripContext.destination?.city}, ${tripContext.destination?.country}
- Duration: ${tripContext.duration} days
- Start Date: ${tripContext.startDate}
- Budget: ${tripContext.budget || 'Not specified'}
- Travelers: ${tripContext.travelers || 'Not specified'}
- Preferences: ${tripContext.preferences?.join(', ') || 'None specified'}`
    }

    // Stream response using Vertex AI
    const result = await streamText({
      model: getVertexModel(useCase),
      system: systemPrompt,
      messages,
      maxTokens: 1000,
      temperature: 0.7,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    
    // If Vertex AI fails, try OpenAI as fallback
    if (error instanceof Error && error.message.includes('Vertex')) {
      try {
        const { openai } = await import('@ai-sdk/openai')
        const { messages, tripContext } = await req.json()
        
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
      } catch (fallbackError) {
        console.error('Fallback to OpenAI also failed:', fallbackError)
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate response', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}