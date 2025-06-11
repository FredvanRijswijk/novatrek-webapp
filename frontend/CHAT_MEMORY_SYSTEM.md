# Chat Memory System

## Overview
The Chat Memory System allows users to save and organize important information from their trip planning conversations. It provides a searchable, categorized repository of recommendations, tips, bookings, notes, and places.

## Features

### 1. Memory Types
- **🟡 Recommendations**: AI-suggested activities, restaurants, or experiences
- **🔵 Tips**: Travel advice and local insights
- **🟢 Bookings**: Important booking information and confirmations
- **🟣 Notes**: Personal reminders and planning notes
- **🔴 Places**: Specific locations to remember

### 2. Save from Chat
- **One-Click Save**: "Save to memory" button on all assistant messages
- **Auto-Categorization**: System automatically detects memory type from content
- **Smart Tagging**: Automatic tag extraction (restaurant, activity, transport, etc.)
- **Context Preservation**: Saves message with timestamp and day reference

### 3. Memory Management
- **Search**: Full-text search across titles, content, and tags
- **Filters**: Filter by type, day, or tags
- **Pin Important**: Pin memories to keep them at the top
- **Edit/Delete**: Full control over saved memories
- **Manual Add**: Create memories directly without chat

### 4. Organization
- **Day Association**: Link memories to specific trip days
- **Tag System**: Automatic and manual tagging
- **Visual Indicators**: Icons and colors for quick recognition
- **Chronological Order**: Recent memories appear first (pinned always on top)

## Integration with Chat

### Saving from Chat
```typescript
// Click "Save to memory" button on any assistant message
// System automatically:
// 1. Extracts a title from the first line
// 2. Determines memory type from content
// 3. Generates relevant tags
// 4. Associates with current day (if applicable)
```

### Using Memories in Chat
```typescript
// Click any memory in the Memories tab
// It automatically:
// 1. Switches back to chat tab
// 2. Populates input with memory context
// 3. Allows you to ask follow-up questions
```

## Implementation Details

### Data Model
```typescript
interface ChatMemory {
  id: string;
  tripId: string;
  tripRef: DocumentReference;
  userRef: DocumentReference;
  type: 'recommendation' | 'tip' | 'booking' | 'note' | 'place';
  title: string;
  content: string;
  metadata: {
    day?: number;
    category?: string;
    placeId?: string;
    tags: string[];
    source?: {
      messageId?: string;
      timestamp?: Date;
    };
  };
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Auto-Tagging System
The system automatically generates tags based on content:
- **restaurant**: Food-related content
- **activity**: Tours, museums, attractions
- **transport**: Travel between locations
- **accommodation**: Hotels, stays
- **shopping**: Markets, souvenirs
- **tip**: Advice and recommendations
- **warning**: Things to avoid
- **budget**: Cost-related information

### Security
- Users can only access memories for their own trips
- Firestore rules ensure data privacy
- References use DocumentReference for consistency

## User Experience

### Workflow Example
1. **During Planning**: Chat with AI about restaurants in Paris
2. **Save Important Info**: Click "Save to memory" on restaurant recommendations
3. **Continue Planning**: Move to next day's activities
4. **Recall Later**: Open Memories tab, filter by "restaurant" tag
5. **Use in Context**: Click memory to ask for directions or reservations

### Visual Design
- Clean card-based layout
- Color-coded by type for quick scanning
- Compact view with expandable details
- Responsive design for mobile use

## Benefits

1. **Never Lose Important Info**: All valuable suggestions saved in one place
2. **Context Preservation**: Remember why something was recommended
3. **Quick Access**: Find saved information without scrolling through chat
4. **Trip Documentation**: Build a personalized travel guide
5. **Sharing Ready**: Export memories for travel companions

## Future Enhancements
- [ ] Export memories as PDF/document
- [ ] Share memories with trip companions
- [ ] Add photos to memories
- [ ] Voice notes attachment
- [ ] Location-based memory reminders
- [ ] Integration with calendar
- [ ] Collaborative memory boards