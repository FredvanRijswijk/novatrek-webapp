import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'
import { TripModel } from '@/lib/models/trip'
import { generatePackingSuggestions } from '@/lib/ai/vertex-firebase'
import { findBestTemplate, packingTemplates } from '@/lib/data/packing-templates'
import { PackingCategory, PackingItem } from '@/types/travel'

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
    const trip = await TripModel.getById(tripId)
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
        .flatMap(day => day.activities)
        .map(activity => ({
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
    const suggestions = await generatePackingSuggestions(context)

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
    return NextResponse.json(
      { error: 'Failed to generate packing suggestions' },
      { status: 500 }
    )
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