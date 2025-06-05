import { genkit } from '@genkit-ai/core'
import { firebase } from '@genkit-ai/firebase'
import { vertexAI, gemini20Flash, gemini20FlashLite } from '@genkit-ai/vertexai'

// Initialize Genkit with Firebase and Vertex AI plugins
export const ai = genkit({
  plugins: [
    firebase(),
    vertexAI({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      location: 'europe-west3',
    }),
  ],
  // Enable observability for monitoring
  enableTracingAndMetrics: true,
})

// Define flows for different AI tasks
export const travelChatFlow = ai.defineFlow(
  {
    name: 'travelChat',
    inputSchema: ai.z.object({
      messages: ai.z.array(
        ai.z.object({
          role: ai.z.enum(['user', 'assistant', 'system']),
          content: ai.z.string(),
        })
      ),
      tripContext: ai.z
        .object({
          destination: ai.z.object({
            city: ai.z.string(),
            country: ai.z.string(),
          }).optional(),
          duration: ai.z.number().optional(),
          startDate: ai.z.string().optional(),
          budget: ai.z.string().optional(),
          travelers: ai.z.number().optional(),
          preferences: ai.z.array(ai.z.string()).optional(),
        })
        .optional(),
    }),
    outputSchema: ai.z.string(),
  },
  async (input) => {
    const { messages, tripContext } = input

    // Build context-aware prompt
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

    // Generate response using Gemini
    const response = await ai.generate({
      model: gemini20Flash,
      system: systemPrompt,
      messages,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    })

    return response.text()
  }
)

// Group travel compromise flow
export const groupCompromiseFlow = ai.defineFlow(
  {
    name: 'groupCompromise',
    inputSchema: ai.z.object({
      groupPreferences: ai.z.array(
        ai.z.object({
          memberId: ai.z.string(), // Anonymous ID
          budget: ai.z.object({
            min: ai.z.number(),
            max: ai.z.number(),
          }),
          mustHaves: ai.z.array(ai.z.string()),
          dealBreakers: ai.z.array(ai.z.string()),
          travelStyle: ai.z.string(),
        })
      ),
      destination: ai.z.string(),
      duration: ai.z.number(),
    }),
    outputSchema: ai.z.object({
      recommendations: ai.z.array(
        ai.z.object({
          option: ai.z.string(),
          description: ai.z.string(),
          fairnessScore: ai.z.number(),
          explanation: ai.z.string(),
          compromises: ai.z.array(ai.z.string()),
        })
      ),
      budgetAnalysis: ai.z.object({
        safeRange: ai.z.object({
          min: ai.z.number(),
          max: ai.z.number(),
        }),
        explanation: ai.z.string(),
      }),
    }),
  },
  async (input) => {
    const { groupPreferences, destination, duration } = input

    // Use Gemini Pro for complex group analysis
    const response = await ai.generate({
      model: gemini20Flash,
      system: SYSTEM_PROMPTS.groupTravelMediator,
      prompt: `Analyze these anonymous group preferences and suggest fair compromises:

Destination: ${destination}
Duration: ${duration} days

Group Members (anonymous):
${groupPreferences
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
4. Clear explanations of compromises needed

Format as JSON matching the output schema.`,
      config: {
        temperature: 0.5, // Lower temperature for more consistent analysis
        maxOutputTokens: 2000,
      },
    })

    // Parse and return structured response
    return JSON.parse(response.text())
  }
)

// Itinerary optimization flow
export const optimizeItineraryFlow = ai.defineFlow(
  {
    name: 'optimizeItinerary',
    inputSchema: ai.z.object({
      activities: ai.z.array(
        ai.z.object({
          name: ai.z.string(),
          location: ai.z.string(),
          duration: ai.z.number(), // in hours
          category: ai.z.string(),
          mustDo: ai.z.boolean().optional(),
        })
      ),
      constraints: ai.z.object({
        startTime: ai.z.string(), // e.g., "09:00"
        endTime: ai.z.string(), // e.g., "21:00"
        pace: ai.z.enum(['relaxed', 'moderate', 'packed']),
        includeMeals: ai.z.boolean(),
      }),
      destination: ai.z.string(),
    }),
    outputSchema: ai.z.object({
      days: ai.z.array(
        ai.z.object({
          date: ai.z.string(),
          schedule: ai.z.array(
            ai.z.object({
              time: ai.z.string(),
              activity: ai.z.string(),
              duration: ai.z.string(),
              notes: ai.z.string().optional(),
              travelTime: ai.z.string().optional(),
            })
          ),
          totalDistance: ai.z.string(),
          warnings: ai.z.array(ai.z.string()).optional(),
        })
      ),
      unusedActivities: ai.z.array(ai.z.string()).optional(),
      suggestions: ai.z.array(ai.z.string()),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      model: gemini20Flash,
      system: SYSTEM_PROMPTS.itineraryOptimizer,
      prompt: `Optimize this itinerary for ${input.destination}:

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
5. Ensures all must-do activities are included

Format as JSON matching the output schema.`,
      config: {
        temperature: 0.3, // Low temperature for logical planning
        maxOutputTokens: 2000,
      },
    })

    return JSON.parse(response.text())
  }
)

// Import system prompts
import { SYSTEM_PROMPTS } from './vertex-config'