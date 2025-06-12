import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult } from '../types';
import { TripServiceV2 } from '@/lib/services/trip-service-v2';
import { ActivityModelV2 } from '@/lib/models/v2/activity-model-v2';
import { DayModelV2 } from '@/lib/models/v2/day-model-v2';
import { normalizeDate } from '@/lib/utils/date-helpers';

const addActivityParams = z.object({
  activity: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
      address: z.string()
    }),
    duration: z.number().default(120), // minutes
    price: z.number().optional(),
    category: z.string().optional(),
    bookingRequired: z.boolean().optional(),
    bookingUrl: z.string().optional(),
    photos: z.array(z.string()).optional(),
    expertRecommended: z.boolean().optional()
  }),
  date: z.string(),
  time: z.string().optional(),
  notes: z.string().optional(),
  autoOptimize: z.boolean().default(true)
});

interface AddActivityResult {
  success: boolean;
  activity: any;
  warnings: string[];
  suggestions: string[];
  conflicts?: any[];
  optimizedTime?: string;
}

export const addActivityV2Tool: TravelTool<z.infer<typeof addActivityParams>, AddActivityResult> = {
  id: 'add_activity',
  name: 'Add Activity to Itinerary',
  description: 'Intelligently add an activity to the trip itinerary with conflict detection and optimization',
  category: 'planning',
  parameters: addActivityParams,
  requiresAuth: true,
  
  async execute(params, context) {
    const startTime = Date.now();
    const tripService = new TripServiceV2();
    const activityModel = new ActivityModelV2();
    const dayModel = new DayModelV2();
    
    try {
      const { activity, date, time, notes, autoOptimize } = params;
      
      // Normalize the target date
      const targetDate = normalizeDate(date);
      
      // Find the day for this date
      let day = await dayModel.getDayByDate(context.trip.id, targetDate);
      
      if (!day) {
        // Create the day if it doesn't exist
        const dayNumber = await dayModel.count([context.trip.id]) + 1;
        day = await dayModel.createDay(context.trip.id, {
          dayNumber,
          date: targetDate,
          type: 'destination',
          destinationId: context.trip.destination?.id,
          destinationName: context.trip.destination?.name,
          notes: `Day ${dayNumber} of your trip`
        });
      }
      
      let finalTime = time || '10:00';
      const warnings: string[] = [];
      const suggestions: string[] = [];
      let conflicts: any[] = [];
      
      // Check for time conflicts
      if (autoOptimize) {
        conflicts = await activityModel.checkTimeConflicts(
          context.trip.id,
          day.id,
          finalTime,
          activity.duration
        );
        
        if (conflicts.length > 0) {
          // Find optimal time slot
          const optimalTime = await findOptimalTimeSlot(
            context.trip.id,
            day.id,
            activity.duration,
            activityModel,
            context.preferences
          );
          
          if (optimalTime) {
            finalTime = optimalTime;
            warnings.push(`Time conflict detected. Activity rescheduled to ${optimalTime}`);
          } else {
            return {
              success: false,
              error: 'No available time slot found for this activity',
              data: {
                success: false,
                activity: null,
                warnings: ['No available time slots'],
                suggestions: ['Consider removing or shortening other activities'],
                conflicts
              }
            };
          }
        }
      } else if (conflicts.length > 0) {
        warnings.push('Time conflict detected with existing activities');
      }
      
      // Calculate travel time from previous activity
      const activities = await activityModel.getDayActivities(context.trip.id, day.id);
      const previousActivity = getPreviousActivity(activities, finalTime);
      let travelTime = 0;
      
      if (previousActivity?.location && activity.location) {
        travelTime = calculateTravelTimeSync(previousActivity.location, activity.location);
        if (travelTime > 30) {
          warnings.push(`${travelTime} minutes travel time from previous activity`);
        }
      }
      
      // Create the activity with V2 structure
      const activityData = {
        name: activity.name,
        description: activity.description,
        type: mapCategoryToType(activity.category),
        category: activity.category,
        location: {
          ...activity.location,
          placeId: activity.id
        },
        startTime: finalTime,
        time: finalTime, // For compatibility
        endTime: calculateEndTime(finalTime, activity.duration),
        duration: activity.duration,
        cost: activity.price ? {
          amount: activity.price,
          currency: context.trip.budget?.currency || 'USD',
          perPerson: true
        } : undefined,
        bookingRequired: activity.bookingRequired,
        bookingUrl: activity.bookingUrl,
        photos: activity.photos,
        expertRecommended: activity.expertRecommended,
        novatrekEnhanced: true,
        aiSuggested: true,
        travelTimeFromPrevious: travelTime > 0 ? travelTime : undefined,
        notes,
        status: 'planned' as const,
        createdBy: context.userId
      };
      
      // Remove undefined fields
      Object.keys(activityData).forEach(key => {
        if (activityData[key] === undefined) {
          delete activityData[key];
        }
      });
      
      // Create the activity using V2 model
      const createdActivity = await activityModel.createActivity(
        context.trip.id,
        day.id,
        activityData
      );
      
      // Update day statistics
      await dayModel.updateStats(context.trip.id, day.id, {
        activityCount: activities.length + 1,
        totalCost: (day.stats?.totalCost || 0) + (activity.price || 0)
      });
      
      // Generate suggestions
      if (activity.bookingRequired && !activity.bookingUrl) {
        suggestions.push('This activity requires booking. Consider making a reservation soon.');
      }
      
      if (activity.expertRecommended) {
        suggestions.push('This is an expert-recommended activity - great choice!');
      }
      
      // Check meal coverage
      const updatedActivities = [...activities, createdActivity];
      const mealGaps = checkMealGaps(updatedActivities);
      if (mealGaps.length > 0) {
        suggestions.push(`Consider adding a ${mealGaps[0]} restaurant to your itinerary`);
      }
      
      const executionTime = Date.now() - startTime;
      console.log(`Add activity V2 completed in ${executionTime}ms`);
      
      return {
        success: true,
        data: {
          success: true,
          activity: createdActivity,
          warnings,
          suggestions,
          optimizedTime: finalTime !== time ? finalTime : undefined
        },
        metadata: {
          confidence: 0.95,
          source: 'intelligent-planner-v2',
          executionTime
        }
      };
      
    } catch (error) {
      console.error('Add activity V2 error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add activity'
      };
    }
  }
};

