/**
 * Trip Service V2 - Orchestrates operations across subcollections
 * Provides high-level operations that span multiple models
 */

import { TripModelV2 } from '@/lib/models/v2/trip-model-v2';
import { DayModelV2 } from '@/lib/models/v2/day-model-v2';
import { ActivityModelV2 } from '@/lib/models/v2/activity-model-v2';
import { TripV2, DayV2, ActivityV2 } from '@/types/travel-v2';
import { normalizeDate } from '@/lib/utils/date-helpers';

export interface FullTripData {
  trip: TripV2;
  days: DayWithActivities[];
}

export interface DayWithActivities extends DayV2 {
  activities: ActivityV2[];
  accommodations?: any[]; // TODO: Add when AccommodationModelV2 is created
  transportation?: any[]; // TODO: Add when TransportationModelV2 is created
}

export class TripServiceV2 {
  private tripModel = new TripModelV2();
  private dayModel = new DayModelV2();
  private activityModel = new ActivityModelV2();

  /**
   * Create a new trip with initial days
   */
  async createTrip(
    tripData: Omit<TripV2, 'id' | 'createdAt' | 'updatedAt' | 'userRef' | 'stats'>,
    userId: string
  ): Promise<FullTripData> {
    // Create the trip
    const trip = await this.tripModel.createTrip(tripData, userId);
    
    // Create days based on date range
    const days = await this.dayModel.createDaysForRange(
      trip.id,
      trip.startDate,
      trip.endDate,
      trip.destination?.id,
      trip.destination?.name
    );
    
    // Update trip stats
    await this.tripModel.updateStats(trip.id, {
      totalDays: days.length
    });
    
    return {
      trip,
      days: days.map(day => ({ ...day, activities: [] }))
    };
  }

  /**
   * Get full trip data including all subcollections
   */
  async getFullTrip(tripId: string): Promise<FullTripData | null> {
    try {
      // Get trip
      const trip = await this.tripModel.getById(tripId);
      if (!trip) return null;
      
      // Get days
      let days = await this.dayModel.getTripDays(tripId);
      
      // Remove any duplicate days first
      if (days.length > 0) {
        const duplicatesRemoved = await this.dayModel.removeDuplicateDays(tripId);
        if (duplicatesRemoved > 0) {
          // Reload days after cleanup
          days = await this.dayModel.getTripDays(tripId);
        }
      }
      
      // If no days exist, create them based on trip dates
      if (days.length === 0 && trip.startDate && trip.endDate) {
        console.log('No days found for trip, creating days from trip dates');
        days = await this.dayModel.createDaysForRange(
          trip.id,
          trip.startDate,
          trip.endDate,
          trip.destinationId,
          trip.destinationName
        );
      }
      
      // Get activities for each day (in parallel)
      const daysWithActivities = await Promise.all(
        days.map(async (day) => {
          try {
            const activities = await this.activityModel.getDayActivities(tripId, day.id);
            return {
              ...day,
              activities: activities || []
            };
          } catch (error) {
            console.error(`Error loading activities for day ${day.id}:`, error);
            return {
              ...day,
              activities: []
            };
          }
        })
      );
      
      return {
        trip,
        days: daysWithActivities
      };
    } catch (error) {
      console.error('Error in getFullTrip:', error);
      throw error;
    }
  }

  /**
   * Add activity to trip
   */
  async addActivity(
    tripId: string,
    date: string,
    activityData: Omit<ActivityV2, 'id' | 'createdAt' | 'updatedAt' | 'tripId' | 'dayId'>
  ): Promise<ActivityV2> {
    // Find or create day
    let day = await this.dayModel.getDayByDate(tripId, date);
    
    if (!day) {
      // Create day if it doesn't exist
      const trip = await this.tripModel.getById(tripId);
      if (!trip) throw new Error('Trip not found');
      
      const dayNumber = await this.dayModel.count([tripId]) + 1;
      day = await this.dayModel.createDay(tripId, {
        dayNumber,
        date: normalizeDate(date),
        type: 'destination',
        destinationId: trip.destination?.id,
        destinationName: trip.destination?.name
      });
    }
    
    // Check for time conflicts
    if (activityData.startTime && activityData.duration) {
      const conflicts = await this.activityModel.checkTimeConflicts(
        tripId,
        day.id,
        activityData.startTime,
        activityData.duration
      );
      
      if (conflicts.length > 0) {
        console.warn('Time conflicts detected:', conflicts);
        // Could throw error or handle conflicts
      }
    }
    
    // Create activity
    const activity = await this.activityModel.createActivity(
      tripId,
      day.id,
      activityData
    );
    
    // Update day stats
    const currentStats = day.stats || { activityCount: 0, accommodationCount: 0, transportCount: 0, totalCost: 0 };
    await this.dayModel.updateStats(tripId, day.id, {
      activityCount: currentStats.activityCount + 1,
      totalCost: currentStats.totalCost + (activityData.cost?.amount || 0)
    });
    
    // Update trip stats
    const allActivities = await this.activityModel.getTripActivities(tripId);
    await this.tripModel.updateStats(tripId, {
      totalActivities: allActivities.length
    });
    
    return activity;
  }

