/**
 * Day Model Admin V2 - Admin version for server-side operations
 */

import { BaseModelAdminV2 } from './base-model-admin';
import { DayV2, COLLECTIONS_V2 } from '@/types/travel-v2';
import { FieldValue } from 'firebase-admin/firestore';
import { normalizeDate } from '@/lib/utils/date-helpers';
import { addDays, differenceInDays } from 'date-fns';

export class DayModelAdminV2 extends BaseModelAdminV2<DayV2> {
  constructor(db: FirebaseFirestore.Firestore) {
    super(
      db,
      (ids: string[]) => COLLECTIONS_V2.DAYS(ids[0]) // ids[0] is tripId
    );
  }

  /**
   * Create a new day with server timestamp
   */
  async createDay(
    tripId: string,
    dayData: Omit<DayV2, 'id' | 'createdAt' | 'updatedAt' | 'tripId' | 'stats'>
  ): Promise<DayV2> {
    const docRef = this.db
      .collection('trips')
      .doc(tripId)
      .collection('days')
      .doc();

    const enhancedData = {
      ...dayData,
      id: docRef.id,
      tripId,
      date: normalizeDate(dayData.date), // Ensure date is normalized
      stats: {
        activityCount: 0,
        accommodationCount: 0,
        transportCount: 0,
        totalCost: 0
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await docRef.set(enhancedData);
    
    const created = await this.getById(docRef.id, [tripId]);
    if (!created) {
      throw new Error('Failed to create day');
    }
    
    return created;
  }

  /**
   * Get all days for a trip
   */
  async getTripDays(tripId: string): Promise<DayV2[]> {
    const snapshot = await this.db
      .collection('trips')
      .doc(tripId)
      .collection('days')
      .orderBy('date', 'asc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as DayV2));
  }

  /**
   * Get day by date
   */
  async getDayByDate(tripId: string, date: string): Promise<DayV2 | null> {
    const normalizedDate = normalizeDate(date);
    const snapshot = await this.db
      .collection('trips')
      .doc(tripId)
      .collection('days')
      .where('date', '==', normalizedDate)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as DayV2;
  }

  /**
   * Create days for a date range
   */
  async createDaysForRange(
    tripId: string,
    startDate: string | Date,
    endDate: string | Date,
    destinationId?: string,
    destinationName?: string
  ): Promise<DayV2[]> {
    const start = new Date(normalizeDate(startDate) + 'T00:00:00');
    const end = new Date(normalizeDate(endDate) + 'T00:00:00');
    const days = differenceInDays(end, start) + 1;
    
    const createdDays: DayV2[] = [];
    const batch = this.db.batch();
    
    for (let i = 0; i < days; i++) {
      const date = addDays(start, i);
      const dateStr = normalizeDate(date);
      
      // Check if day already exists
      const existing = await this.getDayByDate(tripId, dateStr);
      if (existing) {
        createdDays.push(existing);
        continue;
      }
      
      const docRef = this.db
        .collection('trips')
        .doc(tripId)
        .collection('days')
        .doc();
      
      const dayData = {
        id: docRef.id,
        tripId,
        dayNumber: i + 1,
        date: dateStr,
        type: 'destination' as const,
        destinationId: destinationId || '',
        destinationName: destinationName || '',
        notes: '',
        stats: {
          activityCount: 0,
          accommodationCount: 0,
          transportCount: 0,
          totalCost: 0
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      
      batch.set(docRef, dayData);
      createdDays.push(dayData as DayV2);
    }
    
    await batch.commit();
    return createdDays;
  }

  /**
   * Update day statistics with partial stats
   */
  async updateStats(
    tripId: string,
    dayId: string,
    stats: Partial<DayV2['stats']>
  ): Promise<void> {
    const currentDay = await this.getById(dayId, [tripId]);
    if (!currentDay) {
      throw new Error('Day not found');
    }
    
    await this.db
      .collection('trips')
      .doc(tripId)
      .collection('days')
      .doc(dayId)
      .update({
        stats: {
          ...currentDay.stats,
          ...stats,
          lastUpdate: new Date().toISOString()
        },
        updatedAt: FieldValue.serverTimestamp()
      });
  }

  /**
   * Update day stats (recalculate from activities)
   */
  async updateDayStats(tripId: string, dayId: string): Promise<void> {
    // Get all activities for the day
    const activitiesSnapshot = await this.db
      .collection('trips')
      .doc(tripId)
      .collection('days')
      .doc(dayId)
      .collection('activities')
      .get();

    const activityCount = activitiesSnapshot.size;
    let totalCost = 0;

    activitiesSnapshot.docs.forEach(doc => {
      const activity = doc.data();
      if (activity.cost?.amount) {
        totalCost += activity.cost.amount;
      }
    });

    // Update the day document
    await this.db
      .collection('trips')
      .doc(tripId)
      .collection('days')
      .doc(dayId)
      .update({
        'stats.activityCount': activityCount,
        'stats.totalCost': totalCost,
        updatedAt: FieldValue.serverTimestamp()
      });
  }

  /**
   * Delete a day and all its activities
   */
  async deleteDay(tripId: string, dayId: string): Promise<void> {
    // Delete all activities first
    const activitiesSnapshot = await this.db
      .collection('trips')
      .doc(tripId)
      .collection('days')
      .doc(dayId)
      .collection('activities')
      .get();

    const batch = this.db.batch();
    
    activitiesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete the day document
    batch.delete(
      this.db
        .collection('trips')
        .doc(tripId)
        .collection('days')
        .doc(dayId)
    );

    await batch.commit();
  }

  /**
   * Get day count for a trip
   */
  async count(pathIds: string[]): Promise<number> {
    const snapshot = await this.db
      .collection('trips')
      .doc(pathIds[0])
      .collection('days')
      .count()
      .get();

    return snapshot.data().count;
  }

  /**
   * Remove duplicate days
   */
  async removeDuplicateDays(tripId: string): Promise<number> {
    const allDays = await this.getTripDays(tripId);
    const daysByDate = new Map<string, DayV2[]>();
    
    // Group days by date
    allDays.forEach(day => {
      const date = normalizeDate(day.date);
      if (!daysByDate.has(date)) {
        daysByDate.set(date, []);
      }
      daysByDate.get(date)!.push(day);
    });
    
    let removedCount = 0;
    const batch = this.db.batch();
    
    // Remove duplicates, keeping the first one
    for (const [date, days] of daysByDate) {
      if (days.length > 1) {
        // Keep the first day, delete the rest
        for (let i = 1; i < days.length; i++) {
          batch.delete(
            this.db
              .collection('trips')
              .doc(tripId)
              .collection('days')
              .doc(days[i].id)
          );
          removedCount++;
        }
      }
    }
    
    if (removedCount > 0) {
      await batch.commit();
    }
    
    return removedCount;
  }
}