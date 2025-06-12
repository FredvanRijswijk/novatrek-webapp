import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import { z } from 'zod';
import { verifyIdToken, getAdminDb } from '@/lib/firebase/admin';
import { toolRegistry, registerAllTools } from '@/lib/ai/tools';
import { ToolContext } from '@/lib/ai/tools/types';
import { TripContextBuilder } from '@/lib/services/trip-context-builder';
import { normalizeDate } from '@/lib/utils/date-helpers';

// Initialize tools
registerAllTools();

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })),
  tripId: z.string(),
  currentDate: z.string().optional(),
  model: z.enum(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo']).default('gpt-4o')
});

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token
    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    const body = await request.json();
    const { messages, tripId, currentDate, model } = requestSchema.parse(body);

    console.log('Enhanced chat request:', { userId, tripId, currentDate, model });

    // Load trip and user data
    const [tripData, userData, preferencesData] = await Promise.all([
      loadTrip(tripId, userId),
      loadUser(userId),
      loadPreferences(userId)
    ]);

    if (!tripData) {
      console.error('Trip not found or user does not have access');
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    
    console.log('Trip days loaded:', {
      count: tripData.days.length,
      dates: tripData.days.map(d => ({ id: d.id, date: d.date, hasActivities: !!d.activities }))
    });

    // Build comprehensive context
    const contextBuilder = new TripContextBuilder(
      tripData.trip,
      preferencesData,
      undefined // Weather data could be fetched here if needed
    );
    const tripContext = contextBuilder.build();
    
    // Create tool context
    const toolContext: ToolContext = {
      userId,
      user: userData,
      trip: tripData.trip,
      tripDays: tripData.days,
      preferences: preferencesData,
      currentDate,
      weather: tripContext.weather,
      budget: tripContext.budget
    };

    // Get available tools for this user
    const availableTools = toolRegistry.getAvailableTools(toolContext);
    
    // Build system prompt with context and trip days
    const enhancedTripContext = {
      ...tripContext,
      tripDays: tripData.days
    };
    const systemPrompt = buildSystemPrompt(enhancedTripContext, preferencesData, currentDate);
    
    // Convert to core messages format
    const coreMessages = convertToCoreMessages([
      { role: 'system', content: systemPrompt },
      ...messages
    ]);

    // Create tools configuration for AI
    const tools = availableTools.reduce((acc, tool) => {
      acc[tool.id] = {
        description: tool.description,
        parameters: tool.parameters,
        execute: async (params: any) => {
          console.log(`Executing tool ${tool.id} with params:`, params);
          const result = await toolRegistry.execute(tool.id, params, toolContext);
          console.log(`Tool ${tool.id} result:`, result);
          return result;
        }
      };
      return acc;
    }, {} as any);

    // Stream the response
    const result = await streamText({
      model: openai(model),
      messages: coreMessages,
      tools,
      maxToolRoundtrips: 3,
      temperature: 0.7,
      experimental_streamToolCalls: true, // Enable streaming of tool calls
      onToolCall: async ({ toolCall }) => {
        console.log('Tool called:', toolCall.toolName, toolCall.args);
      }
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Enhanced chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat failed' },
      { status: 500 }
    );
  }
}

async function loadTrip(tripId: string, userId: string) {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error('Admin DB not initialized');
      return null;
    }
    
    const tripDoc = await adminDb.collection('trips').doc(tripId).get();
    
    if (!tripDoc.exists) {
      console.log('Trip not found:', tripId);
      return null;
    }
    
    const tripData = tripDoc.data()!;
    
    // Check ownership - support both userId and userRef patterns
    const isOwner = tripData.userId === userId || 
                    tripData.userRef?.path === `users/${userId}` ||
                    tripData.userRef?._path?.segments?.join('/') === `users/${userId}`;
    
    if (!isOwner) {
      console.log('User does not own trip:', { tripId, userId, tripUserId: tripData.userId, tripUserRef: tripData.userRef });
      return null;
    }
    
    console.log('Trip data structure:', {
      hasDestination: !!tripData.destination,
      hasDestinations: !!tripData.destinations,
      destinationsLength: tripData.destinations?.length,
      firstDestination: tripData.destinations?.[0]
    });
    
    // Convert Firestore Timestamps to ISO strings
    if (tripData.startDate && typeof tripData.startDate.toDate === 'function') {
      tripData.startDate = tripData.startDate.toDate().toISOString();
    }
    if (tripData.endDate && typeof tripData.endDate.toDate === 'function') {
      tripData.endDate = tripData.endDate.toDate().toISOString();
    }
    if (tripData.createdAt && typeof tripData.createdAt.toDate === 'function') {
      tripData.createdAt = tripData.createdAt.toDate().toISOString();
    }
    if (tripData.updatedAt && typeof tripData.updatedAt.toDate === 'function') {
      tripData.updatedAt = tripData.updatedAt.toDate().toISOString();
    }

    // Load trip days from the itinerary array
    const days = (tripData.itinerary || []).map(day => {
      // Normalize date to consistent format
      const normalizedDate = normalizeDate(day.date);
      
      return {
        id: day.id || `day-${day.dayNumber}`,
        dayNumber: day.dayNumber,
        date: normalizedDate,
        activities: day.activities || [],
        notes: day.notes || '',
        ...day
      };
    });

    return {
      trip: { id: tripDoc.id, ...tripData },
      days
    };
  } catch (error) {
    console.error('Error loading trip:', error);
    return null;
  }
}

