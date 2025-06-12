/**
 * Activity Model Admin V2 - Admin version for server-side operations
 */

import { BaseModelAdminV2 } from './base-model-admin';
import { ActivityV2, COLLECTIONS_V2 } from '@/types/travel-v2';
import { FieldValue } from 'firebase-admin/firestore';
import { normalizeDate } from '@/lib/utils/date-helpers';

export class ActivityModelAdminV2 extends BaseModelAdminV2<ActivityV2> {
  constructor(db: FirebaseFirestore.Firestore) {
    super(
      db,
      (ids: string[]) => COLLECTIONS_V2.ACTIVITIES(ids[0], ids[1]) // ids[0] is tripId, ids[1] is dayId
    );
  }

  /**
   * Create a new activity with server timestamp
   */
  async createActivity(
    tripId: string,
    dayId: string,
    activityData: Omit<ActivityV2, 'id' | 'createdAt' | 'updatedAt' | 'tripId' | 'dayId'>
  ): Promise<ActivityV2> {
    const docRef = this.db
      .collection('trips')
      .doc(tripId)
      .collection('days')
      .doc(dayId)
      .collection('activities')
      .doc();

    const enhancedData = {
      ...activityData,
      id: docRef.id,
      tripId,
      dayId,
      addedAt: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await docRef.set(enhancedData);
    
    const created = await this.getById(docRef.id, [tripId, dayId]);
    if (!created) {
      throw new Error('Failed to create activity');
    }
    
    return created;
  }

  /**
   * Get all activities for a day
   */
  async getDayActivities(tripId: string, dayId: string): Promise<ActivityV2[]> {
    const snapshot = await this.db
      .collection('trips')
      .doc(tripId)
      .collection('days')
      .doc(dayId)
      .collection('activities')
      .orderBy('startTime', 'asc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ActivityV2));
  }

  /**
   * Get all activities for a trip (across all days)
   */
  async getTripActivities(tripId: string): Promise<ActivityV2[]> {
    const daysSnapshot = await this.db
      .collection('trips')
      .doc(tripId)
      .collection('days')
      .get();

    const activities: ActivityV2[] = [];

    for (const dayDoc of daysSnapshot.docs) {
      const dayActivities = await this.getDayActivities(tripId, dayDoc.id);
      activities.push(...dayActivities);
    }

    return activities.sort((a, b) => {
      const dateCompare = (a.date || '').localeCompare(b.date || '');
      if (dateCompare !== 0) return dateCompare;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
  }

  /**
   * Update an activity
   */
  async updateActivity(
    tripId: string,
    dayId: string,
    activityId: string,
    updates: Partial<ActivityV2>
  ): Promise<void> {
    const cleanedUpdates = {
      ...updates,
      updatedAt: FieldValue.serverTimestamp()
    };

    // Remove undefined values
    Object.keys(cleanedUpdates).forEach(key => {
      if (cleanedUpdates[key] === undefined) {
        delete cleanedUpdates[key];
      }
    });

    await this.db
      .collection('trips')
      .doc(tripId)
      .collection('days')
      .doc(dayId)
      .collection('activities')
      .doc(activityId)
      .update(cleanedUpdates);
  }

  /**
   * Delete an activity
   */
  async deleteActivity(tripId: string, dayId: string, activityId: string): Promise<void> {
    await this.db
      .collection('trips')
      .doc(tripId)
      .collection('days')
      .doc(dayId)
      .collection('activities')
      .doc(activityId)
      .delete();
  }

  /**
   * Get activities by time range
   */
  async getActivitiesByTimeRange(
    tripId: string,
    dayId: string,
    startTime: string,
    endTime: string
  ): Promise<ActivityV2[]> {
    const snapshot = await this.db
      .collection('trips')
      .doc(tripId)
      .collection('days')
      .doc(dayId)
      .collection('activities')
      .where('startTime', '>=', startTime)
      .where('startTime', '<=', endTime)
      .orderBy('startTime', 'asc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ActivityV2));
  }

  /**
   * Check if time slot is available
   */
  async isTimeSlotAvailable(
    tripId: string,
    dayId: string,
    startTime: string,
    duration: number
  ): Promise<boolean> {
    const endTime = this.calculateEndTime(startTime, duration);
    const conflicts = await this.getActivitiesByTimeRange(tripId, dayId, startTime, endTime);
    return conflicts.length === 0;
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
   * Helper to calculate end time
   */
  private calculateEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  /**
   * Helper: Convert time string to minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}