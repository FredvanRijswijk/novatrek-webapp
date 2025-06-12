/**
 * Day Model V2 - Days subcollection model
 */

import { BaseModelV2 } from './base-model';
import { DayV2, COLLECTIONS_V2 } from '@/types/travel-v2';
import { where, orderBy } from 'firebase/firestore';
import { normalizeDate } from '@/lib/utils/date-helpers';

export class DayModelV2 extends BaseModelV2<DayV2> {
  constructor() {
    super((ids: string[]) => COLLECTIONS_V2.DAYS(ids[0])); // ids[0] is tripId
  }

  /**
   * Create a new day
   */
  async createDay(
    tripId: string,
    dayData: Omit<DayV2, 'id' | 'createdAt' | 'updatedAt' | 'tripId' | 'stats'>
  ): Promise<DayV2> {
    const enhancedData = {
      ...dayData,
      tripId,
      date: normalizeDate(dayData.date), // Ensure date is normalized
      stats: {
        activityCount: 0,
        accommodationCount: 0,
        transportCount: 0,
        totalCost: 0
      }
    };
    
    return this.create(enhancedData, [tripId]);
  }

  /**
   * Get all days for a trip
   */
  async getTripDays(tripId: string): Promise<DayV2[]> {
    return this.list(
      [tripId],
      undefined,
      orderBy('date', 'asc')
    );
  }

  /**
   * Get day by date
   */
  async getDayByDate(tripId: string, date: string): Promise<DayV2 | null> {
    const normalizedDate = normalizeDate(date);
    const days = await this.list(
      [tripId],
      [where('date', '==', normalizedDate)]
    );
    
    return days[0] || null;
  }

  /**
   * Update day statistics
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
    
    await this.update(dayId, {
      stats: {
        ...currentDay.stats,
        ...stats,
        lastUpdate: new Date().toISOString()
      }
    }, [tripId]);
  }

  /**
   * Create multiple days for a date range
   */
  async createDaysForRange(
    tripId: string,
    startDate: string,
    endDate: string,
    destinationId?: string,
    destinationName?: string
  ): Promise<DayV2[]> {
    const start = new Date(normalizeDate(startDate) + 'T00:00:00');
    const end = new Date(normalizeDate(endDate) + 'T00:00:00');
    const days: DayV2[] = [];
    
    const batch = this.createBatch();
    let dayNumber = 1;
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayData = {
        tripId,
        dayNumber,
        date: normalizeDate(date),
        type: 'destination' as const,
        destinationId,
        destinationName,
        stats: {
          activityCount: 0,
          accommodationCount: 0,
          transportCount: 0,
          totalCost: 0
        }
      };
      
      const docRef = this.batchCreate(batch, dayData, [tripId]);
      days.push({ ...dayData, id: docRef.id } as DayV2);
      dayNumber++;
    }
    
    await batch.commit();
    return days;
  }

  /**
   * Delete all days for a trip
   */
  async deleteTripDays(tripId: string): Promise<number> {
    const days = await this.getTripDays(tripId);
    const batch = this.createBatch();
    
    days.forEach(day => {
      this.batchDelete(batch, day.id, [tripId]);
    });
    
    await batch.commit();
    return days.length;
  }

  /**
   * Find days with activities
   */
  async getDaysWithActivities(tripId: string): Promise<DayV2[]> {
    return this.list(
      [tripId],
      [where('stats.activityCount', '>', 0)],
      orderBy('date', 'asc')
    );
  }

  /**
   * Get travel days
   */
  async getTravelDays(tripId: string): Promise<DayV2[]> {
    return this.list(
      [tripId],
      [where('type', '==', 'travel')],
      orderBy('date', 'asc')
    );
  }
}