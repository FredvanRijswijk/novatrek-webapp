# Google Calendar Integration Plan

## Overview

This document outlines the plan to integrate Google Calendar with NovaTrek's trip planning features, allowing users to sync their itineraries with their personal calendars.

## Features

### 1. Export to Google Calendar
- One-click export of entire trip itinerary
- Individual activity export
- Automatic updates when itinerary changes

### 2. Import from Google Calendar
- Import existing events as trip activities
- Detect conflicts with personal calendar
- Suggest optimal times based on free slots

### 3. Two-way Sync
- Real-time updates between NovaTrek and Google Calendar
- Conflict resolution
- Change notifications

## Technical Implementation

### 1. Google Calendar API Setup

```typescript
// lib/google/calendar-client.ts
import { google } from 'googleapis';

export class GoogleCalendarClient {
  private oauth2Client;
  private calendar;

  constructor(accessToken: string) {
    this.oauth2Client = new google.auth.OAuth2();
    this.oauth2Client.setCredentials({ access_token: accessToken });
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  async createEvent(activity: Activity, tripDay: TripDay) {
    const event = {
      summary: activity.name,
      location: activity.location.address,
      description: this.buildDescription(activity),
      start: {
        dateTime: this.buildDateTime(tripDay.date, activity.time),
        timeZone: 'Europe/Berlin', // From trip destination
      },
      end: {
        dateTime: this.buildDateTime(tripDay.date, activity.endTime),
        timeZone: 'Europe/Berlin',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
        ],
      },
      colorId: this.getColorForActivity(activity),
      extendedProperties: {
        private: {
          novatrekId: activity.id,
          tripId: tripDay.tripId,
          activityType: activity.category
        }
      }
    };

    return this.calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
  }

  async updateEvent(eventId: string, activity: Activity) {
    // Update existing calendar event
  }

  async deleteEvent(eventId: string) {
    // Delete calendar event
  }

  async getFreeBusy(timeMin: string, timeMax: string) {
    return this.calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: 'primary' }]
      }
    });
  }

  private buildDescription(activity: Activity): string {
    let description = activity.description || '';
    
    if (activity.notes) {
      description += `\n\nNotes: ${activity.notes}`;
    }
    
    if (activity.bookingUrl) {
      description += `\n\nBooking: ${activity.bookingUrl}`;
    }
    
    if (activity.phoneNumber) {
      description += `\n\nPhone: ${activity.phoneNumber}`;
    }
    
    description += `\n\n🗺️ View in NovaTrek: https://novatrek.app/trip/${activity.tripId}/day/${activity.dayId}`;
    
    return description;
  }

  private getColorForActivity(activity: Activity): string {
    const colorMap = {
      restaurant: '5', // Yellow
      activity: '7',   // Blue
      transport: '11', // Red
      accommodation: '10', // Green
      shopping: '6',   // Orange
    };
    
    return colorMap[activity.category] || '7';
  }
}
```

### 2. Calendar Sync Tool

```typescript
// lib/ai/tools/calendar/sync-calendar.ts
import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult } from '../types';
import { GoogleCalendarClient } from '@/lib/google/calendar-client';

const syncCalendarParams = z.object({
  action: z.enum(['export', 'import', 'sync']),
  scope: z.enum(['trip', 'day', 'activity']).optional(),
  targetDate: z.string().optional(),
  activityId: z.string().optional(),
  calendarId: z.string().default('primary')
});

