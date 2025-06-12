import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult } from '../types';
import { getAdminDb } from '@/lib/firebase/admin';

const createTripDaysParams = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  specificDates: z.array(z.string()).optional()
});

interface TripDay {
  id: string;
  date: string;
  activities: any[];
  notes?: string;
}

interface CreateTripDaysResult {
  createdDays: TripDay[];
  existingDays: TripDay[];
  totalDays: number;
}

export const createTripDaysTool: TravelTool<z.infer<typeof createTripDaysParams>, CreateTripDaysResult> = {
  id: 'create_trip_days',
  name: 'Create Trip Days',
  description: 'Create day documents for a trip to enable activity planning',
  category: 'planning',
  parameters: createTripDaysParams,
  requiresAuth: true,
  
  async execute(params, context) {
    try {
      const adminDb = getAdminDb();
      if (!adminDb) {
        return {
          success: false,
          error: 'Database not initialized'
        };
      }

      // Determine which dates to create
      let datesToCreate: string[] = [];
      
      if (params.specificDates && params.specificDates.length > 0) {
        datesToCreate = params.specificDates;
      } else {
        // Use trip start/end dates or params
        const startDate = params.startDate || context.trip.startDate;
        const endDate = params.endDate || context.trip.endDate;
        
        if (!startDate || !endDate) {
          return {
            success: false,
            error: 'No dates specified. Please provide start and end dates or specific dates.'
          };
        }
        
        // Generate all dates between start and end
        datesToCreate = generateDateRange(startDate, endDate);
      }
      
      // Check existing days in the itinerary
      const existingItinerary = context.trip.itinerary || [];
      const existingDaysMap = new Map(
        existingItinerary.map(day => {
          let dateKey: string;
          if (day.date?.toDate) {
            // Firestore Timestamp
            dateKey = day.date.toDate().toISOString().split('T')[0];
          } else if (day.date instanceof Date) {
            // JavaScript Date
            dateKey = day.date.toISOString().split('T')[0];
          } else if (typeof day.date === 'string' && day.date.includes('T')) {
            // ISO string
            dateKey = day.date.split('T')[0];
          } else {
            // Plain date string
            dateKey = day.date;
          }
          return [dateKey, day];
        })
      );
      
      const createdDays: any[] = [];
      const existingDays: any[] = [];
      let dayNumber = existingItinerary.length;
      
      // Create days that don't exist
      for (const dateStr of datesToCreate) {
        if (existingDaysMap.has(dateStr)) {
          existingDays.push(existingDaysMap.get(dateStr)!);
          continue;
        }
        
        dayNumber++;
        const newDay = {
          id: `day-${dayNumber}-${Date.now()}`,
          dayNumber,
          date: new Date(dateStr),
          activities: [],
          notes: '',
          tripId: context.trip.id
        };
        
        createdDays.push(newDay);
      }
      
      // Update the trip's itinerary array if we created new days
      if (createdDays.length > 0) {
        const updatedItinerary = [...existingItinerary, ...createdDays];
        
        // Sort by date
        updatedItinerary.sort((a, b) => {
          const dateA = a.date instanceof Date ? a.date : new Date(a.date);
          const dateB = b.date instanceof Date ? b.date : new Date(b.date);
          return dateA.getTime() - dateB.getTime();
        });
        
        // Update day numbers
        updatedItinerary.forEach((day, index) => {
          day.dayNumber = index + 1;
        });
        
        // Save to Firestore
        await adminDb
          .collection('trips')
          .doc(context.trip.id)
          .update({
            itinerary: updatedItinerary,
            updatedAt: new Date().toISOString()
          });
        
        console.log(`Created ${createdDays.length} trip days in itinerary`);
      }
      
      return {
        success: true,
        data: {
          createdDays,
          existingDays,
          totalDays: createdDays.length + existingDays.length
        },
        metadata: {
          message: createdDays.length > 0 
            ? `Created ${createdDays.length} new days for your trip` 
            : 'All requested days already exist'
        }
      };
      
    } catch (error) {
      console.error('Create trip days error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create trip days'
      };
    }
  }
};

function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Ensure we're working with just dates, no time
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const current = new Date(start);
  
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}