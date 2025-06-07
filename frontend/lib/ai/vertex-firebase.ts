import { getApp } from 'firebase/app'
import { getAI, getGenerativeModel, VertexAIBackend } from 'firebase/ai'
import { SYSTEM_PROMPTS } from './vertex-config'
import type { GenerativeModel } from 'firebase/ai'

// Get the Firebase app instance
const app = getApp()

// Initialize AI with Vertex AI backend
const ai = getAI(app, { backend: new VertexAIBackend() })

// Available models
export const models = {
  flash: 'gemini-2.0-flash',
  flashLite: 'gemini-2.0-flash-lite',
  pro: 'gemini-1.5-pro',
} as const

// Get a configured model instance
export function getModel(modelName: keyof typeof models = 'flash'): GenerativeModel {
  return getGenerativeModel(ai, { model: models[modelName] })
}

// Helper function for basic text generation
export async function generateText(
  prompt: string,
  modelName: keyof typeof models = 'flash'
): Promise<string> {
  const model = getModel(modelName)
  const result = await model.generateContent(prompt)
  return result.response.text()
}

// Helper function for streaming text generation
export async function* streamText(
  prompt: string,
  modelName: keyof typeof models = 'flash'
): AsyncGenerator<string> {
  const model = getModel(modelName)
  const result = await model.generateContentStream(prompt)
  
  for await (const chunk of result.stream) {
    yield chunk.text()
  }
}

// Chat conversation helper
export async function chatConversation(
  messages: Array<{ role: 'user' | 'model'; content: string }>,
  systemPrompt?: string,
  modelName: keyof typeof models = 'flash'
): Promise<string> {
  const model = getModel(modelName)
  
  // Build the conversation history
  const history = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }))
  
  // Add system prompt as the first message if provided
  if (systemPrompt && history.length > 0) {
    const userMessage = history[0]
    history[0] = {
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\n${userMessage.parts[0].text}` }]
    }
  }
  
  const chat = model.startChat({ history })
  const lastUserMessage = messages[messages.length - 1]
  
  if (lastUserMessage.role !== 'user') {
    throw new Error('Last message must be from user')
  }
  
  const result = await chat.sendMessage(lastUserMessage.content)
  return result.response.text()
}

// Structured output helper for group compromise
export async function generateGroupCompromise(input: {
  groupPreferences: Array<{
    memberId: string
    budget: { min: number; max: number }
    mustHaves: string[]
    dealBreakers: string[]
    travelStyle: string
  }>
  destination: string
  duration: number
}) {
  const model = getModel('flash')
  
  // Define the response schema
  const responseSchema = {
    type: 'object',
    properties: {
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            option: { type: 'string' },
            description: { type: 'string' },
            fairnessScore: { type: 'number' },
            explanation: { type: 'string' },
            compromises: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['option', 'description', 'fairnessScore', 'explanation', 'compromises']
        }
      },
      budgetAnalysis: {
        type: 'object',
        properties: {
          safeRange: {
            type: 'object',
            properties: {
              min: { type: 'number' },
              max: { type: 'number' }
            },
            required: ['min', 'max']
          },
          explanation: { type: 'string' }
        },
        required: ['safeRange', 'explanation']
      }
    },
    required: ['recommendations', 'budgetAnalysis']
  }
  
  const prompt = `${SYSTEM_PROMPTS.groupTravelMediator}

Analyze these anonymous group preferences and suggest fair compromises:

Destination: ${input.destination}
Duration: ${input.duration} days

Group Members (anonymous):
${input.groupPreferences
  .map(
    (pref, i) => `
Member ${i + 1}:
- Budget: $${pref.budget.min}-$${pref.budget.max}
- Must haves: ${pref.mustHaves.join(', ')}
- Deal breakers: ${pref.dealBreakers.join(', ')}
- Travel style: ${pref.travelStyle}
`
  )
  .join('\n')}

Please provide:
1. 3-5 accommodation options that work for everyone
2. A fair budget range explanation
3. Activity suggestions that balance all preferences
4. Clear explanations of compromises needed`

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.5,
      maxOutputTokens: 2000,
    }
  })
  
  return JSON.parse(result.response.text())
}

// Structured output helper for itinerary optimization
export async function optimizeItinerary(input: {
  activities: Array<{
    name: string
    location: string
    duration: number // in hours
    category: string
    mustDo?: boolean
  }>
  constraints: {
    startTime: string // e.g., "09:00"
    endTime: string // e.g., "21:00"
    pace: 'relaxed' | 'moderate' | 'packed'
    includeMeals: boolean
  }
  destination: string
}) {
  const model = getModel('flash')
  
  // Define the response schema
  const responseSchema = {
    type: 'object',
    properties: {
      days: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            schedule: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  time: { type: 'string' },
                  activity: { type: 'string' },
                  duration: { type: 'string' },
                  notes: { type: 'string' },
                  travelTime: { type: 'string' }
                },
                required: ['time', 'activity', 'duration']
              }
            },
            totalDistance: { type: 'string' },
            warnings: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['date', 'schedule', 'totalDistance']
        }
      },
      unusedActivities: {
        type: 'array',
        items: { type: 'string' }
      },
      suggestions: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    required: ['days', 'suggestions']
  }
  
  const prompt = `${SYSTEM_PROMPTS.itineraryOptimizer}

Optimize this itinerary for ${input.destination}:

Activities to include:
${input.activities
  .map(
    (a) =>
      `- ${a.name} at ${a.location} (${a.duration}h, ${a.category}${
        a.mustDo ? ', MUST DO' : ''
      })`
  )
  .join('\n')}

Constraints:
- Daily hours: ${input.constraints.startTime} - ${input.constraints.endTime}
- Pace: ${input.constraints.pace}
- Include meals: ${input.constraints.includeMeals}

Create an optimized schedule that:
1. Groups nearby activities
2. Minimizes travel time
3. Includes appropriate breaks
4. Respects the desired pace
5. Ensures all must-do activities are included`

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.3,
      maxOutputTokens: 2000,
    }
  })
  
  return JSON.parse(result.response.text())
}

// Travel chat helper with enhanced context
export async function travelChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  tripContext?: any,
  userPreferences?: any,
  enhancedContext?: any
): Promise<string> {
  let systemPrompt = SYSTEM_PROMPTS.travelAssistant
  
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
${enhancedContext.suggestions.immediate.map((s: string) => `- ${s}`).join('\n')}`
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
  
  // Convert messages to Firebase AI format
  const formattedMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    content: msg.content
  }))
  
  return chatConversation(formattedMessages, systemPrompt, 'flash')
}