  /**
   * Delete trip and all subcollections
   */
  async deleteTrip(tripId: string, userId: string): Promise<void> {
    // Verify ownership
    const hasAccess = await this.tripModel.hasAccess(tripId, userId);
    if (!hasAccess) {
      throw new Error('Unauthorized');
    }
    
    // Get all days
    const days = await this.dayModel.getTripDays(tripId);
    
    // Delete all activities for each day
    await Promise.all(
      days.map(day => this.activityModel.deleteDayActivities(tripId, day.id))
    );
    
    // Delete all days
    await this.dayModel.deleteTripDays(tripId);
    
    // Delete trip
    await this.tripModel.delete(tripId);
  }

  /**
   * Subscribe to full trip updates
   */
  subscribeToFullTrip(
    tripId: string,
    callback: (data: FullTripData | null) => void
  ): () => void {
    let unsubscribers: (() => void)[] = [];
    
    // Subscribe to trip
    const unsubTrip = this.tripModel.subscribe(tripId, async (trip) => {
      if (!trip) {
        callback(null);
        return;
      }
      
      // Get current full data
      const fullData = await this.getFullTrip(tripId);
      callback(fullData);
    });
    unsubscribers.push(unsubTrip);
    
    // Subscribe to days
    const unsubDays = this.dayModel.subscribeToCollection(
      async () => {
        const fullData = await this.getFullTrip(tripId);
        callback(fullData);
      },
      [tripId]
    );
    unsubscribers.push(unsubDays);
    
    // Return cleanup function
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }

  /**
   * Get trip summary (lightweight)
   */
  async getTripSummary(tripId: string): Promise<{
    trip: TripV2;
    dayCount: number;
    activityCount: number;
    nextActivity?: ActivityV2;
  } | null> {
    const trip = await this.tripModel.getById(tripId);
    if (!trip) return null;
    
    const dayCount = await this.dayModel.count([tripId]);
    const activities = await this.activityModel.getTripActivities(tripId);
    
    // Find next upcoming activity
    const now = new Date();
    const nextActivity = activities.find(a => {
      if (!a.startTime) return false;
      // Would need to join with day date to properly check
      return true; // Placeholder
    });
    
    return {
      trip,
      dayCount,
      activityCount: activities.length,
      nextActivity
    };
  }

  /**
   * Copy activities from one day to another
   */
  async copyDayActivities(
    tripId: string,
    fromDayId: string,
    toDayId: string
  ): Promise<ActivityV2[]> {
    const activities = await this.activityModel.getDayActivities(tripId, fromDayId);
    const newActivities: ActivityV2[] = [];
    
    for (const activity of activities) {
      const { id, createdAt, updatedAt, dayId, ...activityData } = activity;
      const newActivity = await this.activityModel.createActivity(
        tripId,
        toDayId,
        activityData
      );
      newActivities.push(newActivity);
    }
    
    // Update day stats
    await this.updateDayStats(tripId, toDayId);
    
    return newActivities;
  }

  /**
   * Update day statistics
   */
  private async updateDayStats(tripId: string, dayId: string): Promise<void> {
    const activities = await this.activityModel.getDayActivities(tripId, dayId);
    
    const stats = {
      activityCount: activities.length,
      totalCost: activities.reduce((sum, act) => sum + (act.cost?.amount || 0), 0)
    };
    
    await this.dayModel.updateStats(tripId, dayId, stats);
  }
}