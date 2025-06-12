import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult } from '../types';
import { getAdminDb } from '@/lib/firebase/admin';
import { addDays, subDays, format, parseISO } from 'date-fns';

const createBookingRemindersParams = z.object({
  scope: z.enum(['trip', 'upcoming', 'activity']).default('trip'),
  activityId: z.string().optional(),
  reminderSettings: z.object({
    enableAutoReminders: z.boolean().default(true),
    reminderDaysBefore: z.array(z.number()).default([7, 3, 1])
  }).optional()
});

interface BookingReminder {
  id: string;
  activityId: string;
  activityName: string;
  activityDate: string;
  reminderDate: string;
  type: 'booking' | 'confirmation' | 'preparation';
  priority: 'high' | 'medium' | 'low';
  message: string;
  bookingUrl?: string;
  tips: string[];
  status: 'pending' | 'sent' | 'dismissed';
}

interface BookingReminderResult {
  reminders: BookingReminder[];
  stats: {
    totalActivities: number;
    bookingRequired: number;
    remindersCreated: number;
    urgentReminders: number;
  };
  recommendations: string[];
}

export const createBookingRemindersTool: TravelTool<z.infer<typeof createBookingRemindersParams>, BookingReminderResult> = {
  id: 'create_booking_reminders',
  name: 'Create Smart Booking Reminders',
  description: 'Analyzes trip activities and creates intelligent booking reminders based on activity type, popularity, and timing',
  category: 'booking',
  parameters: createBookingRemindersParams,
  requiresAuth: true,
  
  async execute(params, context) {
    try {
      const { scope, activityId, reminderSettings = { enableAutoReminders: true, reminderDaysBefore: [7, 3, 1] } } = params;
      
      // Gather activities to analyze
      const activities = gatherActivities(context, scope, activityId);
      
      if (activities.length === 0) {
        return {
          success: true,
          data: {
            reminders: [],
            stats: {
              totalActivities: 0,
              bookingRequired: 0,
              remindersCreated: 0,
              urgentReminders: 0
            },
            recommendations: ['No activities found to create reminders for.']
          }
        };
      }
      
      // Analyze each activity and create appropriate reminders
      const reminders: BookingReminder[] = [];
      let bookingRequiredCount = 0;
      let urgentCount = 0;
      
      for (const { activity, date } of activities) {
        const activityReminders = analyzeAndCreateReminders(
          activity,
          date,
          reminderSettings,
          context
        );
        
        reminders.push(...activityReminders);
        
        if (requiresBooking(activity)) {
          bookingRequiredCount++;
        }
        
        // Count urgent reminders (within 3 days)
        const daysUntil = Math.floor((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 3 && requiresBooking(activity)) {
          urgentCount++;
        }
      }
      
      // Sort reminders by date
      reminders.sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime());
      
      // Save reminders to database
      if (reminders.length > 0 && reminderSettings.enableAutoReminders) {
        await saveRemindersToDatabase(context.trip.id, context.userId, reminders);
      }
      
      // Generate recommendations
      const recommendations = generateBookingRecommendations(activities, reminders, context);
      
      return {
        success: true,
        data: {
          reminders,
          stats: {
            totalActivities: activities.length,
            bookingRequired: bookingRequiredCount,
            remindersCreated: reminders.length,
            urgentReminders: urgentCount
          },
          recommendations
        },
        metadata: {
          confidence: 0.95,
          source: 'smart-booking-analyzer'
        }
      };
      
    } catch (error) {
      console.error('Create booking reminders error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create booking reminders'
      };
    }
  }
};

function gatherActivities(
  context: ToolContext,
  scope: string,
  activityId?: string
): Array<{ activity: any; date: string }> {
  const activities: Array<{ activity: any; date: string }> = [];
  
  if (scope === 'activity' && activityId) {
    // Find specific activity
    for (const day of context.tripDays || []) {
      const activity = day.activities?.find((a: any) => a.id === activityId);
      if (activity) {
        activities.push({ activity, date: day.date });
        break;
      }
    }
  } else if (scope === 'upcoming') {
    // Get activities in the next 14 days
    const fourteenDaysFromNow = addDays(new Date(), 14);
    
    for (const day of context.tripDays || []) {
      const dayDate = new Date(day.date);
      if (dayDate >= new Date() && dayDate <= fourteenDaysFromNow) {
        day.activities?.forEach((activity: any) => {
          activities.push({ activity, date: day.date });
        });
      }
    }
  } else {
    // Get all trip activities
    for (const day of context.tripDays || []) {
      day.activities?.forEach((activity: any) => {
        activities.push({ activity, date: day.date });
      });
    }
  }
  
  return activities;
}

