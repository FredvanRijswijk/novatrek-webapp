import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult } from '../types';
import { getAdminDb } from '@/lib/firebase/admin';

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

export const addActivityTool: TravelTool<z.infer<typeof addActivityParams>, AddActivityResult> = {
  id: 'add_activity',
  name: 'Add Activity to Itinerary',
  description: 'Intelligently add an activity to the trip itinerary with conflict detection and optimization',
  category: 'planning',
  parameters: addActivityParams,
  requiresAuth: true,
  
  async execute(params, context) {
    try {
      const { activity, date, time, notes, autoOptimize } = params;
      
      // Extract just the date part if it includes time
      const targetDate = date.includes('T') ? date.split('T')[0] : date;
      
      // Get the trip day - handle both date formats
      const tripDay = context.tripDays.find(day => {
        // Handle different date formats
        let dayDate: string;
        if (day.date?.toDate) {
          // Firestore Timestamp
          dayDate = day.date.toDate().toISOString().split('T')[0];
        } else if (day.date instanceof Date) {
          // JavaScript Date
          dayDate = day.date.toISOString().split('T')[0];
        } else if (typeof day.date === 'string' && day.date.includes('T')) {
          // ISO string
          dayDate = day.date.split('T')[0];
        } else {
          // Plain date string
          dayDate = day.date;
        }
        return dayDate === targetDate;
      });
      
      if (!tripDay) {
        // Format available dates for error message
        const availableDates = context.tripDays.map(d => {
          if (d.date?.toDate) {
            return d.date.toDate().toISOString().split('T')[0];
          } else if (d.date instanceof Date) {
            return d.date.toISOString().split('T')[0];
          } else if (typeof d.date === 'string' && d.date.includes('T')) {
            return d.date.split('T')[0];
          } else {
            return d.date;
          }
        });
        
        return {
          success: false,
          error: `No trip day found for date ${targetDate}. Available dates: ${availableDates.join(', ')}`
        };
      }
      
      // Check for conflicts
      const conflicts = checkTimeConflicts(
        tripDay.activities || [],
        time || '10:00',
        activity.duration
      );
      
      let finalTime = time || '10:00';
      let warnings: string[] = [];
      let suggestions: string[] = [];
      
      if (conflicts.length > 0 && autoOptimize) {
        // Find optimal time slot
        const optimalTime = findOptimalTimeSlot(
          tripDay.activities || [],
          activity.duration,
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
      } else if (conflicts.length > 0) {
        warnings.push('Time conflict detected with existing activities');
      }
      
      // Calculate travel time from previous activity
      const previousActivity = getPreviousActivity(tripDay.activities || [], finalTime);
      let travelTime = 0;
      
      if (previousActivity && previousActivity.location) {
        travelTime = await calculateTravelTime(
          previousActivity.location,
          activity.location
        );
        
        if (travelTime > 30) {
          warnings.push(`${travelTime} minutes travel time from previous activity`);
        }
      }
      
      // Create the enhanced activity - filter out undefined values
      const enhancedActivity: any = {
        id: activity.id,
        name: activity.name,
        location: activity.location,
        duration: activity.duration,
        time: finalTime,
        endTime: calculateEndTime(finalTime, activity.duration),
        addedAt: new Date().toISOString(),
        weather: await getWeatherForDateTime(
          context.trip.destinations?.[0] || context.trip.destination, 
          date, 
          finalTime
        ),
        novatrekEnhanced: true
      };
      
      // Only add optional fields if they have values
      if (activity.description !== undefined && activity.description !== '') {
        enhancedActivity.description = activity.description;
      }
      if (activity.price !== undefined) {
        enhancedActivity.price = activity.price;
      }
      if (activity.category !== undefined) {
        enhancedActivity.category = activity.category;
      }
      if (activity.bookingRequired !== undefined) {
        enhancedActivity.bookingRequired = activity.bookingRequired;
      }
      if (activity.bookingUrl !== undefined) {
        enhancedActivity.bookingUrl = activity.bookingUrl;
      }
      if (activity.photos !== undefined && activity.photos.length > 0) {
        enhancedActivity.photos = activity.photos;
      }
      if (activity.expertRecommended !== undefined) {
        enhancedActivity.expertRecommended = activity.expertRecommended;
      }
      if (notes !== undefined && notes !== null) {
        enhancedActivity.notes = notes;
      }
      if (travelTime > 0) {
        enhancedActivity.travelTime = travelTime;
      }
      
      // Add to trip day
      const updatedActivities = [...(tripDay.activities || []), enhancedActivity]
        .sort((a, b) => a.time.localeCompare(b.time));
      
      // Update the day's activities
      const updatedTripDay = {
        ...tripDay,
        activities: updatedActivities
      };
      
      // Update the trip's itinerary array
      const updatedItinerary = context.trip.itinerary?.map(day => 
        day.id === tripDay.id ? updatedTripDay : day
      ) || [];
      
      // If the day doesn't exist in itinerary, add it
      if (!updatedItinerary.find(day => day.id === tripDay.id)) {
        updatedItinerary.push(updatedTripDay);
      }
      
      // Sort itinerary by date
      updatedItinerary.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Update Firestore - save to the main trip document's itinerary field
      const adminDb = getAdminDb();
      if (!adminDb) {
        return {
          success: false,
          error: 'Database not initialized'
        };
      }
      
      await adminDb
        .collection('trips')
        .doc(context.trip.id)
        .update({
          itinerary: updatedItinerary,
          updatedAt: new Date().toISOString()
        });
      
      // Generate suggestions
      if (activity.bookingRequired && !activity.bookingUrl) {
        suggestions.push('This activity requires booking. Consider making a reservation soon.');
      }
      
      if (activity.expertRecommended) {
        suggestions.push('This is an expert-recommended activity - great choice!');
      }
      
      // Check if meal times are covered
      const mealGaps = checkMealGaps(updatedActivities);
      if (mealGaps.length > 0) {
        suggestions.push(`Consider adding a ${mealGaps[0]} restaurant to your itinerary`);
      }
      
      return {
        success: true,
        data: {
          success: true,
          activity: enhancedActivity,
          warnings,
          suggestions,
          optimizedTime: finalTime !== time ? finalTime : undefined
        },
        metadata: {
          confidence: 0.95,
          source: 'intelligent-planner'
        }
      };
      
    } catch (error) {
      console.error('Add activity error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add activity'
      };
    }
  }
};

function checkTimeConflicts(
  activities: any[],
  startTime: string,
  duration: number
): any[] {
  const conflicts = [];
  const start = timeToMinutes(startTime);
  const end = start + duration;
  
  for (const activity of activities) {
    const actStart = timeToMinutes(activity.time);
    const actEnd = actStart + (activity.duration || 120);
    
    if (
      (start >= actStart && start < actEnd) ||
      (end > actStart && end <= actEnd) ||
      (start <= actStart && end >= actEnd)
    ) {
      conflicts.push(activity);
    }
  }
  
  return conflicts;
}

function findOptimalTimeSlot(
  activities: any[],
  duration: number,
  preferences: any
): string | null {
  // Define day boundaries based on preferences
  const dayStart = preferences?.earlyBird ? 7 * 60 : 9 * 60; // 7am or 9am
  const dayEnd = preferences?.nightOwl ? 22 * 60 : 20 * 60; // 10pm or 8pm
  
  // Sort activities by time
  const sorted = [...activities].sort((a, b) => 
    timeToMinutes(a.time) - timeToMinutes(b.time)
  );
  
  // Check slot before first activity
  if (sorted.length === 0 || timeToMinutes(sorted[0].time) - dayStart >= duration) {
    return minutesToTime(dayStart);
  }
  
  // Check slots between activities
  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = timeToMinutes(sorted[i].time) + (sorted[i].duration || 120);
    const nextStart = timeToMinutes(sorted[i + 1].time);
    
    if (nextStart - currentEnd >= duration + 30) { // 30 min buffer
      return minutesToTime(currentEnd + 15);
    }
  }
  
  // Check slot after last activity
  const lastActivity = sorted[sorted.length - 1];
  const lastEnd = timeToMinutes(lastActivity.time) + (lastActivity.duration || 120);
  
  if (dayEnd - lastEnd >= duration) {
    return minutesToTime(lastEnd + 15);
  }
  
  return null;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
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

function getPreviousActivity(activities: any[], time: string): any | null {
  const targetMinutes = timeToMinutes(time);
  const sorted = [...activities]
    .filter(a => timeToMinutes(a.time) < targetMinutes)
    .sort((a, b) => timeToMinutes(b.time) - timeToMinutes(a.time));
  
  return sorted[0] || null;
}

async function calculateTravelTime(from: any, to: any): Promise<number> {
  // In a real implementation, this would use Google Directions API
  const distance = calculateDistance(from, to);
  // Rough estimate: 30 km/h average speed in city
  return Math.ceil((distance / 1000) / 30 * 60);
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

async function getWeatherForDateTime(
  destination: any,
  date: string,
  time: string
): Promise<any> {
  // This would call weather API
  // For now, return mock data
  return {
    temperature: 22,
    conditions: 'clear',
    suitable: true
  };
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
      const actTime = timeToMinutes(activity.time);
      return actTime >= times.start && actTime <= times.end && 
             (activity.category === 'restaurant' || activity.category === 'food');
    });
    
    if (!hasMeal) {
      gaps.push(meal);
    }
  }
  
  return gaps;
}