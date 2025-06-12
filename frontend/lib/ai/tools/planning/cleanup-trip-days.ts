import { z } from 'zod';
import { TravelTool, ToolContext, ToolResult } from '../types';
import { cleanupTripDays } from '@/lib/firebase/trip-cleanup';

const cleanupTripDaysParams = z.object({
  removeDuplicates: z.boolean().default(true)
});

interface CleanupResult {
  originalCount: number;
  cleanedCount: number;
  removedDuplicates: number;
  dates: string[];
}

export const cleanupTripDaysTool: TravelTool<z.infer<typeof cleanupTripDaysParams>, CleanupResult> = {
  id: 'cleanup_trip_days',
  name: 'Cleanup Trip Days',
  description: 'Remove duplicate trip days and ensure proper date ordering',
  category: 'planning',
  parameters: cleanupTripDaysParams,
  requiresAuth: true,
  
  async execute(params, context) {
    try {
      const result = await cleanupTripDays(context.trip.id, context.userId);
      
      return {
        success: true,
        data: result,
        metadata: {
          message: `Cleaned up trip days. Removed ${result.removedDuplicates} duplicates.`
        }
      };
      
    } catch (error) {
      console.error('Cleanup trip days error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup trip days'
      };
    }
  }
};