import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult } from '../types';
import { TripServiceV2 } from '@/lib/services/trip-service-v2';
import { format } from 'date-fns';

const viewItineraryParams = z.object({
  format: z.enum(['summary', 'detailed', 'analysis']).default('summary'),
  includeEmptyDays: z.boolean().default(false)
});

interface ItineraryViewResult {
  days: Array<{
    date: string;
    dayNumber: number;
    activities: Array<{
      time: string;
      name: string;
      location: string;
      duration: number;
      cost?: number;
    }>;
    accommodations: any[];
    transportation: any[];
    totalCost: number;
    notes?: string;
  }>;
  summary: {
    totalDays: number;
    plannedDays: number;
    totalActivities: number;
    totalCost: number;
    emptyDays: number[];
  };
  insights?: {
    busyDays: number[];
    lightDays: number[];
    mealGaps: Array<{ day: number; missingMeals: string[] }>;
    travelIntensive: number[];
    suggestedAdditions: string[];
  };
}

export const viewItineraryV2Tool: TravelTool<z.infer<typeof viewItineraryParams>, ItineraryViewResult> = {
  id: 'view_itinerary',
  name: 'View Trip Itinerary',
  description: 'Display the current trip itinerary with insights and analysis',
  category: 'planning',
  parameters: viewItineraryParams,
  requiresAuth: true,
  
  async execute(params, context) {
    const tripService = new TripServiceV2();
    
    try {
      const { format, includeEmptyDays } = params;
      
      // Get full trip data with V2 structure
      const fullTrip = await tripService.getFullTrip(context.trip.id);
      if (!fullTrip) {
        return {
          success: false,
          error: 'Failed to load trip data'
        };
      }
      
      const result: ItineraryViewResult = {
        days: [],
        summary: {
          totalDays: fullTrip.days.length,
          plannedDays: 0,
          totalActivities: 0,
          totalCost: 0,
          emptyDays: []
        }
      };
      
      // Process each day
      for (const day of fullTrip.days) {
        const hasActivities = day.activities.length > 0;
        const hasAccommodations = (day.accommodations?.length || 0) > 0;
        const hasTransportation = (day.transportation?.length || 0) > 0;
        const hasContent = hasActivities || hasAccommodations || hasTransportation;
        
        if (!includeEmptyDays && !hasContent) {
          result.summary.emptyDays.push(day.dayNumber);
          continue;
        }
        
        if (hasContent) {
          result.summary.plannedDays++;
        }
        
        result.summary.totalActivities += day.activities.length;
        
        const dayData = {
          date: day.date,
          dayNumber: day.dayNumber,
          activities: day.activities.map(activity => ({
            time: activity.startTime || activity.time || '09:00',
            name: activity.name,
            location: activity.location.address,
            duration: activity.duration || 120,
            cost: activity.cost?.amount
          })).sort((a, b) => a.time.localeCompare(b.time)),
          accommodations: day.accommodations || [],
          transportation: day.transportation || [],
          totalCost: day.stats?.totalCost || 0,
          notes: day.notes
        };
        
        result.summary.totalCost += dayData.totalCost;
        result.days.push(dayData);
      }
      
      // Add insights for detailed/analysis format
      if (format === 'detailed' || format === 'analysis') {
        result.insights = this.generateInsights(fullTrip.days);
      }
      
      // Format message based on request
      let message = '';
      if (format === 'summary') {
        message = this.formatSummaryMessage(result);
      } else if (format === 'detailed') {
        message = this.formatDetailedMessage(result);
      } else {
        message = this.formatAnalysisMessage(result);
      }
      
      return {
        success: true,
        data: result,
        metadata: {
          message,
          confidence: 1.0,
          source: 'itinerary-viewer-v2'
        }
      };
      
    } catch (error) {
      console.error('View itinerary V2 error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to view itinerary'
      };
    }
  },
  
  generateInsights(days: any[]): any {
    const insights = {
      busyDays: [] as number[],
      lightDays: [] as number[],
      mealGaps: [] as any[],
      travelIntensive: [] as number[],
      suggestedAdditions: [] as string[]
    };
    
    days.forEach(day => {
      const activityCount = day.activities.length;
      
      // Categorize days
      if (activityCount >= 5) {
        insights.busyDays.push(day.dayNumber);
      } else if (activityCount <= 1) {
        insights.lightDays.push(day.dayNumber);
      }
      
      // Check meal coverage
      const mealTypes = ['breakfast', 'lunch', 'dinner'];
      const missingMeals: string[] = [];
      
      mealTypes.forEach(meal => {
        const hasMeal = day.activities.some((a: any) => 
          a.type === 'dining' || 
          a.category === 'restaurant' ||
          a.name.toLowerCase().includes(meal)
        );
        
        if (!hasMeal) {
          missingMeals.push(meal);
        }
      });
      
      if (missingMeals.length > 0) {
        insights.mealGaps.push({
          day: day.dayNumber,
          missingMeals
        });
      }
      
      // Check travel intensity
      const travelTime = day.activities.reduce((sum: number, act: any) => 
        sum + (act.travelTimeFromPrevious || 0), 0
      );
      
      if (travelTime > 120) { // More than 2 hours of travel
        insights.travelIntensive.push(day.dayNumber);
      }
    });
    
    // Generate suggestions
    if (insights.lightDays.length > 0) {
      insights.suggestedAdditions.push(`Days ${insights.lightDays.join(', ')} have few activities - consider adding more`);
    }
    
    if (insights.busyDays.length > 0) {
      insights.suggestedAdditions.push(`Days ${insights.busyDays.join(', ')} are quite packed - ensure you have time to rest`);
    }
    
    if (insights.mealGaps.length > 0) {
      insights.suggestedAdditions.push('Several days are missing meal plans - remember to add dining options');
    }
    
    return insights;
  },
  
  formatSummaryMessage(result: ItineraryViewResult): string {
    const lines = [
      `📅 **Trip Itinerary Summary**`,
      ``,
      `- **Total Days**: ${result.summary.totalDays}`,
      `- **Planned Days**: ${result.summary.plannedDays}`,
      `- **Total Activities**: ${result.summary.totalActivities}`,
      `- **Total Cost**: $${result.summary.totalCost}`,
      ``
    ];
    
    if (result.summary.emptyDays.length > 0) {
      lines.push(`⚠️ **Empty Days**: ${result.summary.emptyDays.join(', ')}`);
      lines.push(`Consider adding activities to these days.`);
    } else {
      lines.push(`✅ All days have planned activities!`);
    }
    
    return lines.join('\n');
  },
  
  formatDetailedMessage(result: ItineraryViewResult): string {
    const lines = [
      `📅 **Detailed Trip Itinerary**`,
      ``
    ];
    
    result.days.forEach(day => {
      const dateObj = new Date(day.date + 'T00:00:00');
      lines.push(`**Day ${day.dayNumber} - ${format(dateObj, 'EEEE, MMMM d')}**`);
      
      if (day.activities.length > 0) {
        lines.push(`📍 Activities:`);
        day.activities.forEach(activity => {
          lines.push(`  • ${activity.time} - ${activity.name}`);
          lines.push(`    📍 ${activity.location}`);
          if (activity.cost) {
            lines.push(`    💰 $${activity.cost}`);
          }
        });
      } else {
        lines.push(`  No activities planned yet`);
      }
      
      lines.push(``);
    });
    
    if (result.insights) {
      lines.push(`**Insights:**`);
      result.insights.suggestedAdditions.forEach(suggestion => {
        lines.push(`• ${suggestion}`);
      });
    }
    
    return lines.join('\n');
  },
  
  formatAnalysisMessage(result: ItineraryViewResult): string {
    const lines = [
      `📊 **Itinerary Analysis**`,
      ``,
      `**Coverage**: ${Math.round((result.summary.plannedDays / result.summary.totalDays) * 100)}% of days have activities`,
      `**Density**: ${(result.summary.totalActivities / result.summary.totalDays).toFixed(1)} activities per day average`,
      `**Budget**: $${(result.summary.totalCost / result.summary.totalDays).toFixed(0)} per day average`,
      ``
    ];
    
    if (result.insights) {
      if (result.insights.busyDays.length > 0) {
        lines.push(`**🏃 Busy Days**: Days ${result.insights.busyDays.join(', ')}`);
      }
      
      if (result.insights.lightDays.length > 0) {
        lines.push(`**🌅 Light Days**: Days ${result.insights.lightDays.join(', ')}`);
      }
      
      if (result.insights.mealGaps.length > 0) {
        lines.push(`**🍽️ Meal Planning Needed**: ${result.insights.mealGaps.length} days missing meals`);
      }
      
      if (result.insights.travelIntensive.length > 0) {
        lines.push(`**🚗 Travel Intensive**: Days ${result.insights.travelIntensive.join(', ')}`);
      }
      
      lines.push(``);
      lines.push(`**Recommendations:**`);
      result.insights.suggestedAdditions.forEach(suggestion => {
        lines.push(`• ${suggestion}`);
      });
    }
    
    return lines.join('\n');
  }
};