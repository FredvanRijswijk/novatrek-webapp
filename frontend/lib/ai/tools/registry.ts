import { TravelTool, ToolContext, ToolResult, ToolRegistry as IToolRegistry } from './types';

export class ToolRegistry implements IToolRegistry {
  private tools = new Map<string, TravelTool>();
  private toolCategories = new Map<string, Set<string>>();

  register(tool: TravelTool): void {
    this.tools.set(tool.id, tool);
    
    // Add to category index
    if (!this.toolCategories.has(tool.category)) {
      this.toolCategories.set(tool.category, new Set());
    }
    this.toolCategories.get(tool.category)!.add(tool.id);
  }

  get(toolId: string): TravelTool | undefined {
    return this.tools.get(toolId);
  }

  getByCategory(category: string): TravelTool[] {
    const toolIds = this.toolCategories.get(category) || new Set();
    return Array.from(toolIds)
      .map(id => this.tools.get(id))
      .filter((tool): tool is TravelTool => tool !== undefined);
  }

  getAvailableTools(context: ToolContext): TravelTool[] {
    const availableTools: TravelTool[] = [];
    
    for (const tool of this.tools.values()) {
      // Check auth requirements
      if (tool.requiresAuth && !context.userId) {
        continue;
      }
      
      // Check subscription requirements
      if (tool.requiresSubscription) {
        const userSubscription = context.user?.subscriptionTier || 'free';
        if (tool.requiresSubscription === 'premium' && userSubscription === 'free') {
          continue;
        }
        if (tool.requiresSubscription === 'expert' && userSubscription !== 'expert') {
          continue;
        }
      }
      
      availableTools.push(tool);
    }
    
    return availableTools;
  }

  async execute(
    toolId: string, 
    params: any, 
    context: ToolContext
  ): Promise<ToolResult> {
    const tool = this.tools.get(toolId);
    
    if (!tool) {
      return {
        success: false,
        error: `Tool ${toolId} not found`
      };
    }
    
    // Validate parameters
    try {
      const validatedParams = tool.parameters.parse(params);
      
      // Execute with error handling
      try {
        const result = await tool.execute(validatedParams, context);
        return result;
      } catch (error) {
        console.error(`Error executing tool ${toolId}:`, error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Tool execution failed'
        };
      }
    } catch (validationError) {
      return {
        success: false,
        error: `Invalid parameters: ${validationError}`
      };
    }
  }

  // Helper method to get all tools for AI model
  getToolDefinitions() {
    return Array.from(this.tools.values()).map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.id,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters.shape,
          required: Object.keys(tool.parameters.shape).filter(
            key => !tool.parameters.shape[key].isOptional()
          )
        }
      }
    }));
  }
}

// Global registry instance
export const toolRegistry = new ToolRegistry();