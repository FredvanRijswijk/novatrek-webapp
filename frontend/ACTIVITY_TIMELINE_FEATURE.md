# Activity Timeline Feature

## Overview
The Activity Timeline provides a visual representation of daily activities in the trip planning interface. It helps users quickly understand their schedule, identify free time slots, and spot potential conflicts.

## Features

### 1. Visual Timeline
- **Time Range**: 6 AM to 11 PM daily view
- **Hour Markers**: Clear hour labels with grid lines
- **Responsive**: Scrollable and mobile-friendly

### 2. Activity Visualization
- **Duration Blocks**: Height represents activity duration
- **Color Coding**: Different colors for activity types
  - 🔵 Blue: Sightseeing
  - 🟢 Green: Dining  
  - 🟣 Purple: Shopping
  - 🟠 Orange: Entertainment
  - 🔴 Red: Transport
  - ⚫ Gray: Other

### 3. Interactive Elements
- **Click Activities**: Opens edit dialog
- **Click Free Slots**: Suggests activities for that time
- **Hover Effects**: Shows detailed information
- **Drag Handles**: Visual indicator (drag-drop ready for future implementation)

### 4. Smart Features
- **Conflict Detection**: Red outline on overlapping activities
- **Meal Indicators**: Subtle zones for breakfast (7-9 AM), lunch (12-2 PM), dinner (6-9 PM)
- **Current Time**: Red line indicator (when viewing today)
- **Free Time Display**: Shows duration and click to add activities

### 5. Integration with Chat
The timeline is integrated as a tab in the TripChat component:
- **Tab Switch**: Easy toggle between Chat and Timeline views
- **Day Selector**: Navigate between different days of the trip
- **Smart Actions**: Clicking timeline elements populates chat prompts

## Usage

### In Trip Planning Chat
```typescript
// The timeline is automatically included in TripChat
<TripChat trip={trip} onUpdate={onUpdate} />
```

### Standalone Component
```typescript
import { ActivityTimeline } from '@/components/trips/planning/ActivityTimeline';

<ActivityTimeline
  dayContext={dayContext}
  onAddActivity={(timeSlot) => {
    // Handle adding activity to time slot
    console.log(`Add activity from ${timeSlot.start} to ${timeSlot.end}`);
  }}
  onEditActivity={(activity) => {
    // Handle editing existing activity
    console.log(`Edit activity: ${activity.name}`);
  }}
/>
```

## Implementation Details

### Component Structure
```
ActivityTimeline.tsx
├── Timeline Grid (6 AM - 11 PM)
├── Activity Blocks (positioned by time)
├── Free Time Slots (clickable areas)
├── Meal Zone Indicators
├── Current Time Line
└── Summary Footer
```

### Props Interface
```typescript
interface ActivityTimelineProps {
  dayContext: DayContext;
  onAddActivity: (timeSlot: TimeSlot) => void;
  onEditActivity: (activity: Activity) => void;
}
```

### Time Calculations
- Activities positioned using CSS `top` based on start time
- Height calculated from duration (1 minute = 1 pixel)
- Free slots calculated from gaps between activities

## User Experience

### Visual Hierarchy
1. **Activities**: Prominent colored blocks with icons
2. **Free Time**: Dashed borders, less prominent
3. **Conflicts**: Red ring animation draws attention
4. **Current Time**: Subtle but visible red line

### Interactions
- **Hover**: Tooltips with full details
- **Click**: Context-appropriate actions
- **Visual Feedback**: Smooth transitions and animations

## Future Enhancements
- [ ] Drag-and-drop to reschedule activities
- [ ] Multi-day view option
- [ ] Weather overlay on activities
- [ ] Real-time collaboration indicators
- [ ] Activity grouping/categories
- [ ] Export timeline as image/PDF
- [ ] Integration with calendar apps

## Demo
View the timeline demo at: `/dashboard/trips/timeline-demo`

This provides a fully interactive example with sample data showing all features including conflicts, free time slots, and meal indicators.