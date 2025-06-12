import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult } from '../types';

const createTodosParams = z.object({
  scope: z.enum(['all', 'bookings', 'preparation', 'daily']).default('all'),
  date: z.string().optional(),
  includeOptional: z.boolean().default(false)
});

interface TodoItem {
  id: string;
  task: string;
  category: 'booking' | 'preparation' | 'daily' | 'optional';
  priority: 'high' | 'medium' | 'low';
  deadline?: string;
  relatedActivity?: {
    id: string;
    name: string;
    date: string;
  };
  autoCompletable?: boolean;
  expertTip?: string;
}

export const createTodosTool: TravelTool<z.infer<typeof createTodosParams>, TodoItem[]> = {
  id: 'create_todos',
  name: 'Create Smart Todos',
  description: 'Generate intelligent todo list based on trip itinerary, bookings needed, and preparations',
  category: 'planning',
  parameters: createTodosParams,
  requiresAuth: true,
  
  async execute(params, context) {
    try {
      const todos: TodoItem[] = [];
      const { scope, date, includeOptional } = params;
      
      // 1. Analyze trip for booking needs
      if (scope === 'all' || scope === 'bookings') {
        const bookingTodos = generateBookingTodos(context);
        todos.push(...bookingTodos);
      }
      
      // 2. Generate preparation todos
      if (scope === 'all' || scope === 'preparation') {
        const prepTodos = generatePreparationTodos(context);
        todos.push(...prepTodos);
      }
      
      // 3. Generate daily todos if specific date
      if ((scope === 'all' || scope === 'daily') && date) {
        const dailyTodos = generateDailyTodos(context, date);
        todos.push(...dailyTodos);
      }
      
      // 4. Add optional enhancement todos
      if (includeOptional) {
        const optionalTodos = generateOptionalTodos(context);
        todos.push(...optionalTodos);
      }
      
      // Sort by priority and deadline
      const sortedTodos = todos.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (a.deadline && b.deadline) {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        return 0;
      });
      
      return {
        success: true,
        data: sortedTodos,
        metadata: {
          totalTodos: sortedTodos.length,
          highPriority: sortedTodos.filter(t => t.priority === 'high').length,
          autoCompletable: sortedTodos.filter(t => t.autoCompletable).length,
          suggestions: generateTodoSuggestions(sortedTodos, context)
        }
      };
    } catch (error) {
      console.error('Create todos error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create todos'
      };
    }
  }
};

