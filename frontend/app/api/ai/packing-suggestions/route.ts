import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'
import { TripModelAdmin } from '@/lib/models/trip-admin'
import { findBestTemplate, packingTemplates } from '@/lib/data/packing-templates'
import { PackingCategory, PackingItem } from '@/types/travel'
import { generateObject } from 'ai'
import { getVertexModel } from '@/lib/ai/vertex-provider'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Get request body
    const { 
      tripId,
      tripType = 'leisure',
      useTemplate = true,
      weatherData,
      activities = [],
      preferences = {}
    } = await request.json()

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })
    }

    // Get trip details
    const trip = await TripModelAdmin.getById(tripId)
    if (!trip || trip.userId !== userId) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Calculate trip duration
    const duration = Math.ceil(
      (trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Determine climate based on weather data or destination
    let climate: 'tropical' | 'temperate' | 'cold' | 'desert' | 'mixed' = 'temperate'
    if (weatherData?.averageTemp) {
      const avgTemp = (weatherData.averageTemp.high + weatherData.averageTemp.low) / 2
      if (avgTemp > 25) climate = 'tropical'
      else if (avgTemp < 10) climate = 'cold'
      else climate = 'temperate'
    }

    // Start with a template if requested
    let baseCategories: PackingCategory[] = []
    if (useTemplate) {
      const template = findBestTemplate(tripType, climate, duration)
      if (template) {
        baseCategories = template.categories.map(cat => ({
          ...cat,
          items: cat.items.map(item => ({ ...item })) // Deep copy items
        }))
      }
    }

    // Prepare context for AI
    const context = {
      trip: {
        destinations: trip.destinations || [trip.destination],
        startDate: trip.startDate,
        endDate: trip.endDate,
        duration,
        travelers: trip.travelers.length,
        budget: trip.budget
      },
      weather: weatherData || {
        averageTemp: { high: 20, low: 15 },
        rainExpected: false,
        snowExpected: climate === 'cold'
      },
      activities: activities.length > 0 ? activities : (trip.itinerary
        .flatMap((day: any) => day.activities)
        .map((activity: any) => ({
          type: activity.type,
          name: activity.name
        }))
      ),
      preferences,
      existingItems: baseCategories.flatMap(cat => 
        cat.items.map(item => item.name)
      )
    }

    // Generate AI suggestions
    let suggestions
    
    // Try different AI providers
    const aiProviders = [
      // Skip Firebase AI SDK on server-side - it requires browser context
      // {
      //   name: 'Firebase AI SDK',
      //   func: async () => {
      //     const { generatePackingSuggestions } = await import('@/lib/ai/vertex-firebase')
      //     return await generatePackingSuggestions(context)
      //   }
      // },
      {
        name: 'Vertex AI Direct',
        func: async () => {
          // Use direct Vertex AI provider as fallback
          const model = getVertexModel('chat')
          
          const schema = z.object({
            items: z.array(z.object({
              name: z.string(),
              category: z.string(),
              quantity: z.number(),
              reason: z.string().optional(),
              weatherDependent: z.boolean().optional(),
              activityDependent: z.array(z.string()).optional()
            })),
            reminders: z.array(z.string()),
            weatherTips: z.array(z.string())
          })
          
          const destinations = context.trip.destinations
            .map((d: any) => `${d.city || d.name}, ${d.country}`)
            .join(' -> ')
          
          const activityTypes = [...new Set(context.activities.map((a: any) => a.type))].join(', ')
          const activityNames = context.activities.map((a: any) => a.name).join(', ')
          
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

Please suggest ADDITIONAL items that would be helpful for this specific trip. Focus on:
- Items specific to the destination or activities
- Weather-dependent items they might forget
- Activity-specific gear
- Local customs or requirements
- Practical items for the specific climate

Group suggestions by category (Clothes, Electronics, Health & Safety, Accessories, Activity Gear, etc.)`
          
          const result = await generateObject({
            model,
            schema,
            prompt
          })
          
          return result.object
        }
      }
    ]
    
    // Try each provider until one works
    for (const provider of aiProviders) {
      try {
        console.log(`Trying AI provider: ${provider.name}`)
        suggestions = await provider.func()
        console.log(`${provider.name} succeeded`)
        break
      } catch (error) {
        console.error(`${provider.name} failed:`, error)
        continue
      }
    }
    
    // If all AI providers fail, use fallback suggestions
    if (!suggestions) {
      console.log('All AI providers failed, using fallback suggestions')
      
      // Provide basic suggestions based on trip type and weather
      const weatherItems = []
      if (context.weather.rainExpected) {
        weatherItems.push(
          { name: "Rain jacket", category: "Clothes", quantity: 1, reason: "Rain expected", weatherDependent: true },
          { name: "Waterproof bag cover", category: "Accessories", quantity: 1, reason: "Protect belongings from rain", weatherDependent: true }
        )
      }
      if (context.weather.snowExpected) {
        weatherItems.push(
          { name: "Warm gloves", category: "Clothes", quantity: 1, reason: "Cold weather protection", weatherDependent: true },
          { name: "Thermal underwear", category: "Clothes", quantity: 2, reason: "Extra warmth in cold weather", weatherDependent: true }
        )
      }
      if (context.weather.averageTemp.high > 25) {
        weatherItems.push(
          { name: "Sunscreen", category: "Toiletries", quantity: 1, reason: "Sun protection", weatherDependent: true },
          { name: "Sunglasses", category: "Accessories", quantity: 1, reason: "Eye protection", weatherDependent: true }
        )
      }
      
      suggestions = {
        items: weatherItems,
        reminders: [
          "Check weather forecast before departure",
          "Confirm all travel documents are valid",
          "Leave a copy of your itinerary with someone at home"
        ],
        weatherTips: [
          context.weather.rainExpected ? "Pack rain gear in easily accessible place" : null,
          context.weather.averageTemp.high > 25 ? "Stay hydrated and protect yourself from sun" : null,
          context.weather.averageTemp.low < 10 ? "Layer clothing for temperature changes" : null
        ].filter(Boolean)
      }
    }

    // Merge AI suggestions with base template
    const mergedCategories = mergeAISuggestions(baseCategories, suggestions)

    // Create the final packing list
    const packingList = {
      tripId,
      userId,
      name: `Packing list for ${trip.title}`,
      categories: mergedCategories,
      templateId: useTemplate ? `${tripType}-${climate}-${duration <= 3 ? 'weekend' : duration <= 7 ? 'week' : 'extended'}` : undefined,
      weatherConsiderations: weatherData,
      tripType,
      lastUpdated: new Date(),
      createdAt: new Date()
    }

    return NextResponse.json({ packingList })
  } catch (error) {
    console.error('Error generating packing suggestions:', error)
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = {
      error: 'Failed to generate packing suggestions',
      details: errorMessage,
      hint: errorMessage.includes('API key') ? 'Check Vertex AI configuration' : 
            errorMessage.includes('permission') ? 'Check Firebase/Google Cloud permissions' :
            'Check server logs for more details'
    }
    
    return NextResponse.json(errorDetails, { status: 500 })
  }
}

// Helper function to merge AI suggestions with existing categories
function mergeAISuggestions(
  categories: PackingCategory[],
  suggestions: any
): PackingCategory[] {
  if (!suggestions?.items) return categories

  // Map AI suggestions to existing categories
  const categoryMap = new Map(categories.map(cat => [cat.name.toLowerCase(), cat]))

  suggestions.items.forEach((suggestion: any) => {
    const categoryName = suggestion.category || 'Miscellaneous'
    const normalizedCategoryName = categoryName.toLowerCase()
    
    let category = categoryMap.get(normalizedCategoryName)
    
    if (!category) {
      // Create new category if it doesn't exist
      category = {
        id: categoryName.toLowerCase().replace(/\s+/g, '-'),
        name: categoryName,
        order: categories.length + 1,
        items: []
      }
      categories.push(category)
      categoryMap.set(normalizedCategoryName, category)
    }

    // Check if item already exists (avoid duplicates)
    const existingItem = category.items.find(
      item => item.name.toLowerCase() === suggestion.name.toLowerCase()
    )

    if (!existingItem) {
      // Add new item
      const newItem: PackingItem = {
        id: Math.random().toString(36).substring(2, 9),
        name: suggestion.name,
        quantity: suggestion.quantity || 1,
        checked: false,
        categoryId: category.id,
        notes: suggestion.reason,
        aiSuggested: true,
        weatherDependent: suggestion.weatherDependent || false,
        activityDependent: suggestion.activityDependent || []
      }
      category.items.push(newItem)
    } else if (suggestion.quantity && suggestion.quantity > existingItem.quantity!) {
      // Update quantity if AI suggests more
      existingItem.quantity = suggestion.quantity
      existingItem.aiSuggested = true
      if (suggestion.reason) {
        existingItem.notes = suggestion.reason
      }
    }
  })

  // Sort categories by order
  categories.sort((a, b) => a.order - b.order)

  return categories
}