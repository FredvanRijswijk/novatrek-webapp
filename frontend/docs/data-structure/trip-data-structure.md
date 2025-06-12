# NovaTrek Trip Data Structure

## Overview
This document describes how trip data is stored in Firestore for the NovaTrek application. All dates are normalized to `YYYY-MM-DD` format for consistency.

## Main Collections

### 1. `trips` Collection
The core collection storing all trip information.

```javascript
{
  "tripId": {
    // === Core Information ===
    "id": "qx0CukmIgK35G29crI20",
    "title": "Summer Europe Adventure",
    "name": "My Amazing Trip",
    "description": "A wonderful journey through Europe",
    "status": "planning", // planning | active | completed
    
    // === User References ===
    "userId": "user123", // Legacy field
    "userRef": DocumentReference("/users/user123"), // New enhanced field
    
    // === Dates (Normalized to YYYY-MM-DD) ===
    "startDate": "2025-07-30",
    "endDate": "2025-07-31", 
    "createdAt": Timestamp, // Firestore Timestamp
    "updatedAt": Timestamp,
    
    // === Destinations ===
    // Single destination (legacy support)
    "destination": { /* destination object */ },
    
    // Multi-destination array (preferred)
    "destinations": [{
      "destination": {
        "id": "ChIJd8BlQ2BZwokRjMKtTjMezRw",
        "name": "New York City",
        "country": "United States",
        "coordinates": { "lat": 40.7128, "lng": -74.0060 },
        "timeZone": "America/New_York",
        "currency": "USD",
        "language": ["English"]
      },
      "arrivalDate": "2025-07-30",
      "departureDate": "2025-07-31",
      "notes": "Starting point"
    }],
    
    // === Travelers ===
    "travelers": [{
      "id": "traveler1",
      "name": "John Doe",
      "email": "john@example.com",
      "relationship": "self" // self | partner | family | friend
    }],
    
    // === Budget ===
    "budget": {
      "total": 5000,
      "currency": "USD",
      "breakdown": {
        "accommodation": 1500,
        "activities": 1000,
        "food": 800,
        "transport": 700,
        "shopping": 500,
        "other": 500
      }
    },
    
    // === MAIN ITINERARY ARRAY ===
    "itinerary": [/* See Day Structure below */],
    
    // === Additional Fields ===
    "expenses": [], // Manual expense tracking
    "aiRecommendations": [], // AI-generated suggestions
    "sharedWith": [], // Email addresses for sharing
    "shareToken": "abc123xyz",
    "isPublic": false
  }
}
```

### 2. Day Structure (within `itinerary` array)

```javascript
{
  "id": "day-1-1234567890",
  "dayNumber": 1,
  "date": "2025-07-30", // Always normalized to YYYY-MM-DD
  "destinationId": "ChIJd8BlQ2BZwokRjMKtTjMezRw",
  "notes": "First day in NYC",
  
  // === Activities Array ===
  "activities": [{
    "id": "act-1234567890-abc",
    "name": "Statue of Liberty Tour",
    "description": "Visit the iconic statue",
    "type": "sightseeing", // sightseeing|dining|activity|transport|accommodation|other
    
    // Location
    "location": {
      "lat": 40.6892,
      "lng": -74.0445,
      "address": "Liberty Island, New York, NY"
    },
    
    // Time fields (multiple formats for compatibility)
    "time": "09:00",        // Simple time
    "startTime": "09:00",   // Start time
    "endTime": "12:00",     // End time
    "duration": 180,        // Duration in minutes
    
    // Cost
    "cost": {
      "amount": 25,
      "currency": "USD",
      "perPerson": true
    },
    
    // Booking
    "bookingRequired": true,
    "bookingUrl": "https://example.com/book",
    "confirmationNumber": "ABC123",
    
    // Enhanced fields (added by AI)
    "novatrekEnhanced": true,
    "expertRecommended": true,
    "addedAt": "2024-12-06T14:00:00.000Z",
    "travelTime": 30, // Minutes from previous activity
    "weather": {
      "temperature": 22,
      "conditions": "clear",
      "suitable": true
    },
    
    // Additional metadata
    "photos": ["url1", "url2"],
    "tags": ["photography", "historic", "must-see"],
    "rating": 4.5,
    "price": 25,
    "category": "sightseeing"
  }],
  
  // === Accommodations Array ===
  "accommodations": [{
    "id": "acc_hotel_123",
    "name": "Grand Hotel NYC",
    "type": "hotel", // hotel|airbnb|hostel|other
    "location": {
      "name": "Grand Hotel",
      "address": "123 5th Avenue, New York, NY",
      "coordinates": { "lat": 40.7580, "lng": -73.9855 }
    },
    "checkIn": "2025-07-30",
    "checkOut": "2025-07-31",
    "cost": 200,
    "currency": "USD",
    "confirmationNumber": "HTL123456",
    "amenities": ["wifi", "breakfast", "gym"],
    "rating": 4.5
  }],
  
  // === Transportation Array ===
  "transportation": [{
    "id": "transport_123",
    "type": "flight", // flight|train|bus|car|ferry|other
    "from": "JFK Airport",
    "to": "Manhattan",
    "departureTime": "14:00",
    "arrivalTime": "15:00",
    "cost": 50,
    "confirmationNumber": "TRN123"
  }]
}
```

