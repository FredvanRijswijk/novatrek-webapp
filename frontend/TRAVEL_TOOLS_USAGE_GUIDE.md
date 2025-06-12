# Travel Tools Usage Guide

This guide explains how to use the AI travel tools throughout the NovaTrek application, not just in the chat interface.

## Overview

The travel tools are designed as reusable business logic modules that can be integrated anywhere in the application. They follow a consistent pattern and interface, making them easy to use across different contexts.

## Architecture

### Core Components

1. **Tool Registry** (`lib/ai/tools/registry.ts`)
   - Central registry for all tools
   - Handles tool discovery and execution
   - Manages permissions and access control

2. **Tool Interface** (`lib/ai/tools/types.ts`)
   ```typescript
   interface TravelTool<TParams, TResult> {
     id: string;
     name: string;
     description: string;
     category: 'search' | 'booking' | 'planning' | 'utility';
     parameters: z.ZodSchema<TParams>;
     execute: (params: TParams, context: ToolContext) => Promise<ToolResult<TResult>>;
     requiresAuth?: boolean;
   }
   ```

3. **Tool Context**
   ```typescript
   interface ToolContext {
     userId: string;
     user?: any;
     trip: Trip;
     tripDays: TripDay[];
     preferences?: TravelPreferences;
     currentDate?: string;
     weather?: any;
     budget?: BudgetAnalysis;
   }
   ```

## Available Tools

### Search Tools
- `search_activities` - Find attractions and activities
- `search_restaurants` - Find restaurants with dietary filters

### Planning Tools
- `add_activity` - Add activities to itinerary with conflict detection
- `find_time_slots` - Find available time slots in schedule
- `weather_filter` - Filter activities by weather conditions
- `create_trip_days` - Create day structure for trips
- `create_todos` - Generate smart todo lists

## Usage Examples

### 1. Direct Tool Execution

```typescript
import { toolRegistry } from '@/lib/ai/tools';
import { ToolContext } from '@/lib/ai/tools/types';

// In any component or API route
async function findTimeSlots(tripData: any, date: string) {
  // Build context
  const context: ToolContext = {
    userId: 'user123',
    trip: tripData.trip,
    tripDays: tripData.days,
    preferences: userPreferences,
    currentDate: date
  };
  
  // Execute tool
  const result = await toolRegistry.execute('find_time_slots', {
    date,
    duration: 120,
    preferences: { 
      avoidMealTimes: true,
      preferredTimeOfDay: 'morning'
    }
  }, context);
  
  if (result.success) {
    return result.data.availableSlots;
  }
  
  throw new Error(result.error);
}
```

### 2. API Route Integration

```typescript
// app/api/planning/time-slots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { toolRegistry } from '@/lib/ai/tools';
import { verifyIdToken, getAdminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token!);
    
    const { tripId, date, duration } = await request.json();
    
    // Load trip data
    const tripData = await loadTripWithDays(tripId, decodedToken.uid);
    
    // Build context
    const context = {
      userId: decodedToken.uid,
      trip: tripData.trip,
      tripDays: tripData.days,
      preferences: await loadUserPreferences(decodedToken.uid)
    };
    
    // Execute tool
    const result = await toolRegistry.execute('find_time_slots', {
      date,
      duration,
      preferences: { avoidMealTimes: true }
    }, context);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to find time slots' },
      { status: 500 }
    );
  }
}
```

### 3. React Component Integration

```typescript
// components/itinerary/TimeSlotPicker.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface TimeSlotPickerProps {
  tripId: string;
  date: string;
  duration: number;
  onSelectSlot: (slot: any) => void;
}

export function TimeSlotPicker({ 
  tripId, 
  date, 
  duration, 
  onSelectSlot 
}: TimeSlotPickerProps) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    findAvailableSlots();
  }, [date, duration]);
  
  const findAvailableSlots = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/planning/time-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({ tripId, date, duration })
      });
      
      const result = await response.json();
      if (result.success) {
        setSlots(result.data.availableSlots);
      }
    } catch (error) {
      console.error('Failed to load time slots:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Available Time Slots
      </h3>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-2">
          {slots.map((slot, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-2 border rounded hover:bg-accent cursor-pointer"
              onClick={() => onSelectSlot(slot)}
            >
              <span>{slot.startTime} - {slot.endTime}</span>
              <Badge variant={
                slot.quality === 'ideal' ? 'default' : 
                slot.quality === 'good' ? 'secondary' : 'outline'
              }>
                {slot.quality}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
```

### 4. Server Actions (Next.js 14+)

