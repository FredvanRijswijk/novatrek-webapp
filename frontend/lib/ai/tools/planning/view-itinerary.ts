import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult } from '../types';
import { format, parseISO } from 'date-fns';

const viewItineraryParams = z.object({
  scope: z.enum(['full', 'day', 'upcoming']).default('full'),
  date: z.string().optional(),
  includeStats: z.boolean().default(true)
});

interface ItineraryDay {
  date: string;
  dayNumber: number;
  activities: Array<{
    id: string;
    name: string;
    time: string;
    endTime: string;
    duration: number;
    location: string;
    bookingRequired?: boolean;
    notes?: string;
  }>;
  stats: {
    totalActivities: number;
    totalDuration: number;
    firstActivity?: string;
    lastActivity?: string;
    busyPercentage: number;
  };
}

interface ItineraryOverview {
  days: ItineraryDay[];
  summary: {
    totalDays: number;
    plannedDays: number;
    totalActivities: number;
    bookingRequired: number;
    averageActivitiesPerDay: number;
    busyDays: number;
    relaxedDays: number;
  };
  suggestions: string[];
  gaps: Array<{
    date: string;
    issue: string;
    suggestion: string;
  }>;
}

export const viewItineraryTool: TravelTool<z.infer<typeof viewItineraryParams>, ItineraryOverview> = {
  id: 'view_itinerary',
  name: 'View Trip Itinerary',
  description: 'Shows the current trip itinerary with activities, timing, and helpful statistics',
  category: 'planning',
  parameters: viewItineraryParams,
  requiresAuth: true,
  
  async execute(params, context) {
    try {
      const { scope, date, includeStats } = params;
      
      // Use itinerary from trip object, or fall back to tripDays
      let relevantDays = context.trip.itinerary || context.tripDays || [];
      
      if (scope === 'day' && date) {
        relevantDays = relevantDays.filter(day => {
          let dayDate: string;
          if (day.date?.toDate) {
            dayDate = day.date.toDate().toISOString().split('T')[0];
          } else if (day.date instanceof Date) {
            dayDate = day.date.toISOString().split('T')[0];
          } else if (typeof day.date === 'string' && day.date.includes('T')) {
            dayDate = day.date.split('T')[0];
          } else {
            dayDate = day.date;
          }
          return dayDate === date;
        });
      } else if (scope === 'upcoming') {
        const today = new Date();
        relevantDays = relevantDays.filter(day => {
          let dayDate: Date;
          if (day.date?.toDate) {
            dayDate = day.date.toDate();
          } else if (day.date instanceof Date) {
            dayDate = day.date;
          } else {
            dayDate = new Date(day.date);
          }
          return dayDate >= today;
        });
      }
      
      // Process each day
      const processedDays: ItineraryDay[] = [];
      let totalActivities = 0;
      let bookingRequiredCount = 0;
      
      relevantDays.forEach((day, index) => {
        const activities = (day.activities || [])
          .filter(a => a && a.time) // Filter out activities without time
          .sort((a, b) => {
            const timeA = a.time || '00:00';
            const timeB = b.time || '00:00';
            return timeA.localeCompare(timeB);
          });
        
        // Calculate day stats
        const dayStats = calculateDayStats(activities);
        totalActivities += activities.length;
        bookingRequiredCount += activities.filter(a => a.bookingRequired).length;
        
        processedDays.push({
          date: day.date,
          dayNumber: index + 1,
          activities: activities.map(activity => ({
            id: activity.id || '',
            name: activity.name || 'Unnamed Activity',
            time: activity.time || '00:00',
            endTime: activity.endTime || calculateEndTime(activity.time || '00:00', activity.duration || 120),
            duration: activity.duration || 120,
            location: activity.location?.address || activity.address || '',
            bookingRequired: activity.bookingRequired || false,
            notes: activity.notes || ''
          })),
          stats: dayStats
        });
      });
      
      // Calculate summary
      const summary = {
        totalDays: context.trip.endDate && context.trip.startDate ? 
          Math.ceil((new Date(context.trip.endDate).getTime() - new Date(context.trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 
          relevantDays.length,
        plannedDays: processedDays.filter(d => d.activities.length > 0).length,
        totalActivities,
        bookingRequired: bookingRequiredCount,
        averageActivitiesPerDay: processedDays.length > 0 ? 
          Math.round(totalActivities / processedDays.length * 10) / 10 : 0,
        busyDays: processedDays.filter(d => d.stats.busyPercentage > 60).length,
        relaxedDays: processedDays.filter(d => d.stats.busyPercentage <= 30).length
      };
      
      // Identify gaps and generate suggestions
      const gaps = identifyItineraryGaps(processedDays, context);
      const suggestions = generateItinerarySuggestions(processedDays, summary, context);
      
      return {
        success: true,
        data: {
          days: processedDays,
          summary,
          suggestions,
          gaps
        },
        metadata: {
          confidence: 1.0,
          source: 'itinerary-analyzer'
        }
      };
      
    } catch (error) {
      console.error('View itinerary error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to view itinerary'
      };
    }
  }
};

function calculateDayStats(activities: any[]): ItineraryDay['stats'] {
  if (activities.length === 0) {
    return {
      totalActivities: 0,
      totalDuration: 0,
      busyPercentage: 0
    };
  }
  
  const totalDuration = activities.reduce((sum, activity) => 
    sum + (activity.duration || 120), 0
  );
  
  // Calculate busy percentage (assuming 12 active hours per day)
  const activeHours = 12 * 60; // 12 hours in minutes
  const busyPercentage = Math.round((totalDuration / activeHours) * 100);
  
  return {
    totalActivities: activities.length,
    totalDuration,
    firstActivity: activities[0]?.time,
    lastActivity: activities[activities.length - 1]?.time,
    busyPercentage: Math.min(100, busyPercentage)
  };
}

function calculateEndTime(startTime: string, duration: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

function identifyItineraryGaps(
  days: ItineraryDay[],
  context: ToolContext
): Array<{ date: string; issue: string; suggestion: string }> {
  const gaps: Array<{ date: string; issue: string; suggestion: string }> = [];
  
  days.forEach(day => {
    // Check for empty days
    if (day.activities.length === 0) {
      gaps.push({
        date: day.date,
        issue: 'No activities planned',
        suggestion: 'Add activities to make the most of this day'
      });
    }
    
    // Check for missing meals
    const hasMeal = day.activities.some(a => 
      a.name.toLowerCase().includes('restaurant') || 
      a.name.toLowerCase().includes('cafe') ||
      a.name.toLowerCase().includes('lunch') ||
      a.name.toLowerCase().includes('dinner')
    );
    
    if (day.activities.length > 0 && !hasMeal) {
      gaps.push({
        date: day.date,
        issue: 'No meals planned',
        suggestion: 'Consider adding restaurant reservations'
      });
    }
    
    // Check for overbooked days
    if (day.stats.busyPercentage > 80) {
      gaps.push({
        date: day.date,
        issue: 'Day might be too packed',
        suggestion: 'Consider removing an activity or adding buffer time'
      });
    }
    
    // Check for late starts
    if (day.stats.firstActivity && parseInt(day.stats.firstActivity.split(':')[0]) > 11) {
      gaps.push({
        date: day.date,
        issue: 'Day starts late',
        suggestion: 'Add morning activities to maximize your day'
      });
    }
  });
  
  return gaps;
}

function generateItinerarySuggestions(
  days: ItineraryDay[],
  summary: ItineraryOverview['summary'],
  context: ToolContext
): string[] {
  const suggestions: string[] = [];
  
  // Overall balance
  if (summary.busyDays > summary.relaxedDays * 2) {
    suggestions.push('Your itinerary is quite packed. Consider adding more downtime or free exploration periods.');
  }
  
  // Booking reminders
  if (summary.bookingRequired > 0) {
    suggestions.push(`You have ${summary.bookingRequired} activities that need booking. Use the booking reminder tool to stay on track.`);
  }
  
  // Empty days
  const emptyDays = summary.totalDays - summary.plannedDays;
  if (emptyDays > 0) {
    suggestions.push(`You have ${emptyDays} days without activities. Would you like suggestions for those days?`);
  }
  
  // Activity distribution
  if (summary.averageActivitiesPerDay > 4) {
    suggestions.push('Consider spreading activities more evenly across days to avoid exhaustion.');
  } else if (summary.averageActivitiesPerDay < 2 && summary.plannedDays > 0) {
    suggestions.push('You might have time for more activities. Use the search tools to find additional options.');
  }
  
  // Time slot availability
  const hasTimeSlots = days.some(day => 
    day.activities.length > 0 && day.stats.busyPercentage < 50
  );
  
  if (hasTimeSlots) {
    suggestions.push('You have available time slots. Use the time slot finder to optimize your schedule.');
  }
  
  // Group travel
  if (context.trip.travelers && context.trip.travelers > 1) {
    suggestions.push('Planning for a group? Use the group activity search for options that work for everyone.');
  }
  
  return suggestions.slice(0, 5); // Limit to 5 most relevant suggestions
}