// Helper functions
async function findOptimalTimeSlot(
  tripId: string,
  dayId: string,
  duration: number,
  activityModel: ActivityModelV2,
  preferences: any
): Promise<string | null> {
  const activities = await activityModel.getDayActivities(tripId, dayId);
  
  const dayStart = preferences?.earlyBird ? 7 * 60 : 9 * 60;
  const dayEnd = preferences?.nightOwl ? 22 * 60 : 20 * 60;
  
  const sorted = [...activities].sort((a, b) => 
    timeToMinutes(a.startTime || a.time || '10:00') - 
    timeToMinutes(b.startTime || b.time || '10:00')
  );
  
  if (sorted.length === 0 || timeToMinutes(sorted[0].startTime || sorted[0].time || '10:00') - dayStart >= duration) {
    return minutesToTime(dayStart);
  }
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = timeToMinutes(sorted[i].startTime || sorted[i].time || '10:00') + (sorted[i].duration || 120);
    const nextStart = timeToMinutes(sorted[i + 1].startTime || sorted[i + 1].time || '10:00');
    
    if (nextStart - currentEnd >= duration + 30) {
      return minutesToTime(currentEnd + 15);
    }
  }
  
  const lastActivity = sorted[sorted.length - 1];
  const lastEnd = timeToMinutes(lastActivity.startTime || lastActivity.time || '10:00') + (lastActivity.duration || 120);
  
  if (dayEnd - lastEnd >= duration) {
    return minutesToTime(lastEnd + 15);
  }
  
  return null;
}

function getPreviousActivity(activities: any[], time: string): any | null {
  const targetMinutes = timeToMinutes(time);
  const sorted = [...activities]
    .filter(a => timeToMinutes(a.startTime || a.time || '10:00') < targetMinutes)
    .sort((a, b) => 
      timeToMinutes(b.startTime || b.time || '10:00') - 
      timeToMinutes(a.startTime || a.time || '10:00')
    );
  
  return sorted[0] || null;
}

function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function calculateEndTime(startTime: string, duration: number): string {
  const start = timeToMinutes(startTime);
  return minutesToTime(start + duration);
}

function calculateTravelTimeSync(from: any, to: any): number {
  const distance = calculateDistance(from, to);
  return Math.ceil((distance / 1000) / 30 * 60); // 30 km/h average
}

function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371e3;
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

function mapCategoryToType(category?: string): 'sightseeing' | 'dining' | 'activity' | 'transport' | 'accommodation' | 'other' {
  if (!category) return 'activity';
  
  const categoryMap: Record<string, any> = {
    'restaurant': 'dining',
    'food': 'dining',
    'cafe': 'dining',
    'sightseeing': 'sightseeing',
    'museum': 'sightseeing',
    'landmark': 'sightseeing',
    'transport': 'transport',
    'hotel': 'accommodation',
    'lodging': 'accommodation'
  };
  
  return categoryMap[category.toLowerCase()] || 'activity';
}

function checkMealGaps(activities: any[]): string[] {
  const gaps: string[] = [];
  const mealTimes = {
    breakfast: { start: 7 * 60, end: 10 * 60 },
    lunch: { start: 12 * 60, end: 14 * 60 },
    dinner: { start: 18 * 60, end: 21 * 60 }
  };
  
  for (const [meal, times] of Object.entries(mealTimes)) {
    const hasMeal = activities.some(activity => {
      const actTime = timeToMinutes(activity.startTime || activity.time || '10:00');
      return actTime >= times.start && actTime <= times.end && 
             (activity.type === 'dining' || activity.category === 'restaurant' || activity.category === 'food');
    });
    
    if (!hasMeal) {
      gaps.push(meal);
    }
  }
  
  return gaps;
}