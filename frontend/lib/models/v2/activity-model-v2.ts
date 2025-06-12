/**
 * Activity Model V2 - Activities subcollection model
 */

import { BaseModelV2 } from './base-model';
import { ActivityV2, COLLECTIONS_V2 } from '@/types/travel-v2';
import { where, orderBy, collectionGroup, query, getDocs } from 'firebase/firestore';
import { normalizeDate } from '@/lib/utils/date-helpers';
import { convertTimestampsToDates } from '@/lib/utils/firebase-helpers';

export class ActivityModelV2 extends BaseModelV2<ActivityV2> {
  constructor() {
    super((ids: string[]) => COLLECTIONS_V2.ACTIVITIES(ids[0], ids[1])); // ids[0] is tripId, ids[1] is dayId
  }

  /**
   * Create a new activity
   */
  async createActivity(
    tripId: string,
    dayId: string,
    activityData: Omit<ActivityV2, 'id' | 'createdAt' | 'updatedAt' | 'tripId' | 'dayId'>
  ): Promise<ActivityV2> {
    const enhancedData = {
      ...activityData,
      tripId,
      dayId,
      addedAt: new Date().toISOString()
    };
    
    return this.create(enhancedData, [tripId, dayId]);
  }

  /**
   * Get all activities for a day
   */
  async getDayActivities(tripId: string, dayId: string): Promise<ActivityV2[]> {
    return this.list(
      [tripId, dayId],
      undefined,
      orderBy('startTime', 'asc')
    );
  }

  /**
   * Get all activities for a trip (across all days)
   */
  async getTripActivities(tripId: string): Promise<ActivityV2[]> {
    const q = query(
      collectionGroup(this.db, 'activities'),
      where('tripId', '==', tripId),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() } as ActivityV2;
      return convertTimestampsToDates(data);
    });
  }

  /**
   * Move activity to different day
   */
  async moveToDay(
    tripId: string,
    fromDayId: string,
    toDayId: string,
    activityId: string
  ): Promise<void> {
    // Get the activity
    const activity = await this.getById(activityId, [tripId, fromDayId]);
    if (!activity) {
      throw new Error('Activity not found');
    }
    
    // Create in new day
    const { id, createdAt, updatedAt, ...activityData } = activity;
    await this.createActivity(tripId, toDayId, {
      ...activityData,
      dayId: toDayId
    });
    
    // Delete from old day
    await this.delete(activityId, [tripId, fromDayId]);
  }

  /**
   * Find activities by type across all trips for a user
   */
  async findByType(
    userId: string,
    type: ActivityV2['type']
  ): Promise<ActivityV2[]> {
    const q = query(
      collectionGroup(this.db, 'activities'),
      where('createdBy', '==', userId),
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() } as ActivityV2;
      return convertTimestampsToDates(data);
    });
  }

  /**
   * Find expert-recommended activities
   */
  async findExpertRecommended(limit?: number): Promise<ActivityV2[]> {
    let q = query(
      collectionGroup(this.db, 'activities'),
      where('expertRecommended', '==', true),
      where('rating', '>=', 4.0),
      orderBy('rating', 'desc')
    );
    
    if (limit) {
      q = query(q, where('__name__', '<=', limit.toString()));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() } as ActivityV2;
      return convertTimestampsToDates(data);
    });
  }

  /**
   * Check for time conflicts
   */
  async checkTimeConflicts(
    tripId: string,
    dayId: string,
    startTime: string,
    duration: number
  ): Promise<ActivityV2[]> {
    const activities = await this.getDayActivities(tripId, dayId);
    const conflicts: ActivityV2[] = [];
    
    const newStart = this.timeToMinutes(startTime);
    const newEnd = newStart + duration;
    
    activities.forEach(activity => {
      if (!activity.startTime) return;
      
      const actStart = this.timeToMinutes(activity.startTime);
      const actEnd = actStart + (activity.duration || 120);
      
      // Check for overlap
      if (
        (newStart >= actStart && newStart < actEnd) ||
        (newEnd > actStart && newEnd <= actEnd) ||
        (newStart <= actStart && newEnd >= actEnd)
      ) {
        conflicts.push(activity);
      }
    });
    
    return conflicts;
  }

  /**
   * Get activities for a date range
   */
  async getActivitiesForDateRange(
    tripId: string,
    startDate: string,
    endDate: string
  ): Promise<ActivityV2[]> {
    // This would require querying days first, then activities
    // Implementation depends on how dates are stored in the day documents
    const q = query(
      collectionGroup(this.db, 'activities'),
      where('tripId', '==', tripId),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const activities = snapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() } as ActivityV2;
      return convertTimestampsToDates(data);
    });
    
    // Filter by date range (would need to join with day data)
    return activities;
  }

  /**
   * Delete all activities for a day
   */
  async deleteDayActivities(tripId: string, dayId: string): Promise<number> {
    const activities = await this.getDayActivities(tripId, dayId);
    const batch = this.createBatch();
    
    activities.forEach(activity => {
      this.batchDelete(batch, activity.id, [tripId, dayId]);
    });
    
    await batch.commit();
    return activities.length;
  }

  /**
   * Helper: Convert time string to minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}