```typescript
// app/actions/planning.ts
'use server';

import { toolRegistry } from '@/lib/ai/tools';
import { auth } from '@/lib/firebase/auth';
import { loadTripData } from '@/lib/firebase/trips';

export async function searchActivities(
  tripId: string,
  query: string,
  filters?: {
    types?: string[];
    radius?: number;
    minRating?: number;
  }
) {
  const user = await auth();
  if (!user) throw new Error('Unauthorized');
  
  const tripData = await loadTripData(tripId, user.uid);
  
  const context = {
    userId: user.uid,
    trip: tripData.trip,
    tripDays: tripData.days,
    preferences: await loadUserPreferences(user.uid)
  };
  
  return toolRegistry.execute('search_activities', {
    query,
    location: tripData.trip.destinations[0].coordinates,
    types: filters?.types,
    radius: filters?.radius || 5000,
    minRating: filters?.minRating
  }, context);
}

export async function addActivityToItinerary(
  tripId: string,
  activity: any,
  date: string,
  time?: string
) {
  const user = await auth();
  if (!user) throw new Error('Unauthorized');
  
  const tripData = await loadTripData(tripId, user.uid);
  
  const context = {
    userId: user.uid,
    trip: tripData.trip,
    tripDays: tripData.days,
    preferences: await loadUserPreferences(user.uid)
  };
  
  return toolRegistry.execute('add_activity', {
    activity,
    date,
    time,
    autoOptimize: true
  }, context);
}
```

### 5. Custom Hooks

```typescript
// hooks/use-activity-search.ts
import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/firebase/auth';

export function useActivitySearch(tripId: string) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  const search = useCallback(async (query: string, options?: any) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          toolId: 'search_activities',
          params: {
            query,
            ...options
          },
          context: { tripId }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setResults(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, tripId]);
  
  return { search, results, loading, error };
}
```

### 6. Map Integration

```typescript
// components/map/ActivityMap.tsx
import { useEffect, useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { toolRegistry } from '@/lib/ai/tools';

export function ActivityMap({ trip, date, center }) {
  const [activities, setActivities] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  
  useEffect(() => {
    loadNearbyActivities();
    loadAvailableTimeSlots();
  }, [center, date]);
  
  const loadNearbyActivities = async () => {
    const context = buildContext(trip);
    
    const result = await toolRegistry.execute('search_activities', {
      location: center,
      radius: 2000,
      types: ['tourist_attraction', 'museum', 'park']
    }, context);
    
    if (result.success) {
      setActivities(result.data);
    }
  };
  
  const loadAvailableTimeSlots = async () => {
    const context = buildContext(trip);
    
    const result = await toolRegistry.execute('find_time_slots', {
      date,
      duration: 120
    }, context);
    
    if (result.success) {
      setTimeSlots(result.data.availableSlots);
    }
  };
  
  const handleAddActivity = async (activity: any) => {
    const bestSlot = timeSlots.find(s => s.quality === 'ideal');
    
    if (bestSlot) {
      const result = await toolRegistry.execute('add_activity', {
        activity,
        date,
        time: bestSlot.startTime
      }, buildContext(trip));
      
      if (result.success) {
        // Refresh the map and slots
        loadAvailableTimeSlots();
      }
    }
  };
  
  return (
    <GoogleMap center={center} zoom={14}>
      {activities.map((activity) => (
        <Marker
          key={activity.id}
          position={activity.location}
          onClick={() => handleAddActivity(activity)}
        />
      ))}
    </GoogleMap>
  );
}
```

### 7. Batch Operations

```typescript
// utils/trip-automation.ts
import { toolRegistry } from '@/lib/ai/tools';

export async function autoFillItinerary(
  tripId: string,
  preferences: {
    activitiesPerDay: number;
    includeRestaurants: boolean;
    weatherAware: boolean;
  }
) {
  const tripData = await loadTripData(tripId);
  const context = buildContext(tripData);
  
  // Create trip days if needed
  if (tripData.days.length === 0) {
    await toolRegistry.execute('create_trip_days', {
      startDate: tripData.trip.startDate,
      endDate: tripData.trip.endDate
    }, context);
  }
  
  // For each day
  for (const day of tripData.days) {
    // Check weather if enabled
    if (preferences.weatherAware) {
      const weatherResult = await toolRegistry.execute('weather_filter', {
        date: day.date
      }, context);
      
      // Adjust activity types based on weather
    }
    
    // Find morning activity slot
    const morningSlot = await toolRegistry.execute('find_time_slots', {
      date: day.date,
      duration: 120,
      preferences: { preferredTimeOfDay: 'morning' }
    }, context);
    
    if (morningSlot.success && morningSlot.data.bestSlot) {
      // Search for morning activities
      const activities = await toolRegistry.execute('search_activities', {
        query: 'morning activities',
        types: ['museum', 'park', 'landmark']
      }, context);
      
      if (activities.success && activities.data.length > 0) {
        // Add the top-rated activity
        await toolRegistry.execute('add_activity', {
          activity: activities.data[0],
          date: day.date,
          time: morningSlot.data.bestSlot.startTime
        }, context);
      }
    }
    
    // Add lunch if requested
    if (preferences.includeRestaurants) {
      const lunchSlot = await toolRegistry.execute('find_time_slots', {
        date: day.date,
        duration: 90,
        preferences: { 
          preferredTimeOfDay: 'afternoon',
          avoidMealTimes: false 
        }
      }, context);
      
      if (lunchSlot.success) {
        const restaurants = await toolRegistry.execute('search_restaurants', {
          mealType: 'lunch',
          radius: 1000
        }, context);
        
        // Add top restaurant
      }
    }
  }
  
  // Generate todos for the trip
  await toolRegistry.execute('create_todos', {
    scope: 'trip'
  }, context);
}
```