function generateBookingTodos(context: ToolContext): TodoItem[] {
  const todos: TodoItem[] = [];
  const tripStartDate = new Date(context.trip.startDate);
  const now = new Date();
  
  // Check accommodation
  if (!context.trip.accommodation || context.trip.accommodation.length === 0) {
    todos.push({
      id: 'book-accommodation',
      task: 'Book accommodation for your trip',
      category: 'booking',
      priority: 'high',
      deadline: new Date(tripStartDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      expertTip: 'Book at least 30 days in advance for better rates and availability'
    });
  }
  
  // Check flights
  const destinations = context.trip.destinations || [];
  if (destinations.length > 1 || (destinations[0] && isInternationalDestination(destinations[0]))) {
    const hasFlights = context.tripDays.some(day => 
      day.activities?.some(a => a.category === 'flight' || a.category === 'transport')
    );
    
    if (!hasFlights) {
      todos.push({
        id: 'book-flights',
        task: 'Book flights for your trip',
        category: 'booking',
        priority: 'high',
        deadline: new Date(tripStartDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        expertTip: 'Book international flights 2-3 months in advance for best prices'
      });
    }
  }
  
  // Check activities that need booking
  context.tripDays.forEach(day => {
    day.activities?.forEach(activity => {
      if (activity.bookingRequired && !activity.bookingConfirmation) {
        const deadlineDays = getBookingDeadline(activity);
        todos.push({
          id: `book-${activity.id}`,
          task: `Book "${activity.name}" for ${formatDate(day.date)}`,
          category: 'booking',
          priority: activity.expertRecommended ? 'high' : 'medium',
          deadline: new Date(new Date(day.date).getTime() - deadlineDays * 24 * 60 * 60 * 1000).toISOString(),
          relatedActivity: {
            id: activity.id,
            name: activity.name,
            date: day.date
          },
          autoCompletable: !!activity.bookingUrl,
          expertTip: activity.expertRecommended 
            ? 'This expert-recommended activity books up quickly!'
            : undefined
        });
      }
    });
  });
  
  // Restaurant reservations for dinner
  context.tripDays.forEach(day => {
    const dinnerTime = day.activities?.find(a => 
      a.category === 'restaurant' && 
      timeToMinutes(a.time) >= 18 * 60
    );
    
    if (!dinnerTime) {
      todos.push({
        id: `dinner-${day.date}`,
        task: `Find and book dinner restaurant for ${formatDate(day.date)}`,
        category: 'booking',
        priority: 'low',
        deadline: new Date(new Date(day.date).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        expertTip: 'Use our restaurant search to find expert-recommended spots!'
      });
    }
  });
  
  return todos;
}

function generatePreparationTodos(context: ToolContext): TodoItem[] {
  const todos: TodoItem[] = [];
  const tripStartDate = new Date(context.trip.startDate);
  const destinations = context.trip.destinations || [];
  
  // Travel documents
  if (destinations.length > 0 && destinations.some(d => isInternationalDestination(d))) {
    todos.push({
      id: 'check-passport',
      task: 'Check passport expiration date (must be valid 6 months after travel)',
      category: 'preparation',
      priority: 'high',
      deadline: new Date(tripStartDate.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    todos.push({
      id: 'check-visa',
      task: `Check visa requirements for ${destinations.map(d => d.name || 'destination').join(', ')}`,
      category: 'preparation',
      priority: 'high',
      deadline: new Date(tripStartDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      expertTip: 'Some countries offer e-visas that can be obtained online quickly'
    });
  }
  
  // Travel insurance
  todos.push({
    id: 'travel-insurance',
    task: 'Purchase travel insurance',
    category: 'preparation',
    priority: 'medium',
    deadline: new Date(tripStartDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    autoCompletable: true
  });
  
  // Packing
  todos.push({
    id: 'create-packing-list',
    task: 'Create packing list based on activities and weather',
    category: 'preparation',
    priority: 'low',
    deadline: new Date(tripStartDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expertTip: 'Use our AI packing assistant for a customized list!'
  });
  
  // Health preparations
  if (destinations.some(d => requiresHealthPrep(d))) {
    todos.push({
      id: 'health-prep',
      task: 'Check vaccination requirements and travel health advice',
      category: 'preparation',
      priority: 'high',
      deadline: new Date(tripStartDate.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  // Currency
  if (destinations.some(d => !isLocalCurrency(d))) {
    todos.push({
      id: 'currency-exchange',
      task: 'Exchange currency or notify bank of travel',
      category: 'preparation',
      priority: 'medium',
      deadline: new Date(tripStartDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return todos;
}

function generateDailyTodos(context: ToolContext, date: string): TodoItem[] {
  const todos: TodoItem[] = [];
  const day = context.tripDays.find(d => d.date === date);
  if (!day) return todos;
  
  // Morning preparation
  todos.push({
    id: `morning-prep-${date}`,
    task: 'Check weather and adjust plans if needed',
    category: 'daily',
    priority: 'medium',
    deadline: `${date}T08:00:00.000Z`
  });
  
  // Confirm reservations
  const reservations = day.activities?.filter(a => a.bookingConfirmation);
  if (reservations && reservations.length > 0) {
    todos.push({
      id: `confirm-reservations-${date}`,
      task: `Confirm ${reservations.length} reservation(s) for today`,
      category: 'daily',
      priority: 'high',
      deadline: `${date}T09:00:00.000Z`
    });
  }
  
  // Transportation prep
  if (day.activities && day.activities.length > 2) {
    todos.push({
      id: `transport-plan-${date}`,
      task: 'Review transportation between activities',
      category: 'daily',
      priority: 'medium',
      deadline: `${date}T09:00:00.000Z`,
      expertTip: 'Download offline maps for the areas you\'ll visit today'
    });
  }
  
  return todos;
}

function generateOptionalTodos(context: ToolContext): TodoItem[] {
  const todos: TodoItem[] = [];
  
  // Photography preparation
  if (hasPhotoOpportunities(context)) {
    todos.push({
      id: 'photo-prep',
      task: 'Research best photo spots and golden hour times',
      category: 'optional',
      priority: 'low',
      expertTip: 'Golden hour is typically 1 hour after sunrise and before sunset'
    });
  }
  
  // Local experiences
  todos.push({
    id: 'local-experiences',
    task: 'Research unique local experiences or hidden gems',
    category: 'optional',
    priority: 'low',
    expertTip: 'Ask our AI for off-the-beaten-path recommendations!'
  });
  
  // Restaurant research
  if (context.preferences?.foodie) {
    todos.push({
      id: 'foodie-research',
      task: 'Research must-try local dishes and food markets',
      category: 'optional',
      priority: 'low'
    });
  }
  
  return todos;
}

function generateTodoSuggestions(todos: TodoItem[], context: ToolContext): string[] {
  const suggestions: string[] = [];
  
  const highPriorityCount = todos.filter(t => t.priority === 'high').length;
  if (highPriorityCount > 5) {
    suggestions.push('You have many high-priority items. Consider tackling bookings first.');
  }
  
  const autoCompletable = todos.filter(t => t.autoCompletable).length;
  if (autoCompletable > 0) {
    suggestions.push(`${autoCompletable} todos can be completed automatically through our platform`);
  }
  
  const overdueTodos = todos.filter(t => 
    t.deadline && new Date(t.deadline) < new Date()
  ).length;
  if (overdueTodos > 0) {
    suggestions.push(`⚠️ ${overdueTodos} todos are overdue and need immediate attention`);
  }
  
  return suggestions;
}

// Helper functions
function isInternationalDestination(destination: any): boolean {
  // This would check against user's home country
  return destination.country !== 'United States';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getBookingDeadline(activity: any): number {
  if (activity.expertRecommended) return 14; // 2 weeks for popular spots
  if (activity.category === 'tour') return 7;
  if (activity.category === 'restaurant') return 3;
  return 5; // Default 5 days
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function requiresHealthPrep(destination: any): boolean {
  // List of countries that typically require vaccinations
  const healthPrepCountries = ['Brazil', 'Kenya', 'India', 'Thailand', 'Peru'];
  return healthPrepCountries.includes(destination.country);
}

function isLocalCurrency(destination: any): boolean {
  // Check if destination uses same currency as user
  return destination.currency === 'USD'; // Would check against user's currency
}

function hasPhotoOpportunities(context: ToolContext): boolean {
  return context.tripDays.some(day => 
    day.activities?.some(a => 
      a.category === 'attraction' || 
      a.category === 'viewpoint' ||
      a.tags?.includes('scenic')
    )
  );
}