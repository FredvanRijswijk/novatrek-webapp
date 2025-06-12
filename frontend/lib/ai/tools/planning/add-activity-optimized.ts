import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult } from '../types';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
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

// Removed local normalizeDate function - now using the shared utility

export const addActivityOptimizedTool: TravelTool<z.infer<typeof addActivityParams>, AddActivityResult> = {
  id: 'add_activity',
  name: 'Add Activity to Itinerary',
  description: 'Intelligently add an activity to the trip itinerary with conflict detection and optimization',
  category: 'planning',
  parameters: addActivityParams,
  requiresAuth: true,
  
  async execute(params, context) {
    const startTime = Date.now();
    
    try {
      const { activity, date, time, notes, autoOptimize } = params;
      
      // Normalize the target date
      const targetDate = normalizeDate(date);
      
      // Find the trip day index and day data
      let tripDayIndex = -1;
      let tripDay = null;
      
      // Use normalized dates for comparison
      for (let i = 0; i < context.tripDays.length; i++) {
        const dayDate = normalizeDate(context.tripDays[i].date);
        if (dayDate === targetDate) {
          tripDayIndex = i;
          tripDay = context.tripDays[i];
          break;
        }
      }
      
      if (!tripDay || tripDayIndex === -1) {
        const availableDates = context.tripDays.map(d => normalizeDate(d.date));
        return {
          success: false,
          error: `No trip day found for date ${targetDate}. Available dates: ${availableDates.join(', ')}`
        };
      }
      
      const existingActivities = tripDay.activities || [];
      let finalTime = time || '10:00';
      const warnings: string[] = [];
      const suggestions: string[] = [];
      
      // Check for conflicts (synchronous operation)
      const conflicts = checkTimeConflicts(existingActivities, finalTime, activity.duration);
      
      if (conflicts.length > 0 && autoOptimize) {
        const optimalTime = findOptimalTimeSlot(existingActivities, activity.duration, context.preferences);
        
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
      
      // Calculate travel time synchronously
      const previousActivity = getPreviousActivity(existingActivities, finalTime);
      let travelTime = 0;
      
      if (previousActivity?.location && activity.location) {
        travelTime = calculateTravelTimeSync(previousActivity.location, activity.location);
        if (travelTime > 30) {
          warnings.push(`${travelTime} minutes travel time from previous activity`);
        }
      }
      
      // Create the enhanced activity
      const enhancedActivity: any = {
        id: activity.id || `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: activity.name,
        location: activity.location,
        duration: activity.duration,
        time: finalTime,
        startTime: finalTime, // Add both for compatibility
        endTime: calculateEndTime(finalTime, activity.duration),
        addedAt: new Date().toISOString(),
        novatrekEnhanced: true,
        type: activity.category || 'activity'
      };
      
      // Add optional fields
      if (activity.description) enhancedActivity.description = activity.description;
      if (activity.price !== undefined) enhancedActivity.price = activity.price;
      if (activity.category) enhancedActivity.category = activity.category;
      if (activity.bookingRequired) enhancedActivity.bookingRequired = activity.bookingRequired;
      if (activity.bookingUrl) enhancedActivity.bookingUrl = activity.bookingUrl;
      if (activity.photos?.length) enhancedActivity.photos = activity.photos;
      if (activity.expertRecommended) enhancedActivity.expertRecommended = activity.expertRecommended;
      if (notes) enhancedActivity.notes = notes;
      if (travelTime > 0) enhancedActivity.travelTime = travelTime;
      
      // Update Firestore efficiently
      const adminDb = getAdminDb();
      if (!adminDb) {
        return {
          success: false,
          error: 'Database not initialized'
        };
      }
      
      // Get current trip data to ensure we have the latest state
      const tripRef = adminDb.collection('trips').doc(context.trip.id);
      const tripSnap = await tripRef.get();
      
      if (!tripSnap.exists) {
        return {
          success: false,
          error: 'Trip not found'
        };
      }
      
      const currentData = tripSnap.data()!;
      const currentItinerary = currentData.itinerary || [];
      
      // Update the specific day in the itinerary
      const updatedItinerary = currentItinerary.map((day: any, index: number) => {
        if (index === tripDayIndex || normalizeDate(day.date) === targetDate) {
          const updatedActivities = [...(day.activities || []), enhancedActivity]
            .sort((a, b) => (a.time || a.startTime || '').localeCompare(b.time || b.startTime || ''));
          
          return {
            ...day,
            activities: updatedActivities
          };
        }
        return day;
      });
      
      // Update the trip document
      await tripRef.update({
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
      
      const executionTime = Date.now() - startTime;
      console.log(`Add activity completed in ${executionTime}ms`);
      
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
          source: 'intelligent-planner',
          executionTime
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

// Synchronous helper functions
function checkTimeConflicts(
  activities: any[],
  startTime: string,
  duration: number
): any[] {
  const conflicts = [];
  const start = timeToMinutes(startTime);
  const end = start + duration;
  
  for (const activity of activities) {
    const actStart = timeToMinutes(activity.time || activity.startTime || '10:00');
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
  const dayStart = preferences?.earlyBird ? 7 * 60 : 9 * 60;
  const dayEnd = preferences?.nightOwl ? 22 * 60 : 20 * 60;
  
  const sorted = [...activities].sort((a, b) => 
    timeToMinutes(a.time || a.startTime || '10:00') - timeToMinutes(b.time || b.startTime || '10:00')
  );
  
  if (sorted.length === 0 || timeToMinutes(sorted[0].time || sorted[0].startTime || '10:00') - dayStart >= duration) {
    return minutesToTime(dayStart);
  }
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = timeToMinutes(sorted[i].time || sorted[i].startTime || '10:00') + (sorted[i].duration || 120);
    const nextStart = timeToMinutes(sorted[i + 1].time || sorted[i + 1].startTime || '10:00');
    
    if (nextStart - currentEnd >= duration + 30) {
      return minutesToTime(currentEnd + 15);
    }
  }
  
  const lastActivity = sorted[sorted.length - 1];
  const lastEnd = timeToMinutes(lastActivity.time || lastActivity.startTime || '10:00') + (lastActivity.duration || 120);
  
  if (dayEnd - lastEnd >= duration) {
    return minutesToTime(lastEnd + 15);
  }
  
  return null;
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

function getPreviousActivity(activities: any[], time: string): any | null {
  const targetMinutes = timeToMinutes(time);
  const sorted = [...activities]
    .filter(a => timeToMinutes(a.time || a.startTime || '10:00') < targetMinutes)
    .sort((a, b) => timeToMinutes(b.time || b.startTime || '10:00') - timeToMinutes(a.time || a.startTime || '10:00'));
  
  return sorted[0] || null;
}

// Synchronous travel time calculation
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