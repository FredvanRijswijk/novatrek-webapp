/**
 * Day Model V2 - Days subcollection model
 */

import { BaseModelV2 } from './base-model';
import { DayV2, COLLECTIONS_V2, WeatherData } from '@/types/travel-v2';
import { where, orderBy } from 'firebase/firestore';
import { normalizeDate } from '@/lib/utils/date-helpers';
import { WeatherClient } from '@/lib/weather/client';

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
    console.log('updateStats called with:', { tripId, dayId, stats });
    
    const currentDay = await this.getById(dayId, [tripId]);
    if (!currentDay) {
      console.error('Day not found in updateStats:', { tripId, dayId });
      throw new Error(`Day not found: dayId=${dayId}, tripId=${tripId}`);
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
    destinationName?: string,
    destinationCoordinates?: { lat: number; lng: number }
  ): Promise<DayV2[]> {
    // First check if days already exist
    const existingDays = await this.getTripDays(tripId);
    if (existingDays.length > 0) {
      console.log('Days already exist for trip, skipping creation');
      return existingDays;
    }
    
    const start = new Date(normalizeDate(startDate) + 'T00:00:00');
    const end = new Date(normalizeDate(endDate) + 'T00:00:00');
    const days: DayV2[] = [];
    
    const batch = this.createBatch();
    let dayNumber = 1;
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const normalizedDate = normalizeDate(date);
      
      // Check if a day with this date already exists
      const existingDay = await this.getDayByDate(tripId, normalizedDate);
      if (existingDay) {
        console.log(`Day already exists for date ${normalizedDate}, skipping`);
        days.push(existingDay);
        dayNumber++;
        continue;
      }
      
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
        }
      };
      
      const docRef = this.batchCreate(batch, dayData, [tripId]);
      days.push({ ...dayData, id: docRef.id } as DayV2);
      dayNumber++;
    }
    
    await batch.commit();
    
    // Fetch weather for created days if coordinates are provided
    if (destinationCoordinates) {
      console.log('Fetching weather for newly created days...');
      // Do this asynchronously to not block the response
      this.updateTripWeather(tripId, destinationCoordinates.lat, destinationCoordinates.lng)
        .then(count => console.log(`Weather updated for ${count} days`))
        .catch(err => console.error('Error fetching weather:', err));
    }
    
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

  /**
   * Remove duplicate days for a trip
   */
  async removeDuplicateDays(tripId: string): Promise<number> {
    const allDays = await this.getTripDays(tripId);
    const daysByDate = new Map<string, DayV2[]>();
    
    // Group days by date
    allDays.forEach(day => {
      const normalizedDate = normalizeDate(day.date);
      if (!daysByDate.has(normalizedDate)) {
        daysByDate.set(normalizedDate, []);
      }
      daysByDate.get(normalizedDate)!.push(day);
    });
    
    const batch = this.createBatch();
    let deletedCount = 0;
    
    // Keep only the first day for each date, delete duplicates
    daysByDate.forEach((days, date) => {
      if (days.length > 1) {
        console.log(`Found ${days.length} duplicate days for date ${date}`);
        // Sort by creation time to keep the oldest
        days.sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
          return aTime - bTime;
        });
        
        // Delete all but the first
        for (let i = 1; i < days.length; i++) {
          this.batchDelete(batch, days[i].id, [tripId]);
          deletedCount++;
        }
      }
    });
    
    if (deletedCount > 0) {
      await batch.commit();
      console.log(`Deleted ${deletedCount} duplicate days`);
    }
    
    return deletedCount;
  }

  /**
   * Fetch and update weather for a day
   */
  async updateDayWeather(
    tripId: string,
    dayId: string,
    lat: number,
    lng: number
  ): Promise<void> {
    const day = await this.getById(dayId, [tripId]);
    if (!day) return;
    
    const weatherClient = WeatherClient.getInstance();
    const weatherData = await weatherClient.getWeather(lat, lng, new Date(day.date));
    
    if (weatherData) {
      const weather: WeatherData = {
        date: day.date,
        temperature: Math.round(weatherData.temp),
        condition: weatherData.description,
        precipitation: weatherData.precipitation || 0,
        windSpeed: Math.round(weatherData.windSpeed)
      };
      
      await this.update(dayId, { weather }, [tripId]);
    }
  }

  /**
   * Fetch and update weather for all days in a trip
   */
  async updateTripWeather(
    tripId: string,
    lat: number,
    lng: number
  ): Promise<number> {
    const days = await this.getTripDays(tripId);
    let updated = 0;
    
    // Update weather in batches to avoid rate limits
    for (const day of days) {
      // Skip if weather was recently updated (within 6 hours)
      if (day.weather && day.updatedAt) {
        const lastUpdate = new Date(day.updatedAt);
        const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
        if (hoursSinceUpdate < 6) continue;
      }
      
      await this.updateDayWeather(tripId, day.id, lat, lng);
      updated++;
      
      // Small delay to avoid hitting rate limits
      if (updated % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return updated;
  }

  /**
   * Update days for new date range
   * This handles adding new days, removing days outside range, and preserving existing days with activities
   */
  async updateDaysForNewDateRange(
    tripId: string,
    newStartDate: string,
    newEndDate: string,
    destinationId?: string,
    destinationName?: string,
    destinationCoordinates?: { lat: number; lng: number }
  ): Promise<{
    created: number;
    deleted: number;
    preserved: number;
    daysWithActivitiesOutsideRange: DayV2[];
  }> {
    const start = new Date(normalizeDate(newStartDate) + 'T00:00:00');
    const end = new Date(normalizeDate(newEndDate) + 'T00:00:00');
    
    // Get all existing days
    const existingDays = await this.getTripDays(tripId);
    const existingDaysByDate = new Map<string, DayV2>();
    existingDays.forEach(day => {
      existingDaysByDate.set(normalizeDate(day.date), day);
    });
    
    // Track statistics
    let created = 0;
    let deleted = 0;
    let preserved = 0;
    const daysWithActivitiesOutsideRange: DayV2[] = [];
    
    // Create batch for operations
    const batch = this.createBatch();
    
    // Generate all dates in new range
    const newDates = new Set<string>();
    let dayNumber = 1;
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const normalizedDate = normalizeDate(date);
      newDates.add(normalizedDate);
      
      const existingDay = existingDaysByDate.get(normalizedDate);
      if (existingDay) {
        // Update day number if needed
        if (existingDay.dayNumber !== dayNumber) {
          this.batchUpdate(batch, existingDay.id, { dayNumber }, [tripId]);
        }
        preserved++;
      } else {
        // Create new day
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
          }
        };
        
        this.batchCreate(batch, dayData, [tripId]);
        created++;
      }
      
      dayNumber++;
    }
    
    // Check for days outside new range
    for (const [date, day] of existingDaysByDate) {
      if (!newDates.has(date)) {
        // Check if this day has activities
        if (day.stats.activityCount > 0) {
          daysWithActivitiesOutsideRange.push(day);
        } else {
          // Safe to delete - no activities
          this.batchDelete(batch, day.id, [tripId]);
          deleted++;
        }
      }
    }
    
    // Commit all changes
    await batch.commit();
    
    return {
      created,
      deleted,
      preserved,
      daysWithActivitiesOutsideRange
    };
  }
}