// Structured output helper for packing suggestions
export async function generatePackingSuggestions(context: {
  trip: {
    destinations: any[]
    startDate: Date
    endDate: Date
    duration: number
    travelers: number
    budget?: any
  }
  weather: {
    averageTemp: { high: number; low: number }
    rainExpected: boolean
    snowExpected: boolean
  }
  activities: Array<{ type: string; name: string }>
  preferences?: any
  existingItems: string[]
}) {
  const model = getModel('flash')
  
  // Define the response schema for structured output
  const responseSchema = {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            category: { type: 'string' },
            quantity: { type: 'number' },
            reason: { type: 'string' },
            weatherDependent: { type: 'boolean' },
            activityDependent: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['name', 'category', 'quantity']
        }
      },
      reminders: {
        type: 'array',
        items: { type: 'string' }
      },
      weatherTips: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    required: ['items', 'reminders', 'weatherTips']
  }
  
  const destinations = context.trip.destinations
    .map(d => `${d.city || d.name}, ${d.country}`)
    .join(' -> ')
  
  const activityTypes = [...new Set(context.activities.map(a => a.type))].join(', ')
  const activityNames = context.activities.map(a => a.name).join(', ')
  
  const prompt = `You are a helpful travel packing assistant. Generate personalized packing suggestions based on the following trip details:

Trip Information:
- Destinations: ${destinations}
- Duration: ${context.trip.duration} days
- Dates: ${context.trip.startDate.toLocaleDateString()} to ${context.trip.endDate.toLocaleDateString()}
- Number of travelers: ${context.trip.travelers}

Weather Conditions:
- Average temperature: ${context.weather.averageTemp.low}°C to ${context.weather.averageTemp.high}°C
- Rain expected: ${context.weather.rainExpected}
- Snow expected: ${context.weather.snowExpected}

Planned Activities:
- Types: ${activityTypes || 'General sightseeing'}
- Specific: ${activityNames || 'Not specified'}

Already Packed Items:
${context.existingItems.join(', ')}

Please suggest ADDITIONAL items that would be helpful for this specific trip. For each item:
1. Consider the weather conditions
2. Think about the planned activities
3. Account for the trip duration
4. Don't suggest items already in the list

Focus on items that are:
- Specific to the destination or activities
- Weather-dependent items they might forget
- Activity-specific gear
- Local customs or requirements (e.g., modest clothing for temples)
- Practical items for the specific climate

Group suggestions by category (Clothes, Electronics, Health & Safety, Accessories, Activity Gear, etc.)`

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.7,
      maxOutputTokens: 1500,
    }
  })
  
  return JSON.parse(result.response.text())
}

// Export AI instance for advanced usage
export { ai }