async function loadUser(userId: string) {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error('Admin DB not initialized');
      return null;
    }
    
    const userDoc = await adminDb.collection('users').doc(userId).get();
    return userDoc.exists ? userDoc.data() : null;
  } catch (error) {
    console.error('Error loading user:', error);
    return null;
  }
}

async function loadPreferences(userId: string) {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error('Admin DB not initialized');
      return null;
    }
    
    const prefDoc = await adminDb.collection('travelPreferences').doc(userId).get();
    return prefDoc.exists ? prefDoc.data() : null;
  } catch (error) {
    console.error('Error loading preferences:', error);
    return null;
  }
}

function buildSystemPrompt(tripContext: any, preferences: any, currentDate?: string): string {
  // Check if trip has days
  const hasTripDays = tripContext.tripDays && tripContext.tripDays.length > 0;
  
  return `You are an intelligent travel planning assistant for NovaTrek with access to powerful tools.

## Your Capabilities:
- Search for activities and restaurants with expert recommendations
- Add activities to the itinerary with intelligent scheduling
- Find available time slots in the schedule
- Check weather conditions for better planning
- Create trip days when needed
- Create smart todo lists based on the trip
- Create intelligent booking reminders for activities
- Aggregate preferences for group travel planning
- Find group-friendly activities that work for everyone
- Provide personalized recommendations based on user preferences

## Trip Context:
${JSON.stringify(tripContext, null, 2)}

## User Preferences:
${preferences ? JSON.stringify(preferences, null, 2) : 'No preferences set'}

## Current Planning Context:
${currentDate ? `You are currently planning for: ${currentDate}
When adding activities, use this date unless the user specifies otherwise.` : 'Planning for the entire trip'}

${!hasTripDays ? `
## IMPORTANT: No Trip Days Exist
This trip currently has no days created. Before adding activities:
1. Use the create_trip_days tool to set up the trip structure
2. You can create days for the entire trip duration or specific dates
3. Once days are created, you can add activities to them

Example: If the user asks to add an activity, first say "I need to set up your trip days first" and use create_trip_days.
` : ''}

## Guidelines:
1. **Check Trip Structure First**: Always verify trip days exist before adding activities
2. **Prioritize Expert Recommendations**: When searching, highlight expert-recommended options first
3. **Be Proactive**: Suggest activities that fill gaps in the itinerary
4. **Consider Context**: Factor in weather, time of day, and user preferences
5. **Smart Scheduling**: When adding activities, optimize for minimal travel time
6. **Create Actionable Todos**: Generate specific, timely todos for bookings and preparations

## IMPORTANT Tool Usage Rules:
- When asked about weather or rainy day activities: FIRST use search_activities to find options, THEN use weather_filter to analyze them
- When asked to search: ALWAYS use search_activities or search_restaurants tools
- When asked about the itinerary: ALWAYS use view_itinerary tool first
- When asked about group travel: ALWAYS use aggregate_preferences then group_activity_search
- NEVER provide generic lists without using the appropriate search tools
- For weather-related queries: search_activities with indoor/museum keywords → weather_filter to rank by suitability

## How to Use Tools:
- Use create_trip_days to set up trip day structure (if needed)
- Use search_activities to find things to do
- Use search_restaurants to find dining options (includes dietary preferences)
- Use add_activity to add items to the itinerary - IMPORTANT: Use the date from "Current Planning Context" above
- Use find_time_slots to find available time in the schedule
- Use weather_filter to check weather conditions
- Use create_todos to generate task lists
- Use create_booking_reminders to analyze activities and create smart booking reminders
- Use aggregate_preferences to analyze group member preferences and find compromises
- Use group_activity_search to find activities that work for diverse groups
- Use view_itinerary to show the current trip schedule and get planning insights

## Group Travel Support:
When the user mentions traveling with others or asks about group activities:
1. First use aggregate_preferences to understand the group's combined needs
2. Then use group_activity_search to find suitable options
3. Highlight compromises and suggestions for group harmony

Always explain your reasoning and provide multiple options when available.`;
}