### 3. Related Collections

#### `users`
```javascript
{
  "userId": {
    "email": "user@example.com",
    "displayName": "John Doe",
    "photoURL": "https://...",
    "subscriptionTier": "free", // free|premium|expert
    "createdAt": Timestamp
  }
}
```

#### `travelPreferences`
```javascript
{
  "userId": {
    "travelStyle": ["adventure", "cultural"],
    "accommodationType": ["hotel", "airbnb"],
    "budgetLevel": "moderate", // budget|moderate|luxury
    "interests": ["history", "food", "nature"],
    "dietaryRestrictions": ["vegetarian"],
    "pace": "moderate" // slow|moderate|fast
  }
}
```

#### `chat_sessions`
```javascript
{
  "sessionId": {
    "tripId": "qx0CukmIgK35G29crI20",
    "userId": "user123",
    "tripRef": DocumentReference("/trips/tripId"),
    "userRef": DocumentReference("/users/userId"),
    "title": "Trip Planning Chat",
    "lastMessage": "Added Statue of Liberty tour",
    "messageCount": 25,
    "createdAt": Timestamp,
    "updatedAt": Timestamp
  }
}
```

#### `chat_messages`
```javascript
{
  "messageId": {
    "sessionId": "sessionId",
    "role": "user", // user|assistant
    "content": "Add a tour of the Statue of Liberty",
    "timestamp": Timestamp,
    
    // For assistant messages with tool calls
    "toolCalls": [{
      "toolName": "add_activity",
      "arguments": { /* tool arguments */ },
      "result": { /* tool result */ }
    }]
  }
}
```

## Key Points

1. **Date Normalization**: All dates are stored as `YYYY-MM-DD` strings for consistency
2. **Document References**: Enhanced models use Firebase DocumentReferences for relationships
3. **Nested Structure**: The main trip document contains the entire itinerary as a nested array
4. **No Subcollections for Days**: Days are stored in the `itinerary` array, not as separate documents
5. **Activity IDs**: Generated with pattern `act-{timestamp}-{random}` for uniqueness
6. **Time Fields**: Activities support multiple time formats for compatibility
7. **AI Enhancement**: Fields like `novatrekEnhanced` track AI-added content

## Data Flow

1. **Create Trip** → Creates main trip document with empty itinerary
2. **Add Day** → Adds object to itinerary array
3. **Add Activity** → Updates specific day in itinerary array
4. **AI Chat** → Reads trip, modifies itinerary, saves back
5. **Real-time Updates** → Firestore listeners on trip document

## Performance Considerations

- Single document reads for entire trip (efficient)
- Array updates require reading/writing entire itinerary
- Maximum document size: 1MB (plenty for typical trips)
- Real-time listeners update UI automatically

## Security

- Users can only access trips where `userId` or `userRef` matches
- Firestore rules enforce ownership checks
- Shared trips use `sharedWith` array for access control