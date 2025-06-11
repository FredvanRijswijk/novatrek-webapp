import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import { z } from 'zod';
import { verifyIdToken, adminDb } from '@/lib/firebase/admin';
import { toolRegistry, registerAllTools } from '@/lib/ai/tools';
import { ToolContext } from '@/lib/ai/tools/types';
import { buildTripContext } from '@/lib/services/trip-context-builder';

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

    // Load trip and user data
    const [tripData, userData, preferencesData] = await Promise.all([
      loadTrip(tripId, userId),
      loadUser(userId),
      loadPreferences(userId)
    ]);

    if (!tripData) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Build comprehensive context
    const tripContext = await buildTripContext(tripData);
    
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
    
    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(tripContext, preferencesData);
    
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
    const tripDoc = await adminDb.collection('trips').doc(tripId).get();
    
    if (!tripDoc.exists || tripDoc.data()?.userId !== userId) {
      return null;
    }

    // Load trip days
    const daysSnapshot = await adminDb
      .collection('trips')
      .doc(tripId)
      .collection('days')
      .orderBy('date')
      .get();
    
    const days = daysSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      trip: { id: tripDoc.id, ...tripDoc.data() },
      days
    };
  } catch (error) {
    console.error('Error loading trip:', error);
    return null;
  }
}

async function loadUser(userId: string) {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    return userDoc.exists ? userDoc.data() : null;
  } catch (error) {
    console.error('Error loading user:', error);
    return null;
  }
}

async function loadPreferences(userId: string) {
  try {
    const prefDoc = await adminDb.collection('travelPreferences').doc(userId).get();
    return prefDoc.exists ? prefDoc.data() : null;
  } catch (error) {
    console.error('Error loading preferences:', error);
    return null;
  }
}

function buildSystemPrompt(tripContext: any, preferences: any): string {
  return `You are an intelligent travel planning assistant for NovaTrek with access to powerful tools.

## Your Capabilities:
- Search for activities and restaurants with expert recommendations
- Add activities to the itinerary with intelligent scheduling
- Create smart todo lists based on the trip
- Provide personalized recommendations based on user preferences

## Trip Context:
${JSON.stringify(tripContext, null, 2)}

## User Preferences:
${preferences ? JSON.stringify(preferences, null, 2) : 'No preferences set'}

## Guidelines:
1. **Prioritize Expert Recommendations**: When searching, highlight expert-recommended options first
2. **Be Proactive**: Suggest activities that fill gaps in the itinerary
3. **Consider Context**: Factor in weather, time of day, and user preferences
4. **Smart Scheduling**: When adding activities, optimize for minimal travel time
5. **Create Actionable Todos**: Generate specific, timely todos for bookings and preparations

## How to Use Tools:
- Use search_activities to find things to do
- Use search_restaurants to find dining options
- Use add_activity to add items to the itinerary
- Use create_todos to generate task lists

Always explain your reasoning and provide multiple options when available.`;
}