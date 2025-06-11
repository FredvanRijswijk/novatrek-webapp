# Trip Chat Refactoring Plan: From JSON Parsing to Tool Calling

## Current Implementation Problems

### 1. **Complex JSON Parsing**
- AI returns activities/hotels embedded in markdown code blocks
- Fragile regex parsing: `/```json\n([\s\S]*?)(\n```|$)/`
- Manual JSON repair attempts (closing brackets, removing commas)
- Users can't see or interact with results until JSON is parsed correctly

### 2. **Poor User Experience**
- Users must expand messages and manually select activities
- Hotels aren't clearly differentiated from activities
- No visual confirmation of what will be added
- Error-prone process with unclear feedback

### 3. **Limited Functionality**
- Can't search Google Places directly from chat
- Can't modify activities inline
- No real-time validation or conflict checking
- No direct booking or reservation capabilities

## Proposed Solution: Vercel AI SDK with Tool Calling

### Architecture Overview

```typescript
// New structure using AI SDK
const { messages, append, reload, stop, isLoading, input, setInput } = useChat({
  api: '/api/chat/trip-planning',
  initialMessages: [],
  body: {
    tripId: trip.id,
    tripContext: enhancedContext,
    userPreferences: preferences
  },
  onToolCall: async ({ toolCall }) => {
    // Handle tool calls with proper UI feedback
  }
});
```

### Tool Definitions

#### 1. **Search Hotels Tool**
```typescript
{
  name: 'search_hotels',
  description: 'Search for hotels in a specific location',
  parameters: z.object({
    location: z.string(),
    checkIn: z.string(),
    checkOut: z.string(),
    priceRange: z.object({
      min: z.number().optional(),
      max: z.number().optional()
    }),
    amenities: z.array(z.string()).optional(),
    rating: z.number().min(1).max(5).optional()
  })
}
```

#### 2. **Search Activities Tool**
```typescript
{
  name: 'search_activities',
  description: 'Search for activities and attractions',
  parameters: z.object({
    location: z.string(),
    activityType: z.enum(['sightseeing', 'dining', 'shopping', 'outdoor', 'cultural']),
    date: z.string(),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening']).optional(),
    duration: z.number().optional(),
    budget: z.number().optional()
  })
}
```

#### 3. **Add to Itinerary Tool**
```typescript
{
  name: 'add_to_itinerary',
  description: 'Add an activity or accommodation to the trip',
  parameters: z.object({
    type: z.enum(['activity', 'accommodation']),
    dayNumber: z.number(),
    item: z.object({
      name: z.string(),
      description: z.string(),
      location: z.object({
        address: z.string(),
        coordinates: z.object({
          lat: z.number(),
          lng: z.number()
        })
      }),
      // Activity-specific fields
      startTime: z.string().optional(),
      duration: z.number().optional(),
      // Accommodation-specific fields
      checkIn: z.date().optional(),
      checkOut: z.date().optional(),
      // Common fields
      cost: z.object({
        amount: z.number(),
        currency: z.string(),
        perPerson: z.boolean().optional()
      }).optional()
    })
  })
}
```

#### 4. **Check Availability Tool**
```typescript
{
  name: 'check_availability',
  description: 'Check time conflicts and availability',
  parameters: z.object({
    dayNumber: z.number(),
    startTime: z.string(),
    duration: z.number()
  })
}
```

### UI Components for Tool Results

#### 1. **Hotel Search Results Component**
```tsx
function HotelSearchResults({ results, onSelect }) {
  return (
    <div className="grid gap-4 my-4">
      {results.map(hotel => (
        <Card key={hotel.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{hotel.name}</h4>
              <p className="text-sm text-muted-foreground">{hotel.address}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge>{hotel.rating} ⭐</Badge>
                <span className="text-sm">${hotel.pricePerNight}/night</span>
              </div>
            </div>
            <Button onClick={() => onSelect(hotel)}>
              Add to Trip
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

#### 2. **Activity Preview Component**
```tsx
function ActivityPreview({ activity, onConfirm, onEdit }) {
  return (
    <Card className="p-4 my-2 border-primary/50">
      <div className="space-y-2">
        <h4 className="font-medium">{activity.name}</h4>
        <p className="text-sm text-muted-foreground">{activity.description}</p>
        <div className="flex items-center gap-4 text-sm">
          <span>📍 {activity.location.name}</span>
          <span>🕐 {activity.startTime} ({activity.duration}min)</span>
          <span>💵 ${activity.cost?.amount}</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onConfirm}>Confirm</Button>
          <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
        </div>
      </div>
    </Card>
  );
}
```

### Implementation Steps

#### Phase 1: API Route Setup
1. Create `/api/chat/trip-planning/route.ts` with tool definitions
2. Implement tool handlers for each function
3. Add proper error handling and validation
4. Integrate with existing Google Places API

#### Phase 2: Frontend Integration
1. Replace current TripChat with new AI SDK implementation
2. Create tool result components
3. Implement real-time UI updates during tool calls
4. Add loading states and error handling

#### Phase 3: Enhanced Features
1. Add inline editing for activities
2. Implement drag-and-drop reordering
3. Add conflict detection visualization
4. Create booking/reservation integrations

### Benefits

1. **Better UX**
   - Real-time visual feedback
   - No JSON parsing errors
   - Direct interaction with results
   - Clear hotel vs. activity distinction

2. **Improved Reliability**
   - Structured tool calls instead of text parsing
   - Type-safe parameters
   - Proper error handling
   - Validation before saving

3. **Enhanced Functionality**
   - Direct Google Places integration
   - Real-time availability checking
   - Inline editing capabilities
   - Future booking integrations

### Migration Strategy

1. **Keep existing chat as fallback**
2. **Add feature flag for new implementation**
3. **Gradual rollout to users**
4. **Monitor usage and feedback**
5. **Remove old implementation after validation**

### Example User Flow

```
User: "Find hotels in Rome for my trip"

AI: [Calls search_hotels tool]
    "I'm searching for hotels in Rome for your dates..."
    
[Shows HotelSearchResults component with 5 hotels]

User: [Clicks "Add to Trip" on a hotel]

AI: [Calls add_to_itinerary tool]
    "Great! I've added Hotel Artemide to your trip. It's located near Termini Station
    with easy access to major attractions. Would you like me to find activities nearby?"

User: "Yes, what's within walking distance?"

AI: [Calls search_activities tool with hotel location]
    [Shows activity results in a visual grid]
```

This approach transforms the chat from a text-based JSON parser to an interactive travel planning assistant with proper visual components and direct action capabilities.