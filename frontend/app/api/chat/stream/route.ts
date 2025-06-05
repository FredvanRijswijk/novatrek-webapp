import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'

// This endpoint is for direct streaming (used by TripChat)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, tripContext, userPreferences } = body
    
    // Ensure messages have the correct format for the AI SDK
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content || msg.parts?.[0]?.text || ''
    }))

    let systemPrompt = `You are NovaTrek's AI travel assistant, an expert travel planner with deep knowledge of destinations worldwide. Your role is to help users plan amazing trips by providing personalized recommendations.

Key responsibilities:
- Provide detailed travel advice and recommendations
- Help with itinerary planning and optimization
- Suggest activities, restaurants, and attractions
- Offer practical travel tips (weather, transportation, budgeting)
- Consider user preferences and trip context
- Be enthusiastic but practical in your suggestions

Guidelines:
- Always ask clarifying questions to better understand user needs
- Provide specific, actionable recommendations
- Include estimated costs, timings, and logistics when relevant
- Consider seasonal factors and local events
- Suggest alternatives for different budgets and interests
- Be aware of travel restrictions and safety considerations

Keep responses helpful, engaging, and well-structured with clear recommendations.`

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

    // For now, stream endpoint uses default model
    // In future, we can add provider selection here too
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: formattedMessages,
      maxTokens: 1000,
      temperature: 0.7,
    })

    // Return plain text stream for TripChat
    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat stream API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate response' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}