export const syncCalendarTool: TravelTool<z.infer<typeof syncCalendarParams>, any> = {
  id: 'sync_calendar',
  name: 'Sync with Google Calendar',
  description: 'Export trip activities to Google Calendar or import calendar events',
  category: 'utility',
  parameters: syncCalendarParams,
  requiresAuth: true,
  
  async execute(params, context) {
    const { action, scope = 'trip', targetDate, activityId } = params;
    
    // Get user's Google access token
    const accessToken = await getUserGoogleToken(context.userId);
    if (!accessToken) {
      return {
        success: false,
        error: 'Google Calendar not connected. Please connect your Google account first.'
      };
    }
    
    const client = new GoogleCalendarClient(accessToken);
    
    switch (action) {
      case 'export':
        return exportToCalendar(client, context, scope, targetDate, activityId);
      
      case 'import':
        return importFromCalendar(client, context, targetDate);
      
      case 'sync':
        return performTwoWaySync(client, context);
      
      default:
        return { success: false, error: 'Invalid action' };
    }
  }
};

async function exportToCalendar(
  client: GoogleCalendarClient,
  context: ToolContext,
  scope: string,
  targetDate?: string,
  activityId?: string
) {
  const results = [];
  
  if (scope === 'activity' && activityId) {
    // Export single activity
    const activity = findActivity(context.tripDays, activityId);
    if (activity) {
      const result = await client.createEvent(activity.activity, activity.day);
      results.push({
        activity: activity.activity.name,
        eventId: result.data.id,
        link: result.data.htmlLink
      });
    }
  } else if (scope === 'day' && targetDate) {
    // Export all activities for a day
    const tripDay = context.tripDays.find(d => 
      d.date.split('T')[0] === targetDate
    );
    
    if (tripDay && tripDay.activities) {
      for (const activity of tripDay.activities) {
        const result = await client.createEvent(activity, tripDay);
        results.push({
          activity: activity.name,
          eventId: result.data.id,
          link: result.data.htmlLink
        });
      }
    }
  } else {
    // Export entire trip
    for (const day of context.tripDays) {
      if (day.activities) {
        for (const activity of day.activities) {
          const result = await client.createEvent(activity, day);
          results.push({
            activity: activity.name,
            date: day.date,
            eventId: result.data.id
          });
        }
      }
    }
  }
  
  return {
    success: true,
    data: {
      exported: results.length,
      events: results
    },
    metadata: {
      message: `Exported ${results.length} activities to Google Calendar`
    }
  };
}
```

### 3. Calendar Integration UI Component

```typescript
// components/calendar/CalendarSync.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Loader2, Check, AlertCircle } from 'lucide-react';
import { useGoogleAuth } from '@/hooks/use-google-auth';

