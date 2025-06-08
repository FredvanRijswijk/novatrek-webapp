import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyIdToken } from '@/lib/firebase/admin'
import { Activity } from '@/types/travel'
import { WeatherServerClient } from '@/lib/weather/server-client'
import { RecommendationModel } from '@/lib/models/recommendations'

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

// Indoor/Outdoor classification
const indoorActivities = ['shopping', 'cultural', 'wellness', 'entertainment']
const outdoorActivities = ['outdoor', 'sightseeing']
const mixedActivities = ['dining', 'activity'] // Can be either

// Family-friendly classification
const familyFriendlyTypes = [
  'amusement_park', 'aquarium', 'zoo', 'park', 'museum', 
  'beach', 'bowling_alley', 'movie_theater', 'restaurant',
  'tourist_attraction', 'playground', 'theme_park'
]

const adultsOnlyTypes = [
  'bar', 'night_club', 'casino', 'winery', 'brewery',
  'spa', 'wine_bar', 'cocktail_bar'
]

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
      timeOfDay,
      preferIndoorActivities,
      preferOutdoorActivities,
      familyFriendly
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

    // Get recommendations first (expert + NovaTrek)
    let recommendations: Activity[] = []
    try {
      // Extract city from the first result or search query
      let city = ''
      if (results.length > 0 && results[0].address_components) {
        const cityComponent = results[0].address_components.find((component: any) => 
          component.types.includes('locality') || component.types.includes('administrative_area_level_1')
        )
        city = cityComponent?.long_name || ''
      }
      
      if (city) {
        const [expertRecs, novatrekRecs] = await Promise.all([
          RecommendationModel.getRecommendationsByCity(city, activityType, 5),
          RecommendationModel.getNovaTrekRecommendations(city, activityType, 5)
        ])
        
        // Convert recommendations to Activity format
        recommendations = [...expertRecs, ...novatrekRecs].map(rec => ({
          id: `rec_${rec.id}`,
          googlePlaceId: rec.googlePlaceId,
          name: rec.name,
          description: rec.description || rec.reason || '',
          type: (rec.type || activityType || 'activity') as Activity['type'],
          location: {
            name: rec.location.address,
            address: rec.location.address,
            coordinates: rec.location.coordinates,
            placeId: rec.googlePlaceId
          },
          rating: rec.rating,
          tags: [
            ...rec.tags,
            rec.recommendedBy.type === 'expert' ? 'expert-pick' : 'novatrek-pick',
            `Recommended by ${rec.recommendedBy.name}`
          ],
          images: rec.images || [],
          openingHours: rec.openingHours,
          phone: rec.phone,
          website: rec.website,
          aiGenerated: false,
          userAdded: false,
          isRecommended: true,
          recommendedBy: rec.recommendedBy,
          recommendationReason: rec.reason,
          tips: rec.tips,
          highlights: rec.highlights
        } as Activity))
        
        // Increment view counts
        await Promise.all(
          [...expertRecs, ...novatrekRecs].map(rec => 
            RecommendationModel.incrementRecommendationStat(rec.id, 'viewCount')
          )
        )
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      // Continue without recommendations
    }

    // Get weather data if we need to filter by indoor/outdoor
    let weatherData = null
    let weatherRecommendation = null
    
    console.log('Weather fetch conditions:', { date, preferIndoorActivities, shouldFetchWeather: date && !preferIndoorActivities })
    
    if (date && !preferIndoorActivities) {
      // Only fetch weather if not already preferring indoor
      try {
        console.log('Attempting to fetch weather data for date:', date)
        const weatherClient = WeatherServerClient.getInstance()
        weatherData = await weatherClient.getWeather(
          location.lat,
          location.lng,
          new Date(date)
        )
        
        if (weatherData) {
          console.log('Weather data received:', weatherData)
          weatherRecommendation = WeatherServerClient.getActivityRecommendation(weatherData)
        } else {
          console.log('No weather data returned')
        }
      } catch (weatherError) {
        console.error('Error fetching weather:', weatherError)
        // Continue without weather data
      }
    }

    // Determine activity preference
    const shouldPreferIndoor = preferIndoorActivities || 
                              (weatherRecommendation?.preferIndoor && 
                               weatherRecommendation.severity !== 'low' &&
                               !preferOutdoorActivities)
    
    const shouldPreferOutdoor = preferOutdoorActivities ||
                               (!preferIndoorActivities && 
                                weatherRecommendation && 
                                !weatherRecommendation.preferIndoor)

    // Get place types for filtering
    let targetTypes = activityTypeToPlaceTypes[activityType] || []
    
    // If preferring indoor and no specific type selected, use indoor types
    if (shouldPreferIndoor && !activityType) {
      targetTypes = [
        ...activityTypeToPlaceTypes.shopping,
        ...activityTypeToPlaceTypes.cultural,
        ...activityTypeToPlaceTypes.entertainment,
        ...activityTypeToPlaceTypes.wellness
      ]
    }
    
    // If preferring outdoor and no specific type selected, use outdoor types
    if (shouldPreferOutdoor && !activityType) {
      targetTypes = [
        ...activityTypeToPlaceTypes.outdoor,
        ...activityTypeToPlaceTypes.sightseeing,
        'park', 'beach', 'hiking_area', 'natural_feature'
      ]
    }

    // Transform and enhance results
    const activities: Activity[] = results
      .filter((place: any) => {
        // Filter by activity type if specified
        if (targetTypes.length > 0 && place.types) {
          return place.types.some((type: string) => targetTypes.includes(type))
        }
        
        // Additional filtering for indoor preference
        if (shouldPreferIndoor && activityType) {
          // If we need indoor activities, filter out definitely outdoor types
          if (outdoorActivities.includes(activityType)) {
            return false
          }
        }
        
        // Filter by family-friendly preference
        if (familyFriendly !== null && place.types) {
          const placeTypes = place.types as string[]
          
          if (familyFriendly === true) {
            // Exclude adults-only places
            if (placeTypes.some((type: string) => adultsOnlyTypes.includes(type))) {
              return false
            }
          } else if (familyFriendly === false) {
            // Only include places that might be adults-oriented
            // Don't exclude restaurants as they can be upscale/romantic
            const hasAdultType = placeTypes.some((type: string) => adultsOnlyTypes.includes(type))
            const hasFamilyType = placeTypes.some((type: string) => 
              ['playground', 'amusement_park', 'theme_park', 'zoo', 'aquarium'].includes(type)
            )
            
            // Exclude obvious family places when looking for adults-only
            if (hasFamilyType && !hasAdultType) {
              return false
            }
          }
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
            ...(place.types?.slice(0, 3).map((t: string) => t.replace(/_/g, ' ')) || []),
            // Add family-friendly tags
            ...(place.types?.some((t: string) => familyFriendlyTypes.includes(t)) ? ['family-friendly'] : []),
            ...(place.types?.some((t: string) => adultsOnlyTypes.includes(t)) ? ['adults-only'] : [])
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

    // Sort activities based on preference
    if (shouldPreferIndoor || shouldPreferOutdoor) {
      activities.sort((a, b) => {
        const aIsIndoor = indoorActivities.includes(a.type) || 
                         (a.tags?.some(tag => tag.includes('indoor')) ?? false)
        const bIsIndoor = indoorActivities.includes(b.type) || 
                         (b.tags?.some(tag => tag.includes('indoor')) ?? false)
        
        const aIsOutdoor = outdoorActivities.includes(a.type) || 
                          (a.tags?.some(tag => 
                            ['park', 'beach', 'hiking', 'trail', 'garden', 'outdoor'].some(term => 
                              tag.toLowerCase().includes(term)
                            )
                          ) ?? false)
        const bIsOutdoor = outdoorActivities.includes(b.type) || 
                          (b.tags?.some(tag => 
                            ['park', 'beach', 'hiking', 'trail', 'garden', 'outdoor'].some(term => 
                              tag.toLowerCase().includes(term)
                            )
                          ) ?? false)
        
        // Sort based on preference
        if (shouldPreferIndoor) {
          if (aIsIndoor && !bIsIndoor) return -1
          if (!aIsIndoor && bIsIndoor) return 1
        } else if (shouldPreferOutdoor) {
          if (aIsOutdoor && !bIsOutdoor) return -1
          if (!aIsOutdoor && bIsOutdoor) return 1
        }
        
        // Then sort by rating
        return (b.rating || 0) - (a.rating || 0)
      })
    }

    // Combine recommendations first, then regular results
    const allActivities = [
      ...recommendations,
      ...activities.filter(activity => 
        !recommendations.some(rec => rec.googlePlaceId === activity.googlePlaceId)
      )
    ].slice(0, 20) // Keep total limit

    return NextResponse.json({ 
      activities: allActivities,
      weather: weatherData ? {
        condition: weatherData.condition,
        temperature: weatherData.temp,
        description: weatherData.description,
        recommendation: weatherRecommendation
      } : undefined,
      hasRecommendations: recommendations.length > 0
    })

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