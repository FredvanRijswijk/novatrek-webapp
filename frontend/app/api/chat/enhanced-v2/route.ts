import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import { z } from 'zod';
import { verifyIdToken, getAdminDb } from '@/lib/firebase/admin';
import { toolRegistry, registerAllTools } from '@/lib/ai/tools';
import { ToolContext } from '@/lib/ai/tools/types';
import { TripServiceV2 } from '@/lib/services/trip-service-v2';
import { TripModelV2 } from '@/lib/models/v2/trip-model-v2';
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

    console.log('Enhanced chat V2 request:', { userId, tripId, currentDate, model });

    // Initialize services
    const tripService = new TripServiceV2();
    const tripModel = new TripModelV2();

    try {
      // First check if the trip exists and user has access
      const hasAccess = await tripModel.hasAccess(tripId, userId);
      if (!hasAccess) {
        console.error('User does not have access to trip:', { tripId, userId });
        return NextResponse.json({ error: 'Missing or insufficient permissions.' }, { status: 403 });
      }

      // Load trip and user data using V2 structure
      console.log('Loading trip data for:', { tripId, userId });
      
      let fullTripData, userData, preferencesData;
      try {
        [fullTripData, userData, preferencesData] = await Promise.all([
          tripService.getFullTrip(tripId),
          loadUser(userId),
          loadPreferences(userId)
        ]);
      } catch (loadError: any) {
        console.error('Error loading data:', loadError);
        if (loadError?.code === 'permission-denied' || loadError?.message?.includes('Missing or insufficient permissions')) {
          return NextResponse.json({ error: 'Missing or insufficient permissions.' }, { status: 403 });
        }
        throw loadError;
      }

      if (!fullTripData) {
        console.error('Trip not found after access check:', { tripId });
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }
    
    console.log('Trip days loaded:', {
      count: fullTripData.days.length,
      dates: fullTripData.days.map(d => ({ 
        id: d.id, 
        date: d.date, 
        dayNumber: d.dayNumber,
        activityCount: d.activities.length 
      }))
    });

    // Build trip context with V2 structure
    const tripContext = buildTripContext(fullTripData, preferencesData);
    
    // Create tool context with V2 structure
    const toolContext: ToolContext = {
      userId,
      user: userData,
      trip: fullTripData.trip,
      tripDays: fullTripData.days,
      preferences: preferencesData,
      currentDate,
      weather: tripContext.weather,
      budget: tripContext.budget
    };

    // Get available tools for this user
    const availableTools = toolRegistry.getAvailableTools(toolContext);
    
    // Build system prompt
    const systemPrompt = buildSystemPrompt(tripContext, preferencesData, currentDate);
    
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
      experimental_streamToolCalls: true,
      onToolCall: async ({ toolCall }) => {
        console.log('Tool called:', toolCall.toolName, toolCall.args);
      }
    });

      return result.toDataStreamResponse();
    } catch (firestoreError: any) {
      // Check if it's a Firestore permission error
      if (firestoreError?.code === 'permission-denied' || firestoreError?.message?.includes('Missing or insufficient permissions')) {
        console.error('Firestore permission error:', { tripId, userId, error: firestoreError.message });
        return NextResponse.json({ error: 'Missing or insufficient permissions.' }, { status: 403 });
      }
      throw firestoreError;
    }

  } catch (error) {
    console.error('Enhanced chat V2 error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat failed' },
      { status: 500 }
    );
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

function buildTripContext(fullTripData: any, preferences: any) {
  const { trip, days } = fullTripData;
  
  // Calculate statistics
  const totalActivities = days.reduce((sum: number, day: any) => 
    sum + day.activities.length, 0
  );
  
  const totalCost = days.reduce((sum: number, day: any) => 
    sum + (day.stats?.totalCost || 0), 0
  );
  
  const emptyDays = days.filter((day: any) => day.activities.length === 0);
  
  return {
    trip: {
      id: trip.id,
      name: trip.name || trip.title,
      destination: trip.destination?.name || trip.destinations?.[0]?.destination?.name,
      startDate: trip.startDate,
      endDate: trip.endDate,
      travelers: trip.travelers
    },
    itinerary: {
      totalDays: days.length,
      plannedDays: days.filter((d: any) => d.activities.length > 0).length,
      emptyDays: emptyDays.map((d: any) => d.dayNumber),
      totalActivities,
      dayDetails: days.map((day: any) => ({
        dayNumber: day.dayNumber,
        date: day.date,
        activityCount: day.activities.length,
        hasAccommodation: (day.accommodations?.length || 0) > 0,
        hasTransport: (day.transportation?.length || 0) > 0
      }))
    },
    budget: {
      total: trip.budget?.total || 0,
      spent: totalCost,
      remaining: (trip.budget?.total || 0) - totalCost,
      currency: trip.budget?.currency || 'USD'
    },
    preferences,
    weather: null // Would be fetched if needed
  };
}

function buildSystemPrompt(tripContext: any, preferences: any, currentDate?: string): string {
  const hasTripDays = tripContext.itinerary.totalDays > 0;
  const hasEmptyDays = tripContext.itinerary.emptyDays.length > 0;
  
  return `You are an intelligent travel planning assistant for NovaTrek with access to powerful tools.

## Your Capabilities:
- Search for activities and restaurants with expert recommendations
- Add activities to the itinerary with intelligent scheduling
- Create trip days when needed
- View and analyze the current itinerary
- Create smart todo lists and booking reminders
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
` : hasEmptyDays ? `
## Planning Opportunity
Days ${tripContext.itinerary.emptyDays.join(', ')} don't have any activities yet. Consider suggesting activities for these days.
` : ''}

## Guidelines:
1. **Check Trip Structure First**: Always verify trip days exist before adding activities
2. **Use V2 Structure**: All data is now stored in subcollections for better performance
3. **Prioritize Expert Recommendations**: Highlight expert-recommended options
4. **Be Proactive**: Suggest activities for empty days
5. **Smart Scheduling**: Optimize for minimal travel time between activities

## Tool Usage:
- Use create_trip_days to set up the trip structure
- Use search_activities to find things to do
- Use search_restaurants to find dining options
- Use add_activity to add items to specific days
- Use view_itinerary to show current plans and get insights
- ALWAYS use the appropriate search tools before making generic suggestions

Remember: You're using the new V2 subcollection structure which provides better performance and flexibility.`;
}