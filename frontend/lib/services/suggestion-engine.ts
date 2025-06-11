import { EnhancedTripContext, SmartSuggestion } from '@/types/chat-context';
import { format } from 'date-fns';

export class SuggestionEngine {
  private context: EnhancedTripContext;
  
  constructor(context: EnhancedTripContext) {
    this.context = context;
  }
  
  generateSuggestions(): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    // Add various types of suggestions
    suggestions.push(...this.getAccommodationSuggestions());
    suggestions.push(...this.getActivitySuggestions());
    suggestions.push(...this.getBudgetSuggestions());
    suggestions.push(...this.getMealSuggestions());
    suggestions.push(...this.getWeatherSuggestions());
    suggestions.push(...this.getOptimizationSuggestions());
    suggestions.push(...this.getPreferenceSuggestions());
    
    // Sort by priority and return top suggestions
    return suggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 6); // Return top 6 suggestions
  }
  
  private getAccommodationSuggestions(): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    if (this.context.progress.accommodationCoverage < 100) {
      const nightsWithoutAccommodation = Math.ceil(
        this.context.progress.totalDays * (1 - this.context.progress.accommodationCoverage / 100)
      );
      
      suggestions.push({
        id: 'accommodation-missing',
        text: `Find hotels for ${nightsWithoutAccommodation} nights`,
        icon: '🏨',
        priority: 10,
        category: 'booking',
        metadata: {
          placeType: 'lodging'
        }
      });
    }
    
    // Suggest accommodation near activities
    this.context.detailedItinerary.forEach(day => {
      if (!day.accommodations || day.accommodations.length === 0) {
        if (day.activities.length > 0) {
          suggestions.push({
            id: `accommodation-day-${day.dayNumber}`,
            text: `Find accommodation near Day ${day.dayNumber} activities`,
            icon: '🛏️',
            priority: 8,
            category: 'booking',
            metadata: {
              day: day.dayNumber,
              placeType: 'lodging'
            }
          });
        }
      }
    });
    
    return suggestions;
  }
  
  private getActivitySuggestions(): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    // Empty days
    this.context.progress.emptyDays.forEach(dayNumber => {
      suggestions.push({
        id: `activities-day-${dayNumber}`,
        text: `Plan activities for Day ${dayNumber}`,
        icon: '📅',
        priority: 9,
        category: 'planning',
        metadata: { day: dayNumber }
      });
    });
    
    // Free time slots
    this.context.detailedItinerary.forEach(day => {
      const longFreeSlots = day.freeTimeSlots.filter(slot => slot.duration >= 120); // 2+ hours
      if (longFreeSlots.length > 0) {
        suggestions.push({
          id: `fill-free-time-${day.dayNumber}`,
          text: `Fill ${longFreeSlots.length} free time slots on Day ${day.dayNumber}`,
          icon: '⏰',
          priority: 6,
          category: 'planning',
          metadata: { day: day.dayNumber }
        });
      }
    });
    
    // Interests-based suggestions
    if (this.context.userPreferences?.interests.includes('photography') && 
        this.context.stats.photoSpots < 3) {
      suggestions.push({
        id: 'photo-spots',
        text: 'Find the best photo spots nearby',
        icon: '📸',
        priority: 5,
        category: 'discovery',
        metadata: { placeType: 'tourist_attraction' }
      });
    }
    
    return suggestions;
  }
  
  private getBudgetSuggestions(): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    if (this.context.budget.isOverBudget) {
      suggestions.push({
        id: 'budget-overrun',
        text: `Reduce costs - over budget by ${this.context.budget.projectedOverage}`,
        icon: '💰',
        priority: 9,
        category: 'alert'
      });
      
      suggestions.push({
        id: 'free-activities',
        text: 'Find free activities to balance budget',
        icon: '🆓',
        priority: 8,
        category: 'discovery'
      });
    } else if (this.context.budget.remaining < this.context.budget.total * 0.2) {
      suggestions.push({
        id: 'budget-warning',
        text: 'Find budget-friendly options',
        icon: '💵',
        priority: 7,
        category: 'optimization'
      });
    }
    
    return suggestions;
  }
  
  private getMealSuggestions(): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    this.context.detailedItinerary.forEach(day => {
      if (!day.hasLunch && day.activities.length > 2) {
        suggestions.push({
          id: `lunch-day-${day.dayNumber}`,
          text: `Find lunch spot for Day ${day.dayNumber}`,
          icon: '🍽️',
          priority: 7,
          category: 'planning',
          metadata: {
            day: day.dayNumber,
            placeType: 'restaurant'
          }
        });
      }
      
      if (!day.hasDinner) {
        suggestions.push({
          id: `dinner-day-${day.dayNumber}`,
          text: `Find dinner restaurant for Day ${day.dayNumber}`,
          icon: '🍝',
          priority: 6,
          category: 'planning',
          metadata: {
            day: day.dayNumber,
            placeType: 'restaurant'
          }
        });
      }
    });
    
    // Dietary restriction suggestions
    if (this.context.userPreferences?.dietaryRestrictions && 
        this.context.userPreferences.dietaryRestrictions.length > 0) {
      const restrictions = this.context.userPreferences.dietaryRestrictions.join(', ');
      suggestions.push({
        id: 'dietary-restaurants',
        text: `Find ${restrictions} restaurants`,
        icon: '🥗',
        priority: 7,
        category: 'discovery',
        metadata: { placeType: 'restaurant' }
      });
    }
    
    return suggestions;
  }
  
  private getWeatherSuggestions(): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    if (this.context.weatherForecast) {
      const rainyDays = this.context.detailedItinerary.filter(day => 
        day.weather && day.weather.precipitation > 60
      );
      
      if (rainyDays.length > 0) {
        suggestions.push({
          id: 'rainy-day-activities',
          text: `Find indoor activities for ${rainyDays.length} rainy days`,
          icon: '🌧️',
          priority: 7,
          category: 'planning'
        });
        
        // Check if outdoor activities are planned on rainy days
        rainyDays.forEach(day => {
          const outdoorOnRainy = day.activities.filter(a => !a.weatherSuitable);
          if (outdoorOnRainy.length > 0) {
            suggestions.push({
              id: `weather-conflict-${day.dayNumber}`,
              text: `Find alternatives for outdoor activities on rainy Day ${day.dayNumber}`,
              icon: '⛈️',
              priority: 8,
              category: 'alert',
              metadata: { day: day.dayNumber }
            });
          }
        });
      }
    }
    
    return suggestions;
  }
  
  private getOptimizationSuggestions(): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    // Packed days
    this.context.progress.packedDays.forEach(dayNumber => {
      suggestions.push({
        id: `optimize-day-${dayNumber}`,
        text: `Optimize packed Day ${dayNumber} itinerary`,
        icon: '🗓️',
        priority: 6,
        category: 'optimization',
        metadata: { day: dayNumber }
      });
    });
    
    // Route optimization
    const daysWithMultipleActivities = this.context.detailedItinerary.filter(day => 
      day.activities.length >= 3
    );
    
    if (daysWithMultipleActivities.length > 0) {
      suggestions.push({
        id: 'optimize-routes',
        text: 'Optimize routes to save travel time',
        icon: '🗺️',
        priority: 5,
        category: 'optimization'
      });
    }
    
    // Time conflict resolution
    const conflictDays = this.context.issues
      .filter(issue => issue.type === 'time_conflict')
      .map(issue => issue.day)
      .filter((day, index, self) => self.indexOf(day) === index);
      
    if (conflictDays.length > 0) {
      suggestions.push({
        id: 'resolve-conflicts',
        text: `Resolve time conflicts on ${conflictDays.length} days`,
        icon: '⚠️',
        priority: 9,
        category: 'alert'
      });
    }
    
    return suggestions;
  }
  
  private getPreferenceSuggestions(): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    if (!this.context.userPreferences) return suggestions;
    
    // Activity type suggestions
    const preferredTypes = this.context.userPreferences.activityTypes;
    const currentTypes = new Set(
      this.context.detailedItinerary.flatMap(day => 
        day.activities.map(a => a.type)
      )
    );
    
    preferredTypes.forEach(type => {
      if (!currentTypes.has(type)) {
        suggestions.push({
          id: `activity-type-${type}`,
          text: `Add ${type} activities you enjoy`,
          icon: '✨',
          priority: 4,
          category: 'discovery',
          metadata: { placeType: type }
        });
      }
    });
    
    // Pace suggestions
    if (this.context.userPreferences.pacePreference === 'relaxed' && 
        this.context.progress.packedDays.length > 0) {
      suggestions.push({
        id: 'slow-down-pace',
        text: 'Reduce activities for a more relaxed pace',
        icon: '🌴',
        priority: 6,
        category: 'optimization'
      });
    }
    
    return suggestions;
  }
  
  // Generate contextual quick prompts based on current state
  generateQuickPrompts(): string[] {
    const prompts: string[] = [];
    
    // Basic prompts based on progress
    if (this.context.progress.emptyDays.length > 0) {
      prompts.push(`What should I do on Day ${this.context.progress.emptyDays[0]}?`);
    }
    
    if (this.context.progress.accommodationCoverage < 100) {
      prompts.push('Find hotels near my activities');
    }
    
    // Meal prompts
    const daysWithoutLunch = this.context.detailedItinerary
      .filter(day => !day.hasLunch && day.activities.length > 0)
      .map(day => day.dayNumber);
      
    if (daysWithoutLunch.length > 0) {
      prompts.push(`Where should I have lunch on Day ${daysWithoutLunch[0]}?`);
    }
    
    // Budget prompts
    if (this.context.budget.remaining > 0) {
      prompts.push('What can I do with my remaining budget?');
    }
    
    // Weather prompts
    const rainyDays = this.context.detailedItinerary
      .filter(day => day.weather && day.weather.precipitation > 60)
      .length;
      
    if (rainyDays > 0) {
      prompts.push('What indoor activities do you recommend?');
    }
    
    // Interest-based prompts
    if (this.context.userPreferences?.interests.includes('food')) {
      prompts.push('Find the best local food experiences');
    }
    
    if (this.context.userPreferences?.interests.includes('photography')) {
      prompts.push('Where are the best photo spots?');
    }
    
    // General helpful prompts
    prompts.push('Optimize my daily routes');
    prompts.push('Find hidden gems locals love');
    prompts.push('What should I pack for this trip?');
    
    return prompts.slice(0, 4); // Return top 4 prompts
  }
}