function analyzeAndCreateReminders(
  activity: any,
  date: string,
  reminderSettings: any,
  context: ToolContext
): BookingReminder[] {
  const reminders: BookingReminder[] = [];
  const activityDate = new Date(date);
  const now = new Date();
  
  // Skip past activities
  if (activityDate < now) {
    return reminders;
  }
  
  const bookingNeeded = requiresBooking(activity);
  const bookingUrgency = calculateBookingUrgency(activity, activityDate);
  
  if (bookingNeeded || bookingUrgency.recommended) {
    // Create reminders based on settings
    reminderSettings.reminderDaysBefore.forEach((daysBefore: number) => {
      const reminderDate = subDays(activityDate, daysBefore);
      
      // Only create reminder if it's in the future
      if (reminderDate > now) {
        const reminder: BookingReminder = {
          id: `reminder-${activity.id}-${daysBefore}d`,
          activityId: activity.id,
          activityName: activity.name,
          activityDate: date,
          reminderDate: reminderDate.toISOString(),
          type: daysBefore >= 7 ? 'booking' : daysBefore >= 3 ? 'confirmation' : 'preparation',
          priority: bookingUrgency.priority,
          message: generateReminderMessage(activity, daysBefore, bookingUrgency),
          bookingUrl: activity.bookingUrl,
          tips: generateBookingTips(activity, context),
          status: 'pending'
        };
        
        reminders.push(reminder);
      }
    });
  }
  
  return reminders;
}

function requiresBooking(activity: any): boolean {
  // Explicit booking required flag
  if (activity.bookingRequired) return true;
  
  // Check activity type
  const bookingTypes = ['restaurant', 'tour', 'show', 'experience', 'attraction'];
  if (bookingTypes.includes(activity.category?.toLowerCase())) {
    // High-rated restaurants often need reservations
    if (activity.category === 'restaurant' && activity.rating >= 4.5) {
      return true;
    }
  }
  
  // Check for booking-related keywords
  const bookingKeywords = ['reservation', 'booking', 'ticket', 'advance', 'limited', 'popular'];
  const searchText = `${activity.name} ${activity.description || ''}`.toLowerCase();
  
  return bookingKeywords.some(keyword => searchText.includes(keyword));
}

