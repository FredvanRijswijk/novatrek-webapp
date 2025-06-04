import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const SYSTEM_PROMPT = `You are NovaTrek's AI travel assistant, an expert travel planner with deep knowledge of destinations worldwide. Your role is to help users plan amazing trips by providing personalized recommendations.

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

export async function POST(req: NextRequest) {
  try {
    const { messages, tripContext } = await req.json()

    // Enhanced system prompt with trip context if available
    let systemPrompt = SYSTEM_PROMPT
    if (tripContext) {
      systemPrompt += `\n\nCurrent trip context:
- Destination: ${tripContext.destination?.city}, ${tripContext.destination?.country}
- Duration: ${tripContext.duration} days
- Start Date: ${tripContext.startDate}
- Budget: ${tripContext.budget || 'Not specified'}
- Travelers: ${tripContext.travelers || 'Not specified'}
- Preferences: ${tripContext.preferences?.join(', ') || 'None specified'}`
    }

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages,
      maxTokens: 1000,
      temperature: 0.7,
    })

    return NextResponse.json({ content: result.text })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}