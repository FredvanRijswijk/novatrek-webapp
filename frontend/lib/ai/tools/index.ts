import { toolRegistry } from './registry';

// Search tools
import { activitySearchTool } from './search/activity-search';
import { restaurantSearchTool } from './search/restaurant-search';

// Planning tools
import { addActivityTool } from './planning/add-activity';
import { createTodosTool } from './planning/create-todos';

// Register all tools
export function registerAllTools() {
  // Search tools
  toolRegistry.register(activitySearchTool);
  toolRegistry.register(restaurantSearchTool);
  
  // Planning tools
  toolRegistry.register(addActivityTool);
  toolRegistry.register(createTodosTool);
  
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