import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult } from '../types';
import { DayModelV2 } from '@/lib/models/v2/day-model-v2';
import { TripModelV2 } from '@/lib/models/v2/trip-model-v2';
import { normalizeDate } from '@/lib/utils/date-helpers';

const createTripDaysParams = z.object({
  mode: z.enum(['full', 'specific']).default('full'),
  specificDates: z.array(z.string()).optional(),
  includeNotes: z.boolean().default(true)
});

interface CreateDaysResult {
  daysCreated: number;
  dates: string[];
  message: string;
}

export const createTripDaysV2Tool: TravelTool<z.infer<typeof createTripDaysParams>, CreateDaysResult> = {
  id: 'create_trip_days',
  name: 'Create Trip Days',
  description: 'Create day entries for the trip itinerary',
  category: 'planning',
  parameters: createTripDaysParams,
  requiresAuth: true,
  
  async execute(params, context) {
    // Use admin services from context if available, otherwise create client instances
    const dayModel = context.adminServices?.dayModel || new DayModelV2();
    const tripModel = context.adminServices?.tripService || new TripModelV2();
    
    try {
      const { mode, specificDates, includeNotes } = params;
      
      // Check existing days
      const existingDays = await dayModel.getTripDays(context.trip.id);
      const existingDates = new Set(existingDays.map(d => d.date));
      
      let datesToCreate: string[] = [];
      
      if (mode === 'full') {
        // Create days for the entire trip duration
        const startDate = new Date(normalizeDate(context.trip.startDate) + 'T00:00:00');
        const endDate = new Date(normalizeDate(context.trip.endDate) + 'T00:00:00');
        
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
          const dateStr = normalizeDate(date);
          if (!existingDates.has(dateStr)) {
            datesToCreate.push(dateStr);
          }
        }
      } else if (specificDates) {
        // Create specific days
        datesToCreate = specificDates
          .map(d => normalizeDate(d))
          .filter(d => !existingDates.has(d));
      }
      
      if (datesToCreate.length === 0) {
        return {
          success: true,
          data: {
            daysCreated: 0,
            dates: [],
            message: 'All requested days already exist'
          }
        };
      }
      
      // Create days using V2 model
      const createdDays = [];
      let dayNumber = existingDays.length;
      
      for (const dateStr of datesToCreate) {
        dayNumber++;
        
        // Determine destination for this day
        let destinationId = context.trip.destination?.id;
        let destinationName = context.trip.destination?.name;
        
        // For multi-destination trips, find the appropriate destination
        if (context.trip.destinations && context.trip.destinations.length > 0) {
          const date = new Date(dateStr);
          for (const dest of context.trip.destinations) {
            const arrival = new Date(normalizeDate(dest.arrivalDate));
            const departure = new Date(normalizeDate(dest.departureDate));
            
            if (date >= arrival && date <= departure) {
              destinationId = dest.destination.id;
              destinationName = dest.destination.name;
              break;
            }
          }
        }
        
        const dayData = {
          dayNumber,
          date: dateStr,
          type: 'destination' as const,
          destinationId,
          destinationName,
          notes: includeNotes ? this.generateDayNotes(dayNumber, dateStr, destinationName) : undefined
        };
        
        const createdDay = await dayModel.createDay(context.trip.id, dayData);
        createdDays.push(createdDay);
      }
      
      // Update trip statistics
      await tripModel.updateStats(context.trip.id, {
        totalDays: existingDays.length + createdDays.length
      });
      
      return {
        success: true,
        data: {
          daysCreated: createdDays.length,
          dates: createdDays.map(d => d.date),
          message: `Created ${createdDays.length} days for your trip`
        },
        metadata: {
          confidence: 1.0,
          source: 'trip-planner-v2'
        }
      };
      
    } catch (error) {
      console.error('Create trip days V2 error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create trip days'
      };
    }
  },
  
  generateDayNotes(dayNumber: number, date: string, destinationName?: string): string {
    const dayOfWeek = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
    
    const notes = [
      `Day ${dayNumber} - ${dayOfWeek}`,
      destinationName ? `Exploring ${destinationName}` : 'Adventure awaits!'
    ];
    
    // Add contextual suggestions based on day
    if (dayNumber === 1) {
      notes.push('Arrival day - consider lighter activities');
    } else if (dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday') {
      notes.push('Weekend - popular attractions may be busier');
    }
    
    return notes.join('\n');
  }
};