function calculateBookingUrgency(activity: any, activityDate: Date): {
  recommended: boolean;
  priority: 'high' | 'medium' | 'low';
  reason: string;
} {
  const daysUntil = Math.floor((activityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  // Expert recommended activities
  if (activity.expertRecommended || activity.rankingFactors?.expertEndorsed) {
    return {
      recommended: true,
      priority: daysUntil <= 7 ? 'high' : 'medium',
      reason: 'Expert-recommended venue - likely to be busy'
    };
  }
  
  // High-rated venues
  if (activity.rating >= 4.7 && activity.userRatingCount > 500) {
    return {
      recommended: true,
      priority: daysUntil <= 14 ? 'high' : 'medium',
      reason: 'Highly popular venue with excellent ratings'
    };
  }
  
  // Check if it's a weekend
  const dayOfWeek = activityDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (isWeekend && activity.category === 'restaurant') {
    return {
      recommended: true,
      priority: daysUntil <= 7 ? 'high' : 'medium',
      reason: 'Weekend dining - reservations recommended'
    };
  }
  
  // Check time of activity (dinner time is busier)
  if (activity.time && activity.category === 'restaurant') {
    const hour = parseInt(activity.time.split(':')[0]);
    if (hour >= 18 && hour <= 21) {
      return {
        recommended: true,
        priority: 'medium',
        reason: 'Prime dinner hours - booking advised'
      };
    }
  }
  
  // Museums and attractions
  if (['museum', 'attraction', 'tour'].includes(activity.category?.toLowerCase())) {
    return {
      recommended: true,
      priority: daysUntil <= 3 ? 'high' : 'low',
      reason: 'Skip-the-line tickets may be available'
    };
  }
  
  return {
    recommended: false,
    priority: 'low',
    reason: ''
  };
}

function generateReminderMessage(
  activity: any,
  daysBefore: number,
  urgency: any
): string {
  const activityType = activity.category || 'activity';
  
  if (daysBefore >= 7) {
    return `Time to book your ${activityType} at ${activity.name}! ${urgency.reason}. Booking ahead ensures availability and may offer better rates.`;
  } else if (daysBefore >= 3) {
    return `Reminder: ${activity.name} is in ${daysBefore} days. ${activity.bookingRequired ? 'Please confirm your booking.' : 'Consider making a reservation.'} ${urgency.reason}`;
  } else {
    return `${activity.name} is tomorrow! ${activity.bookingUrl ? 'Check your booking confirmation.' : 'Final chance to make a reservation if needed.'} Don't forget to check opening hours and directions.`;
  }
}

function generateBookingTips(activity: any, context: ToolContext): string[] {
  const tips: string[] = [];
  
  // Restaurant-specific tips
  if (activity.category === 'restaurant') {
    if (context.preferences?.dietary?.length) {
      tips.push(`Mention dietary requirements: ${context.preferences.dietary.join(', ')}`);
    }
    tips.push('Request outdoor seating if weather permits');
    tips.push('Ask about daily specials when booking');
  }
  
  // Museum/attraction tips
  if (['museum', 'attraction'].includes(activity.category?.toLowerCase())) {
    tips.push('Check for online discounts or combo tickets');
    tips.push('Book early morning slots to avoid crowds');
    if (activity.duration > 120) {
      tips.push('This is a longer activity - plan accordingly');
    }
  }
  
  // Tour tips
  if (activity.category === 'tour' || activity.category === 'experience') {
    tips.push('Confirm meeting point and what\'s included');
    tips.push('Check cancellation policy');
    tips.push('Ask about group size limits');
  }
  
  // Weather-dependent activities
  if (activity.outdoor || activity.weatherDependent) {
    tips.push('Check weather forecast before confirming');
    tips.push('Ask about rain/weather cancellation policy');
  }
  
  // General tips
  if (activity.rating >= 4.5) {
    tips.push('Popular venue - book as early as possible');
  }
  
  if (activity.priceLevel >= 3) {
    tips.push('Higher-end venue - check dress code');
  }
  
  return tips.slice(0, 3); // Limit to 3 most relevant tips
}

async function saveRemindersToDatabase(
  tripId: string,
  userId: string,
  reminders: BookingReminder[]
): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error('Admin DB not initialized');
    return;
  }
  
  const batch = adminDb.batch();
  
  for (const reminder of reminders) {
    const reminderRef = adminDb
      .collection('trips')
      .doc(tripId)
      .collection('reminders')
      .doc(reminder.id);
    
    batch.set(reminderRef, {
      ...reminder,
      createdAt: new Date().toISOString(),
      userId
    });
  }
  
  await batch.commit();
}

function generateBookingRecommendations(
  activities: Array<{ activity: any; date: string }>,
  reminders: BookingReminder[],
  context: ToolContext
): string[] {
  const recommendations: string[] = [];
  
  // Count urgent bookings
  const urgentBookings = reminders.filter(r => r.priority === 'high').length;
  if (urgentBookings > 0) {
    recommendations.push(`You have ${urgentBookings} activities that need urgent booking attention`);
  }
  
  // Weekend dining
  const weekendDining = activities.filter(({ activity, date }) => {
    const dayOfWeek = new Date(date).getDay();
    return (dayOfWeek === 0 || dayOfWeek === 6) && activity.category === 'restaurant';
  }).length;
  
  if (weekendDining > 0) {
    recommendations.push(`${weekendDining} restaurant visits are on weekends - book early for best tables`);
  }
  
  // Expert picks
  const expertPicks = activities.filter(({ activity }) => 
    activity.expertRecommended || activity.rankingFactors?.expertEndorsed
  ).length;
  
  if (expertPicks > 0) {
    recommendations.push(`${expertPicks} expert-recommended venues in your itinerary - these fill up quickly`);
  }
  
  // Money-saving tip
  const attractions = activities.filter(({ activity }) => 
    ['museum', 'attraction', 'tour'].includes(activity.category?.toLowerCase())
  ).length;
  
  if (attractions > 2) {
    recommendations.push('Consider looking for combo tickets or city passes for multiple attractions');
  }
  
  // Group size
  if (context.trip.travelers && context.trip.travelers > 4) {
    recommendations.push('Large group bookings may need extra advance notice');
  }
  
  return recommendations;
}