export function CalendarSync({ tripId, tripDays }) {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const { isConnected, connect } = useGoogleAuth();
  
  const handleSync = async () => {
    if (!isConnected) {
      await connect(['https://www.googleapis.com/auth/calendar']);
      return;
    }
    
    setSyncing(true);
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          action: 'export',
          scope: 'trip'
        })
      });
      
      const result = await response.json();
      setSyncStatus(result);
    } catch (error) {
      setSyncStatus({ success: false, error: error.message });
    } finally {
      setSyncing(false);
    }
  };
  
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Sync
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Export your itinerary to Google Calendar
          </p>
        </div>
        
        <Button
          onClick={handleSync}
          disabled={syncing}
          variant={isConnected ? 'default' : 'outline'}
        >
          {syncing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : isConnected ? (
            'Sync to Calendar'
          ) : (
            'Connect Google Calendar'
          )}
        </Button>
      </div>
      
      {syncStatus && (
        <div className={`mt-4 p-3 rounded-lg ${
          syncStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {syncStatus.success ? (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>{syncStatus.data.exported} activities exported to calendar</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{syncStatus.error}</span>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium">Sync Options</h4>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded" />
          Automatically sync changes
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded" />
          Include travel time between activities
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded" />
          Add reminders 30 minutes before
        </label>
      </div>
    </Card>
  );
}
```

### 4. Free Time Detection

```typescript
// lib/calendar/free-time.ts
export async function findFreeTimeSlots(
  accessToken: string,
  date: string,
  duration: number
): Promise<TimeSlot[]> {
  const client = new GoogleCalendarClient(accessToken);
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const freeBusy = await client.getFreeBusy(
    startOfDay.toISOString(),
    endOfDay.toISOString()
  );
  
  const busySlots = freeBusy.data.calendars.primary.busy || [];
  const freeSlots = [];
  
  // Find gaps between busy slots
  let currentTime = startOfDay;
  
  for (const busy of busySlots) {
    const busyStart = new Date(busy.start);
    
    if (currentTime < busyStart) {
      const gap = (busyStart.getTime() - currentTime.getTime()) / (1000 * 60);
      
      if (gap >= duration) {
        freeSlots.push({
          start: currentTime.toISOString(),
          end: busyStart.toISOString(),
          duration: gap
        });
      }
    }
    
    currentTime = new Date(busy.end);
  }
  
  // Check remaining time until end of day
  if (currentTime < endOfDay) {
    const gap = (endOfDay.getTime() - currentTime.getTime()) / (1000 * 60);
    
    if (gap >= duration) {
      freeSlots.push({
        start: currentTime.toISOString(),
        end: endOfDay.toISOString(),
        duration: gap
      });
    }
  }
  
  return freeSlots;
}
```

### 5. Calendar Event Handler

```typescript
// app/api/calendar/webhook/route.ts
export async function POST(request: Request) {
  const { headers } = request;
  const channelId = headers.get('X-Goog-Channel-ID');
  const resourceId = headers.get('X-Goog-Resource-ID');
  
  // Handle calendar change notifications
  const change = await request.json();
  
  if (change.type === 'sync') {
    // Initial sync message
    return Response.json({ success: true });
  }
  
  // Look up the user and trip associated with this channel
  const subscription = await getCalendarSubscription(channelId);
  
  if (subscription) {
    // Fetch changed events
    const client = new GoogleCalendarClient(subscription.accessToken);
    const events = await client.getUpdatedEvents(subscription.syncToken);
    
    // Update NovaTrek activities based on calendar changes
    for (const event of events.items) {
      if (event.extendedProperties?.private?.novatrekId) {
        // This is a NovaTrek-created event
        await updateActivityFromCalendarEvent(event, subscription.tripId);
      }
    }
  }
  
  return Response.json({ success: true });
}
```

## Implementation Phases

### Phase 1: Basic Export (Week 1)
- [ ] Google OAuth setup
- [ ] Export single activity
- [ ] Export full trip
- [ ] Basic calendar event creation

### Phase 2: Import & Conflict Detection (Week 2)
- [ ] Import calendar events
- [ ] Detect busy times
- [ ] Find free slots
- [ ] Conflict warnings

### Phase 3: Two-way Sync (Week 3)
- [ ] Calendar webhooks
- [ ] Update activities from calendar
- [ ] Handle deletions
- [ ] Sync status tracking

### Phase 4: Advanced Features (Week 4)
- [ ] Travel time calculation
- [ ] Multi-calendar support
- [ ] Sharing with travel companions
- [ ] Calendar templates

## Security Considerations

1. **OAuth Scopes**
   - Only request necessary calendar permissions
   - Use incremental authorization

2. **Data Privacy**
   - Store minimal calendar data
   - Encrypt access tokens
   - Regular token refresh

3. **Rate Limiting**
   - Implement exponential backoff
   - Cache calendar data
   - Batch operations

## User Experience

1. **Onboarding**
   - Clear explanation of permissions
   - Preview of what will be synced
   - Easy disconnect option

2. **Sync Status**
   - Visual indicators for synced items
   - Conflict resolution UI
   - Sync history

3. **Notifications**
   - Calendar event reminders
   - Sync failure alerts
   - Change notifications

## Testing Strategy

1. **Unit Tests**
   - Calendar API mocking
   - Event transformation
   - Conflict detection

2. **Integration Tests**
   - OAuth flow
   - Event creation/updates
   - Webhook handling

3. **E2E Tests**
   - Full sync flow
   - Conflict scenarios
   - Error recovery