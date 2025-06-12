import { toolRegistry } from './registry';

// Search tools
import { activitySearchTool } from './search/activity-search';
import { restaurantSearchTool } from './search/restaurant-search';

// Planning tools
import { addActivityTool } from './planning/add-activity';
import { addActivityOptimizedTool } from './planning/add-activity-optimized';
import { addActivityV2Tool } from './planning/add-activity-v2';
import { createTodosTool } from './planning/create-todos';
import { findTimeSlotsTool } from './planning/find-time-slots';
import { weatherFilterTool } from './planning/weather-filter';
import { createTripDaysTool } from './planning/create-trip-days';
import { createTripDaysV2Tool } from './planning/create-trip-days-v2';
import { viewItineraryTool } from './planning/view-itinerary';
import { viewItineraryV2Tool } from './planning/view-itinerary-v2';
import { cleanupTripDaysTool } from './planning/cleanup-trip-days';

// Booking tools
import { createBookingRemindersTool } from './booking/create-booking-reminders';

// Group tools
import { aggregatePreferencesTool } from './group/aggregate-preferences';
import { groupActivitySearchTool } from './group/group-activity-search';

// Register all tools
export function registerAllTools() {
  // Search tools
  toolRegistry.register(activitySearchTool);
  toolRegistry.register(restaurantSearchTool);
  
  // Planning tools - Using V2 subcollection structure
  toolRegistry.register(addActivityV2Tool); // V2 with subcollections
  toolRegistry.register(createTodosTool);
  toolRegistry.register(findTimeSlotsTool);
  toolRegistry.register(weatherFilterTool);
  toolRegistry.register(createTripDaysV2Tool); // V2 with subcollections
  toolRegistry.register(viewItineraryV2Tool); // V2 with subcollections
  // Removed cleanup tool - not needed with V2 structure
  
  // Booking tools
  toolRegistry.register(createBookingRemindersTool);
  
  // Group tools
  toolRegistry.register(aggregatePreferencesTool);
  toolRegistry.register(groupActivitySearchTool);
  
  // More tools will be added here
  console.log(`Registered ${toolRegistry.getToolDefinitions().length} tools`);
}

// Export registry and types
export { toolRegistry } from './registry';
export type { 
  TravelTool, 
  ToolContext, 
  ToolResult,
  SearchResult,
  ActivityResult,
  RestaurantResult
} from './types';