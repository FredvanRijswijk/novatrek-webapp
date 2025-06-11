import { streamText, convertToCoreMessages, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { AdminTripModel } from '@/lib/firebase/admin-trip';
import { Activity, Accommodation } from '@/types/travel';
import { geocodingService } from '@/lib/google-places/geocoding';

// Tool parameter schemas
const searchHotelsSchema = z.object({
  location: z.string().describe('City or area to search for hotels'),
  checkIn: z.string().describe('Check-in date in YYYY-MM-DD format'),
  checkOut: z.string().describe('Check-out date in YYYY-MM-DD format'),
  priceRange: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  }).optional(),
  amenities: z.array(z.string()).optional().describe('Desired amenities like pool, gym, breakfast'),
  rating: z.number().min(1).max(5).optional()
});

const searchActivitiesSchema = z.object({
  location: z.string().describe('Location to search for activities'),
  activityType: z.enum(['sightseeing', 'dining', 'shopping', 'outdoor', 'cultural', 'entertainment', 'wellness']).optional(),
  date: z.string().describe('Date for the activity in YYYY-MM-DD format'),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening']).optional(),
  duration: z.number().optional().describe('Desired duration in minutes'),
  budget: z.number().optional().describe('Maximum budget per person')
});

const addToItinerarySchema = z.object({
  type: z.enum(['activity', 'accommodation']),
  dayNumber: z.number().describe('Day number in the trip (1-based)'),
  item: z.object({
    name: z.string(),
    description: z.string().optional(),
    location: z.object({
      address: z.string(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      }).optional()
    }),
    // Activity-specific fields
    startTime: z.string().optional().describe('Start time in HH:MM format'),
    duration: z.number().optional().describe('Duration in minutes'),
    activityType: z.string().optional(),
    // Accommodation-specific fields
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    accommodationType: z.enum(['hotel', 'airbnb', 'hostel', 'resort', 'other']).optional(),
    // Common fields
    cost: z.object({
      amount: z.number(),
      currency: z.string().default('USD'),
      perPerson: z.boolean().optional()
    }).optional(),
    rating: z.number().optional(),
    googlePlaceId: z.string().optional()
  })
});

