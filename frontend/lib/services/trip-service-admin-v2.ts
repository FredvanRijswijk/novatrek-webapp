/**
 * Trip Service V2 - Admin Version
 * Orchestrates operations across V2 models using Admin SDK
 */

import { Firestore } from 'firebase-admin/firestore';
import { TripModelAdminV2 } from '@/lib/models/v2/admin/trip-model-admin-v2';
import { TripV2, DayV2, ActivityV2 } from '@/types/travel-v2';
import { normalizeDate } from '@/lib/utils/date-helpers';
import { DayWithActivities, FullTripData } from './trip-service-v2';

export class TripServiceAdminV2 {
  private db: Firestore;
  private tripModel: TripModelAdminV2;

  constructor(db: Firestore) {
    this.db = db;
    this.tripModel = new TripModelAdminV2(db);
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
      const daysCollection = this.db.collection(`trips/${tripId}/days`);
      const daysSnapshot = await daysCollection.orderBy('date', 'asc').get();
      
      let days: DayV2[] = daysSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DayV2));
      
      // If no days exist, create them based on trip dates
      if (days.length === 0 && trip.startDate && trip.endDate) {
        console.log('No days found for trip, creating days from trip dates');
        days = await this.createDaysForTrip(
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
          const activitiesCollection = this.db.collection(`trips/${tripId}/days/${day.id}/activities`);
          const activitiesSnapshot = await activitiesCollection.orderBy('startTime', 'asc').get();
          
          const activities: ActivityV2[] = activitiesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as ActivityV2));
          
          return {
            ...day,
            activities
          };
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
   * Check if user has access to trip
   */
  async hasAccess(tripId: string, userId: string): Promise<boolean> {
    return this.tripModel.hasAccess(tripId, userId);
  }

  /**
   * Create days for a trip if they don't exist
   */
  async createDaysForTrip(
    tripId: string, 
    startDate: string, 
    endDate: string,
    destinationId?: string,
    destinationName?: string
  ): Promise<DayV2[]> {
    const start = new Date(normalizeDate(startDate) + 'T00:00:00');
    const end = new Date(normalizeDate(endDate) + 'T00:00:00');
    const days: DayV2[] = [];
    
    const batch = this.db.batch();
    let dayNumber = 1;
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const normalizedDate = normalizeDate(date);
      const dayRef = this.db.collection(`trips/${tripId}/days`).doc();
      
      const dayData = {
        tripId,
        dayNumber,
        date: normalizedDate,
        type: 'destination' as const,
        destinationId,
        destinationName,
        stats: {
          activityCount: 0,
          accommodationCount: 0,
          transportCount: 0,
          totalCost: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      batch.set(dayRef, dayData);
      days.push({ ...dayData, id: dayRef.id } as DayV2);
      dayNumber++;
    }
    
    await batch.commit();
    return days;
  }
}