## Best Practices

### 1. Context Building
Always build a complete context for tools to work properly:

```typescript
function buildToolContext(trip: Trip, user: User): ToolContext {
  return {
    userId: user.id,
    user,
    trip,
    tripDays: trip.days || [],
    preferences: user.preferences,
    currentDate: new Date().toISOString().split('T')[0],
    weather: null, // Load if needed
    budget: calculateBudget(trip)
  };
}
```

### 2. Error Handling
Always handle tool execution errors:

```typescript
const result = await toolRegistry.execute(toolId, params, context);

if (!result.success) {
  // Handle specific errors
  if (result.error.includes('No trip days')) {
    // Prompt to create days
  } else {
    // Generic error handling
  }
}
```

### 3. Caching Results
Cache expensive operations:

```typescript
const cacheKey = `activities_${location.lat}_${location.lng}_${query}`;
const cached = cache.get(cacheKey);

if (cached) return cached;

const result = await toolRegistry.execute('search_activities', params, context);
if (result.success) {
  cache.set(cacheKey, result, 300); // 5 minutes
}
```

### 4. Type Safety
Use TypeScript for type-safe tool usage:

```typescript
import { ToolResult, ActivityResult } from '@/lib/ai/tools/types';

async function searchActivities(): Promise<ToolResult<ActivityResult[]>> {
  return toolRegistry.execute('search_activities', params, context);
}
```

## Integration Ideas

### Mobile App
```typescript
// Expose tools via API for mobile app
app.post('/api/v1/tools/:toolId', authenticate, async (req, res) => {
  const { toolId } = req.params;
  const { params } = req.body;
  
  const context = await buildMobileContext(req.user);
  const result = await toolRegistry.execute(toolId, params, context);
  
  res.json(result);
});
```

### Webhooks
```typescript
// Trigger tools via webhooks
app.post('/webhooks/calendar', async (req, res) => {
  const { event, tripId } = req.body;
  
  if (event.type === 'day_before_trip') {
    // Generate last-minute todos
    await toolRegistry.execute('create_todos', {
      scope: 'pre_departure',
      urgency: 'high'
    }, context);
  }
});
```

### Background Jobs
```typescript
// Use tools in background jobs
cron.schedule('0 9 * * *', async () => {
  const upcomingTrips = await getTripsStartingTomorrow();
  
  for (const trip of upcomingTrips) {
    // Check weather for all activities
    await toolRegistry.execute('weather_filter', {
      date: trip.startDate
    }, buildContext(trip));
    
    // Send notifications if needed
  }
});
```

## Testing Tools

```typescript
// tests/tools/find-time-slots.test.ts
import { toolRegistry } from '@/lib/ai/tools';
import { mockContext, mockTripDay } from '../mocks';

describe('find_time_slots tool', () => {
  it('should find available slots avoiding meal times', async () => {
    const context = {
      ...mockContext,
      tripDays: [{
        ...mockTripDay,
        activities: [
          { time: '10:00', duration: 120, name: 'Museum Visit' }
        ]
      }]
    };
    
    const result = await toolRegistry.execute('find_time_slots', {
      date: '2025-07-31',
      duration: 90,
      preferences: { avoidMealTimes: true }
    }, context);
    
    expect(result.success).toBe(true);
    expect(result.data.availableSlots).toHaveLength(5);
    expect(result.data.bestSlot).toBeDefined();
  });
});
```

## Summary

The travel tools system provides:
- **Reusable business logic** across the entire application
- **Consistent interfaces** for all planning operations
- **Type safety** with TypeScript
- **Flexible integration** options
- **Easy testing** and maintenance

By using these tools throughout your application, you ensure consistent behavior and can easily update planning logic in one place.