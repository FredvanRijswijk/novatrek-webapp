import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'
import { createEnhancedContext } from '@/lib/ai/trip-context-analyzer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, tripContext, userPreferences, fullTrip, providerId = 'openai-gpt4o-mini' } = body
    
    // Create enhanced context if full trip data is provided
    const enhancedContext = fullTrip ? createEnhancedContext(fullTrip, userPreferences) : null
    
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

    // Add enhanced context if available
    if (enhancedContext) {
      systemPrompt += `\n\nTrip Planning Context:
- Planning Stage: ${enhancedContext.planningStage} (${enhancedContext.completionPercentage}% complete)
- Progress: ${enhancedContext.daysWithActivities} of ${enhancedContext.duration} days planned
- Activities: ${enhancedContext.activities.total} activities added
- Empty Days: ${enhancedContext.emptyDays.length > 0 ? `Days ${enhancedContext.emptyDays.join(', ')} need activities` : 'All days have activities'}

Budget Status:
${enhancedContext.budget ? `- Total Budget: ${enhancedContext.budget.currency} ${enhancedContext.budget.total}
- Spent: ${enhancedContext.budget.currency} ${enhancedContext.budget.spent} (${Math.round((enhancedContext.budget.spent / enhancedContext.budget.total) * 100)}%)
- Remaining: ${enhancedContext.budget.currency} ${enhancedContext.budget.remaining}` : '- No budget set yet'}

Current Focus Areas:
${enhancedContext.suggestions.immediate.map(s => `- ${s}`).join('\n')}

When responding, consider the user's planning stage and provide contextually relevant advice. For example:
- If in 'initial' stage, focus on must-see attractions and setting up the trip framework
- If in 'partial' stage, help fill in specific days and suggest complementary activities
- If in 'detailed' or 'complete' stage, focus on optimization, reservations, and practical tips`
    }

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

    // Select the model based on provider ID
    let model;
    switch (providerId) {
      case 'openai-gpt4o':
        model = openai('gpt-4o')
        break
      case 'openai-gpt4o-mini':
      default:
        model = openai('gpt-4o-mini')
        break
      // Future providers can be added here
      // case 'vertex-gemini-flash':
      //   model = vertex('gemini-2.0-flash-exp')
      //   break
    }

    const result = await streamText({
      model,
      system: systemPrompt,
      messages: formattedMessages,
      maxTokens: 1000,
      temperature: 0.7,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate response' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}