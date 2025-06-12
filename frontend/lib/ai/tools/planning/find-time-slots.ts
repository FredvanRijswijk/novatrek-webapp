import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult } from '../types';

const findTimeSlotsParams = z.object({
  date: z.string(),
  duration: z.number().min(15).max(480), // 15 minutes to 8 hours
  preferences: z.object({
    preferredTimeOfDay: z.enum(['morning', 'afternoon', 'evening', 'any']).optional(),
    avoidMealTimes: z.boolean().default(true),
    bufferTime: z.number().default(30), // Minutes between activities
    considerTravelTime: z.boolean().default(true),
    flexibleDuration: z.boolean().default(false)
  }).optional()
});

interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
  quality: 'ideal' | 'good' | 'acceptable';
  conflicts: string[];
  suggestions: string[];
  nearbyActivities?: any[];
}

interface TimeSlotResult {
  availableSlots: TimeSlot[];
  bestSlot: TimeSlot | null;
  daySchedule: {
    totalActivities: number;
    busyHours: number;
    freeHours: number;
    mealsCovered: boolean;
  };
  warnings: string[];
}

export const findTimeSlotsTool: TravelTool<z.infer<typeof findTimeSlotsParams>, TimeSlotResult> = {
  id: 'find_time_slots',
  name: 'Find Available Time Slots',
  description: 'Intelligently find available time slots in the itinerary with conflict detection and optimization',
  category: 'planning',
  parameters: findTimeSlotsParams,
  
  async execute(params, context) {
    try {
      const { date, duration, preferences = {} } = params;
      
      // Get the trip day from itinerary or tripDays - handle both date formats
      const tripDays = context.trip.itinerary || context.tripDays || [];
      const tripDay = tripDays.find(day => {
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
        return dayDate === date;
      });
      
      if (!tripDay) {
        console.log('Available trip days:', tripDays.map(d => ({
          id: d.id,
          date: d.date,
          extracted: (() => {
            if (d.date?.toDate) {
              return d.date.toDate().toISOString().split('T')[0];
            } else if (d.date instanceof Date) {
              return d.date.toISOString().split('T')[0];
            } else if (typeof d.date === 'string' && d.date.includes('T')) {
              return d.date.split('T')[0];
            } else {
              return d.date;
            }
          })()
        })));
        console.log('Looking for date:', date);
        
        if (tripDays.length === 0) {
          return {
            success: false,
            error: `No trip days exist yet. The trip needs to have days created first. Try asking me to "create trip days" or "set up trip dates".`
          };
        }
        
        const availableDates = tripDays.map(d => {
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
          error: `No trip day found for date ${date}. Available dates: ${availableDates.join(', ')}`
        };
      }
      
      const existingActivities = tripDay.activities || [];
      const availableSlots: TimeSlot[] = [];
      
      // Define day boundaries based on user preferences
      const dayStart = getPreferredDayStart(context.preferences);
      const dayEnd = getPreferredDayEnd(context.preferences);
      
      // Define meal times to avoid if requested
      const mealTimes = preferences.avoidMealTimes ? getMealTimes(context.preferences) : [];
      
      // Sort activities by time
      const sortedActivities = [...existingActivities].sort((a, b) => 
        timeToMinutes(a.time) - timeToMinutes(b.time)
      );
      
      // Find gaps in the schedule
      let currentTime = dayStart;
      
      for (const activity of sortedActivities) {
        const activityStart = timeToMinutes(activity.time);
        const activityEnd = activityStart + (activity.duration || 120);
        
        // Check gap before this activity
        if (currentTime < activityStart) {
          const gapDuration = activityStart - currentTime;
          
          if (gapDuration >= duration + (preferences.bufferTime || 30)) {
            // Evaluate possible slots in this gap
            evaluateGapSlots(
              currentTime,
              activityStart,
              duration,
              preferences,
              mealTimes,
              existingActivities,
              availableSlots,
              context
            );
          }
        }
        
        currentTime = Math.max(currentTime, activityEnd + (preferences.bufferTime || 30));
      }
      
      // Check remaining time at end of day
      if (currentTime < dayEnd) {
        const gapDuration = dayEnd - currentTime;
        
        if (gapDuration >= duration) {
          evaluateGapSlots(
            currentTime,
            dayEnd,
            duration,
            preferences,
            mealTimes,
            existingActivities,
            availableSlots,
            context
          );
        }
      }
      
      // Rank slots by quality
      const rankedSlots = rankTimeSlots(availableSlots, preferences, context);
      
      // Calculate day statistics
      const dayStats = calculateDayStatistics(existingActivities, mealTimes);
      
      // Generate warnings
      const warnings = generateScheduleWarnings(
        rankedSlots,
        dayStats,
        existingActivities,
        context
      );
      
      return {
        success: true,
        data: {
          availableSlots: rankedSlots,
          bestSlot: rankedSlots[0] || null,
          daySchedule: dayStats,
          warnings
        },
        metadata: {
          totalSlotsFound: rankedSlots.length,
          algorithm: 'smart-gap-detection',
          considerationFactors: ['meal-times', 'travel-time', 'preferences', 'weather']
        }
      };
      
    } catch (error) {
      console.error('Find time slots error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find time slots'
      };
    }
  }
};

function evaluateGapSlots(
  gapStart: number,
  gapEnd: number,
  duration: number,
  preferences: any,
  mealTimes: any[],
  existingActivities: any[],
  availableSlots: TimeSlot[],
  context: ToolContext
) {
  const bufferTime = preferences.bufferTime || 30;
  let slotStart = gapStart;
  
  while (slotStart + duration <= gapEnd) {
    const slotEnd = slotStart + duration;
    
    // Check meal time conflicts
    const mealConflicts = checkMealTimeConflicts(slotStart, slotEnd, mealTimes);
    
    // Check if slot matches preferred time of day
    const timeOfDayMatch = checkTimeOfDayPreference(
      slotStart,
      preferences.preferredTimeOfDay
    );
    
    // Calculate travel time if needed
    let travelTimeIssue = false;
    if (preferences.considerTravelTime) {
      const prevActivity = findPreviousActivity(existingActivities, slotStart);
      const nextActivity = findNextActivity(existingActivities, slotEnd);
      
      if (prevActivity || nextActivity) {
        // In real implementation, would calculate actual travel time
        travelTimeIssue = false; // Placeholder
      }
    }
    
    // Determine slot quality
    let quality: 'ideal' | 'good' | 'acceptable' = 'acceptable';
    const conflicts: string[] = [];
    const suggestions: string[] = [];
    
    if (mealConflicts.length === 0 && timeOfDayMatch && !travelTimeIssue) {
      quality = 'ideal';
    } else if (mealConflicts.length === 0 && !travelTimeIssue) {
      quality = 'good';
    }
    
    if (mealConflicts.length > 0) {
      conflicts.push(...mealConflicts.map(m => `Conflicts with ${m}`));
    }
    
    if (!timeOfDayMatch && preferences.preferredTimeOfDay !== 'any') {
      suggestions.push(`Not in preferred ${preferences.preferredTimeOfDay} time`);
    }
    
    // Add weather consideration
    if (context.weather) {
      const weatherSuitability = evaluateWeatherForTime(
        minutesToTime(slotStart),
        context.weather
      );
      if (weatherSuitability.suggestion) {
        suggestions.push(weatherSuitability.suggestion);
      }
    }
    
    availableSlots.push({
      startTime: minutesToTime(slotStart),
      endTime: minutesToTime(slotEnd),
      duration,
      quality,
      conflicts,
      suggestions
    });
    
    // Move to next potential slot (15-minute increments)
    slotStart += 15;
  }
}

function checkMealTimeConflicts(
  startMinutes: number,
  endMinutes: number,
  mealTimes: any[]
): string[] {
  const conflicts: string[] = [];
  
  for (const meal of mealTimes) {
    if (
      (startMinutes >= meal.start && startMinutes < meal.end) ||
      (endMinutes > meal.start && endMinutes <= meal.end) ||
      (startMinutes <= meal.start && endMinutes >= meal.end)
    ) {
      conflicts.push(meal.name);
    }
  }
  
  return conflicts;
}

function checkTimeOfDayPreference(
  timeMinutes: number,
  preference?: string
): boolean {
  if (!preference || preference === 'any') return true;
  
  const hour = Math.floor(timeMinutes / 60);
  
  switch (preference) {
    case 'morning':
      return hour >= 6 && hour < 12;
    case 'afternoon':
      return hour >= 12 && hour < 17;
    case 'evening':
      return hour >= 17 && hour < 22;
    default:
      return true;
  }
}

function rankTimeSlots(
  slots: TimeSlot[],
  preferences: any,
  context: ToolContext
): TimeSlot[] {
  return slots.sort((a, b) => {
    // Quality-based sorting
    const qualityScore = { ideal: 3, good: 2, acceptable: 1 };
    const aQuality = qualityScore[a.quality];
    const bQuality = qualityScore[b.quality];
    
    if (aQuality !== bQuality) {
      return bQuality - aQuality;
    }
    
    // Fewer conflicts is better
    if (a.conflicts.length !== b.conflicts.length) {
      return a.conflicts.length - b.conflicts.length;
    }
    
    // Prefer slots that match time of day preference
    if (preferences.preferredTimeOfDay && preferences.preferredTimeOfDay !== 'any') {
      const aMatch = checkTimeOfDayPreference(
        timeToMinutes(a.startTime),
        preferences.preferredTimeOfDay
      );
      const bMatch = checkTimeOfDayPreference(
        timeToMinutes(b.startTime),
        preferences.preferredTimeOfDay
      );
      
      if (aMatch !== bMatch) {
        return aMatch ? -1 : 1;
      }
    }
    
    // Default to chronological order
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
}

function calculateDayStatistics(activities: any[], mealTimes: any[]) {
  const totalMinutes = activities.reduce((sum, act) => sum + (act.duration || 120), 0);
  const mealsCovered = mealTimes.some(meal => 
    activities.some(act => 
      act.category === 'restaurant' || act.category === 'food'
    )
  );
  
  return {
    totalActivities: activities.length,
    busyHours: Math.round(totalMinutes / 60 * 10) / 10,
    freeHours: Math.round((24 - totalMinutes / 60) * 10) / 10,
    mealsCovered
  };
}

function generateScheduleWarnings(
  slots: TimeSlot[],
  dayStats: any,
  activities: any[],
  context: ToolContext
): string[] {
  const warnings: string[] = [];
  
  if (slots.length === 0) {
    warnings.push('No available time slots found. Consider removing or shortening existing activities.');
  }
  
  if (dayStats.busyHours > 10) {
    warnings.push('Day is quite packed. Consider spreading activities across multiple days.');
  }
  
  if (!dayStats.mealsCovered) {
    warnings.push('No meal times scheduled. Remember to plan for breakfast, lunch, and dinner.');
  }
  
  if (activities.length > 6) {
    warnings.push('Many activities scheduled. This might be tiring.');
  }
  
  return warnings;
}

// Helper functions
function getPreferredDayStart(preferences: any): number {
  return preferences?.earlyBird ? 7 * 60 : 9 * 60;
}

function getPreferredDayEnd(preferences: any): number {
  return preferences?.nightOwl ? 23 * 60 : 21 * 60;
}

function getMealTimes(preferences: any) {
  return [
    { name: 'breakfast', start: 7 * 60, end: 10 * 60 },
    { name: 'lunch', start: 12 * 60, end: 14 * 60 },
    { name: 'dinner', start: 18 * 60, end: 21 * 60 }
  ];
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

function findPreviousActivity(activities: any[], timeMinutes: number): any | null {
  return activities
    .filter(a => timeToMinutes(a.time) + (a.duration || 120) <= timeMinutes)
    .sort((a, b) => timeToMinutes(b.time) - timeToMinutes(a.time))[0] || null;
}

function findNextActivity(activities: any[], timeMinutes: number): any | null {
  return activities
    .filter(a => timeToMinutes(a.time) >= timeMinutes)
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))[0] || null;
}

function evaluateWeatherForTime(time: string, weather: any) {
  // Placeholder - in real implementation would check hourly forecast
  const hour = parseInt(time.split(':')[0]);
  
  if (weather.conditions === 'rain' && hour >= 12 && hour <= 16) {
    return { 
      suitable: false, 
      suggestion: 'Rain expected in afternoon - consider indoor activities' 
    };
  }
  
  return { suitable: true };
}