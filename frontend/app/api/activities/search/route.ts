import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyIdToken } from '@/lib/firebase/admin'
import { Activity } from '@/types/travel'

// Activity type mapping to Google Places types
const activityTypeToPlaceTypes: Record<string, string[]> = {
  sightseeing: ['tourist_attraction', 'point_of_interest', 'establishment'],
  dining: ['restaurant', 'cafe', 'bakery', 'bar'],
  activity: ['amusement_park', 'aquarium', 'bowling_alley', 'gym', 'stadium'],
  shopping: ['shopping_mall', 'store', 'clothing_store', 'jewelry_store'],
  entertainment: ['movie_theater', 'night_club', 'casino', 'theater'],
  cultural: ['museum', 'art_gallery', 'library', 'church', 'hindu_temple', 'mosque', 'synagogue'],
  outdoor: ['park', 'hiking_trail', 'beach', 'campground', 'zoo'],
  wellness: ['spa', 'beauty_salon', 'hair_care']
}

// Estimated duration by activity type (in minutes)
const estimatedDurations: Record<string, number> = {
  sightseeing: 120,
  dining: 90,
  activity: 180,
  shopping: 120,
  entertainment: 150,
  cultural: 120,
  outdoor: 240,
  wellness: 120
}

// Price level to estimated cost mapping
const priceLevelToCost: Record<number, { min: number; max: number }> = {
  0: { min: 0, max: 0 },        // Free
  1: { min: 5, max: 15 },       // Inexpensive
  2: { min: 15, max: 40 },      // Moderate
  3: { min: 40, max: 80 },      // Expensive
  4: { min: 80, max: 200 }      // Very Expensive
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication - try both header and cookie
    const authHeader = request.headers.get('authorization')
    const cookieStore = await cookies()
    const cookieToken = cookieStore.get('firebaseIdToken')
    
    const token = authHeader?.replace('Bearer ', '') || cookieToken?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      await verifyIdToken(token)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { 
      location, 
      activityType, 
      searchQuery, 
      budget,
      date,
      timeOfDay 
    } = await request.json()

    if (!location || !location.lat || !location.lng) {
      return NextResponse.json(
        { error: 'Location coordinates required' },
        { status: 400 }
      )
    }

    // Build search query
    let query = searchQuery || ''
    if (activityType && !searchQuery) {
      // Add activity type to query if no specific search
      query = activityType === 'dining' ? 'restaurant' : activityType
    }

    // Add time-based modifiers
    if (timeOfDay === 'morning' && activityType === 'dining') {
      query = 'breakfast ' + query
    } else if (timeOfDay === 'evening' && activityType === 'dining') {
      query = 'dinner ' + query
    }

    // Get place types for the activity
    const types = activityTypeToPlaceTypes[activityType] || []
    const typeString = types.length > 0 ? types[0] : undefined

    // Use Google Places Text Search API
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      throw new Error('Google Maps API key not configured')
    }

    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    searchUrl.searchParams.set('query', query)
    searchUrl.searchParams.set('location', `${location.lat},${location.lng}`)
    searchUrl.searchParams.set('radius', '5000')
    if (typeString) {
      searchUrl.searchParams.set('type', typeString)
    }
    searchUrl.searchParams.set('key', apiKey)

    const searchResponse = await fetch(searchUrl.toString())
    const searchData = await searchResponse.json()

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', searchData.status)
      throw new Error('Failed to search places')
    }

    const results = searchData.results || []

    // Get place types for filtering
    const targetTypes = activityTypeToPlaceTypes[activityType] || []

    // Transform and enhance results
    const activities: Activity[] = results
      .filter((place: any) => {
        // Filter by activity type if specified
        if (targetTypes.length > 0 && place.types) {
          return place.types.some((type: string) => targetTypes.includes(type))
        }
        return true
      })
      .map((place: any) => {
        // Estimate costs based on price level
        const priceLevel = place.price_level || 2
        const costEstimate = priceLevelToCost[priceLevel]
        
        // Calculate cost based on activity type
        let estimatedCost = (costEstimate.min + costEstimate.max) / 2
        if (activityType === 'dining') {
          estimatedCost = estimatedCost * 1.5 // Adjust for meals
        }

        // Generate activity times based on time of day
        let startTime = '10:00'
        if (timeOfDay === 'morning') startTime = '09:00'
        else if (timeOfDay === 'afternoon') startTime = '14:00'
        else if (timeOfDay === 'evening') startTime = '18:00'

        const duration = estimatedDurations[activityType] || 120

        return {
          id: place.place_id,
          name: place.name,
          description: place.editorial_summary?.overview || 
                      `Visit ${place.name} - ${place.types?.[0]?.replace(/_/g, ' ') || 'Popular destination'}`,
          type: activityType as Activity['type'],
          location: {
            address: place.formatted_address || place.vicinity,
            coordinates: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            },
            googlePlaceId: place.place_id
          },
          startTime,
          endTime: '', // Will be calculated based on duration
          duration,
          cost: {
            amount: estimatedCost,
            currency: 'USD',
            perPerson: true
          },
          rating: place.rating,
          aiGenerated: false,
          userAdded: false,
          tags: [
            activityType,
            ...(place.types?.slice(0, 3).map((t: string) => t.replace(/_/g, ' ')) || [])
          ].filter(Boolean),
          images: place.photos?.map((photo: any) => ({
            url: `/api/places/photo?name=${photo.photo_reference}&maxWidth=800`,
            caption: place.name
          })) || []
        }
      })
      .filter(activity => {
        // Filter by budget if specified
        if (budget && activity.cost) {
          return activity.cost.amount <= budget
        }
        return true
      })
      .slice(0, 20) // Limit to 20 results

    // Sort by rating (if available)
    activities.sort((a, b) => (b.rating || 0) - (a.rating || 0))

    // Add unique AI-generated suggestion if we have results
    if (activities.length > 0 && activities.length < 10) {
      const aiSuggestion = await generateUniqueActivity(
        location,
        activityType,
        budget,
        timeOfDay
      )
      if (aiSuggestion) {
        activities.splice(3, 0, aiSuggestion) // Insert as 4th result
      }
    }

    return NextResponse.json({ activities })

  } catch (error) {
    console.error('Activity search error:', error)
    return NextResponse.json(
      { error: 'Failed to search activities' },
      { status: 500 }
    )
  }
}

// Generate unique AI-powered activity suggestions
async function generateUniqueActivity(
  location: { lat: number; lng: number },
  activityType: string,
  budget?: number,
  timeOfDay?: string
): Promise<Activity | null> {
  // This will be implemented in Phase 3
  // For now, return null
  return null
}