const checkAvailabilitySchema = z.object({
  dayNumber: z.number(),
  startTime: z.string().describe('Time in HH:MM format'),
  duration: z.number().describe('Duration in minutes')
});

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.error('No authentication token provided');
      return new Response('Unauthorized', { status: 401 });
    }

    let userId: string;
    try {
      const decodedToken = await verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      console.error('Token verification failed:', error);
      return new Response('Invalid token', { status: 401 });
    }

    const { messages, tripId, tripContext, userPreferences } = await req.json();

    // Load trip data using Admin SDK
    let trip;
    try {
      trip = await AdminTripModel.getById(tripId);
      if (!trip) {
        console.error('Trip not found:', tripId);
        return new Response('Trip not found', { status: 404 });
      }
      
      // Check ownership - trip.userId is normalized in AdminTripModel
      if (trip.userId !== userId) {
        console.error('User does not own trip:', { 
          tripUserId: trip.userId, 
          requestUserId: userId
        });
        return new Response('Unauthorized to access this trip', { status: 403 });
      }
    } catch (error) {
      console.error('Error loading trip:', error);
      return new Response('Failed to load trip data', { status: 500 });
    }

    // Build system prompt with context
    let systemPrompt = `You are NovaTrek's AI travel assistant helping plan a trip to ${trip.destination?.name || trip.destinations?.[0]?.destination.name}.

Trip Details:
- Dates: ${new Date(trip.startDate).toLocaleDateString()} to ${new Date(trip.endDate).toLocaleDateString()}
- Travelers: ${trip.travelers.length} people
- Budget: ${trip.budget ? `$${trip.budget.total} ${trip.budget.currency}` : 'Not specified'}

Current Itinerary:
${trip.itinerary?.map(day => 
  `Day ${day.dayNumber}: ${day.activities?.length || 0} activities planned`
).join('\n') || 'No activities planned yet'}

Instructions:
- When users ask for hotels, use the search_hotels tool
- When users ask for activities, use the search_activities tool
- Always check availability before adding items
- Be specific about locations and times
- Consider the trip budget when making suggestions`;

    if (userPreferences) {
      systemPrompt += `\n\nUser Preferences:
- Travel Style: ${userPreferences.travelStyle || 'Not specified'}
- Pace: ${userPreferences.pacePreference || 'moderate'}
- Interests: ${userPreferences.interests?.join(', ') || 'General'}
- Dietary: ${userPreferences.dietaryRestrictions?.join(', ') || 'None'}`;
    }

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      messages: convertToCoreMessages(messages),
      system: systemPrompt,
      tools: {
        search_hotels: tool({
          description: 'Search for hotels in a specific location',
          parameters: searchHotelsSchema,
          execute: async ({ location, checkIn, checkOut, priceRange, amenities, rating }) => {
            console.log('🏨 Hotel Search Request:', {
              location,
              checkIn,
              checkOut,
              priceRange,
              amenities,
              rating
            });

            // Use Google Places API to search for hotels
            const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            if (!apiKey) {
              console.error('❌ No Google Maps API key found');
              return { hotels: [], checkIn, checkOut, searchLocation: location };
            }

            const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
            
            let query = `hotels in ${location}`;
            if (amenities?.length) {
              query += ` with ${amenities.join(' ')}`;
            }
            
            console.log('🔍 Search query:', query);
            
            searchUrl.searchParams.set('query', query);
            // Don't set type parameter as it can limit results
            // searchUrl.searchParams.set('type', 'lodging');
            searchUrl.searchParams.set('key', apiKey);
            
            console.log('📍 API URL:', searchUrl.toString().replace(apiKey, 'API_KEY_HIDDEN'));
            
            try {
              const response = await fetch(searchUrl.toString());
              const data = await response.json();
              
              console.log('📡 Google Places API Response:', {
                status: data.status,
                resultsCount: data.results?.length || 0,
                errorMessage: data.error_message
              });

              if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
                console.error('❌ Google Places API Error:', data.status, data.error_message);
              }

              // Log first few results for debugging
              if (data.results?.length > 0) {
                console.log('🏨 Sample results:', data.results.slice(0, 2).map((r: any) => ({
                  name: r.name,
                  types: r.types,
                  rating: r.rating,
                  price_level: r.price_level
                })));
              }
              
              const hotels = data.results?.slice(0, 5).map((place: any) => ({
                id: place.place_id,
                name: place.name,
                address: place.formatted_address,
                rating: place.rating,
                priceLevel: place.price_level,
                location: {
                  lat: place.geometry.location.lat,
                  lng: place.geometry.location.lng
                },
                // Estimate price based on price level
                estimatedPrice: place.price_level ? place.price_level * 50 + 50 : 100
              })) || [];
              
              console.log(`✅ Returning ${hotels.length} hotels`);
              
              return {
                hotels,
                checkIn,
                checkOut,
                searchLocation: location
              };
            } catch (error) {
              console.error('❌ Error fetching hotels:', error);
              return { hotels: [], checkIn, checkOut, searchLocation: location };
            }
          }
        }),

        search_activities: tool({
          description: 'Search for activities and attractions',
          parameters: searchActivitiesSchema,
          execute: async ({ location, activityType, date, timeOfDay, duration, budget }) => {
            console.log('🎯 Activity Search Request:', {
              location,
              activityType,
              date,
              timeOfDay,
              duration,
              budget
            });

            // Use existing activity search endpoint
            const searchUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/activities/search`;
            console.log('🔍 Calling activity search API:', searchUrl);

            try {
              const searchResponse = await fetch(searchUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  location: trip.destination?.coordinates || trip.destinations?.[0]?.destination.coordinates,
                  activityType,
                  searchQuery: location,
                  budget,
                  date: new Date(date).toISOString(),
                  timeOfDay
                })
              });

              console.log('📡 Activity search response status:', searchResponse.status);

              if (!searchResponse.ok) {
                console.error('❌ Activity search failed:', searchResponse.status, await searchResponse.text());
                return { activities: [], date, location };
              }

              const { activities } = await searchResponse.json();
              console.log(`✅ Found ${activities?.length || 0} activities`);
              
              return {
                activities: activities?.slice(0, 5) || [],
                date,
                location
              };
            } catch (error) {
              console.error('❌ Error searching activities:', error);
              return { activities: [], date, location };
            }
          }
        }),

        add_to_itinerary: tool({
          description: 'Add an activity or accommodation to the trip itinerary',
          parameters: addToItinerarySchema,
          execute: async ({ type, dayNumber, item }) => {
            try {
              // Geocode if coordinates not provided
              if (!item.location.coordinates && item.location.address) {
                const geocoded = await geocodingService.geocodeLocation(
                  item.location.address,
                  trip.destination?.coordinates
                );
                if (geocoded) {
                  item.location.coordinates = geocoded.coordinates;
                }
              }

              if (type === 'accommodation') {
                const accommodation: Accommodation = {
                  id: `acc-${Date.now()}`,
                  name: item.name,
                  type: item.accommodationType || 'hotel',
                  location: {
                    name: item.location.address,
                    address: item.location.address,
                    coordinates: item.location.coordinates || { lat: 0, lng: 0 },
                    placeId: item.googlePlaceId
                  },
                  checkIn: new Date(item.checkIn || trip.startDate),
                  checkOut: new Date(item.checkOut || trip.endDate),
                  cost: item.cost?.amount,
                  currency: item.cost?.currency,
                  rating: item.rating,
                  amenities: []
                };
                
                await AdminTripModel.addAccommodation(tripId, dayNumber, accommodation);
                
                return {
                  success: true,
                  message: `Added ${item.name} to your trip`,
                  type: 'accommodation'
                };
              } else {
                const activity: Activity = {
                  id: `act-${Date.now()}`,
                  name: item.name,
                  description: item.description || '',
                  type: (item.activityType || 'sightseeing') as any,
                  location: {
                    name: item.location.address,
                    address: item.location.address,
                    coordinates: item.location.coordinates || { lat: 0, lng: 0 }
                  },
                  googlePlaceId: item.googlePlaceId,
                  startTime: item.startTime,
                  duration: item.duration || 120,
                  cost: item.cost,
                  rating: item.rating,
                  aiGenerated: true,
                  userAdded: false
                };
                
                await AdminTripModel.addActivity(tripId, dayNumber, activity);
                
                return {
                  success: true,
                  message: `Added ${item.name} to Day ${dayNumber}`,
                  type: 'activity'
                };
              }
            } catch (error) {
              console.error('Error adding to itinerary:', error);
              return {
                success: false,
                message: 'Failed to add item to itinerary',
                error: error instanceof Error ? error.message : 'Unknown error'
              };
            }
          }
        }),

        check_availability: tool({
          description: 'Check if a time slot is available on a specific day',
          parameters: checkAvailabilitySchema,
          execute: async ({ dayNumber, startTime, duration }) => {
            const dayItinerary = trip.itinerary?.find(day => day.dayNumber === dayNumber);
            if (!dayItinerary) {
              return { available: true, conflicts: [] };
            }

            // Check for conflicts
            const conflicts = dayItinerary.activities?.filter(activity => {
              if (!activity.startTime) return false;
              
              const [newHours, newMinutes] = startTime.split(':').map(Number);
              const newStartMinutes = newHours * 60 + newMinutes;
              const newEndMinutes = newStartMinutes + duration;
              
              const [actHours, actMinutes] = activity.startTime.split(':').map(Number);
              const actStartMinutes = actHours * 60 + actMinutes;
              const actEndMinutes = actStartMinutes + (activity.duration || 60);
              
              return (newStartMinutes < actEndMinutes && newEndMinutes > actStartMinutes);
            }) || [];

            return {
              available: conflicts.length === 0,
              conflicts: conflicts.map(c => ({
                name: c.name,
                time: c.startTime,
                duration: c.duration
              }))
            };
          }
        })
      },
      maxTokens: 2000,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Trip planning chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}