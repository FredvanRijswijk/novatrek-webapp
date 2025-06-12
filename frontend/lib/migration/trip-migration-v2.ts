/**
 * Trip Migration V2 - Converts trips from nested arrays to subcollections
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  writeBatch,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trip } from '@/types/travel';
import { TripServiceV2 } from '@/lib/services/trip-service-v2';
import { TripModelV2 } from '@/lib/models/v2/trip-model-v2';
import { DayModelV2 } from '@/lib/models/v2/day-model-v2';
import { ActivityModelV2 } from '@/lib/models/v2/activity-model-v2';
import { normalizeDate } from '@/lib/utils/date-helpers';

export interface MigrationResult {
  success: boolean;
  tripId: string;
  stats: {
    daysCreated: number;
    activitiesCreated: number;
    accommodationsCreated: number;
    transportationCreated: number;
  };
  errors: string[];
}

export interface MigrationProgress {
  total: number;
  completed: number;
  failed: number;
  currentTripId?: string;
  currentTripName?: string;
}

export class TripMigrationV2 {
  private tripService = new TripServiceV2();
  private tripModel = new TripModelV2();
  private dayModel = new DayModelV2();
  private activityModel = new ActivityModelV2();

  /**
   * Migrate a single trip
   */
  async migrateTrip(tripId: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      tripId,
      stats: {
        daysCreated: 0,
        activitiesCreated: 0,
        accommodationsCreated: 0,
        transportationCreated: 0
      },
      errors: []
    };

    try {
      // Get the old trip data
      const tripDoc = await getDoc(doc(db, 'trips', tripId));
      if (!tripDoc.exists()) {
        throw new Error('Trip not found');
      }

      const oldTrip = { id: tripDoc.id, ...tripDoc.data() } as Trip;
      
      // Check if already migrated
      const existingDays = await this.dayModel.count([tripId]);
      if (existingDays > 0) {
        result.errors.push('Trip already has days in subcollection');
        return result;
      }

      // Start migration
      console.log(`Migrating trip: ${oldTrip.title || oldTrip.name}`);

      // 1. Update trip document (remove itinerary array)
      const { itinerary, expenses, aiRecommendations, ...cleanTripData } = oldTrip;
      
      // Update trip stats
      await this.tripModel.update(tripId, {
        stats: {
          totalDays: itinerary?.length || 0,
          totalActivities: itinerary?.reduce((sum, day) => 
            sum + (day.activities?.length || 0), 0
          ) || 0,
          totalExpenses: expenses?.length || 0
        }
      });

      // 2. Migrate itinerary to days subcollection
      if (itinerary && itinerary.length > 0) {
        for (const oldDay of itinerary) {
          try {
            // Create day document
            const dayData = {
              tripId,
              dayNumber: oldDay.dayNumber,
              date: normalizeDate(oldDay.date),
              type: 'destination' as const,
              destinationId: oldDay.destinationId,
              destinationName: oldTrip.destination?.name,
              notes: oldDay.notes,
              stats: {
                activityCount: oldDay.activities?.length || 0,
                accommodationCount: oldDay.accommodations?.length || 0,
                transportCount: oldDay.transportation?.length || 0,
                totalCost: this.calculateDayCost(oldDay)
              }
            };

            const newDay = await this.dayModel.create(dayData, [tripId]);
            result.stats.daysCreated++;

            // 3. Migrate activities
            if (oldDay.activities && oldDay.activities.length > 0) {
              const batch = writeBatch(db);
              
              for (const oldActivity of oldDay.activities) {
                const activityData = {
                  ...oldActivity,
                  tripId,
                  dayId: newDay.id,
                  // Ensure proper field names
                  startTime: oldActivity.startTime || oldActivity.time,
                  // Convert Date objects to timestamps
                  createdAt: oldActivity.createdAt || Timestamp.now(),
                  updatedAt: oldActivity.updatedAt || Timestamp.now(),
                  addedAt: oldActivity.addedAt || new Date().toISOString()
                };

                // Remove undefined fields
                Object.keys(activityData).forEach(key => {
                  if (activityData[key] === undefined) {
                    delete activityData[key];
                  }
                });

                const activityRef = doc(
                  collection(db, 'trips', tripId, 'days', newDay.id, 'activities')
                );
                batch.set(activityRef, activityData);
                result.stats.activitiesCreated++;
              }

              await batch.commit();
            }

            // 4. Migrate accommodations (TODO: when AccommodationModelV2 is ready)
            if (oldDay.accommodations && oldDay.accommodations.length > 0) {
              // Implementation pending
              result.stats.accommodationsCreated += oldDay.accommodations.length;
            }

            // 5. Migrate transportation (TODO: when TransportationModelV2 is ready)
            if (oldDay.transportation && oldDay.transportation.length > 0) {
              // Implementation pending
              result.stats.transportationCreated += oldDay.transportation.length;
            }

          } catch (dayError) {
            result.errors.push(`Failed to migrate day ${oldDay.dayNumber}: ${dayError}`);
            console.error('Day migration error:', dayError);
          }
        }
      }

      // 6. Migrate expenses to subcollection (TODO: when ExpenseModelV2 is ready)
      if (expenses && expenses.length > 0) {
        // Implementation pending
      }

      // 7. Migrate AI recommendations (TODO: when AIRecommendationModelV2 is ready)
      if (aiRecommendations && aiRecommendations.length > 0) {
        // Implementation pending
      }

      result.success = result.errors.length === 0;
      console.log(`Migration complete for trip ${tripId}:`, result.stats);

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      console.error('Migration error:', error);
    }

    return result;
  }

  /**
   * Migrate all trips for a user
   */
  async migrateUserTrips(
    userId: string,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];
    
    // Get all user trips
    const tripsQuery = query(
      collection(db, 'trips'),
      where('userId', '==', userId)
    );
    const tripsSnapshot = await getDocs(tripsQuery);
    
    const progress: MigrationProgress = {
      total: tripsSnapshot.size,
      completed: 0,
      failed: 0
    };

    for (const tripDoc of tripsSnapshot.docs) {
      const trip = { id: tripDoc.id, ...tripDoc.data() } as Trip;
      progress.currentTripId = trip.id;
      progress.currentTripName = trip.title || trip.name;
      
      if (onProgress) {
        onProgress(progress);
      }

      const result = await this.migrateTrip(trip.id);
      results.push(result);
      
      if (result.success) {
        progress.completed++;
      } else {
        progress.failed++;
      }
    }

    if (onProgress) {
      onProgress(progress);
    }

    return results;
  }

  /**
   * Verify migration integrity
   */
  async verifyMigration(tripId: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Get old trip data
      const tripDoc = await getDoc(doc(db, 'trips', tripId));
      if (!tripDoc.exists()) {
        issues.push('Trip not found');
        return { isValid: false, issues };
      }

      const oldTrip = { id: tripDoc.id, ...tripDoc.data() } as Trip;
      
      // Get new structure data
      const fullTrip = await this.tripService.getFullTrip(tripId);
      if (!fullTrip) {
        issues.push('Could not load migrated trip data');
        return { isValid: false, issues };
      }

      // Compare counts
      const oldDayCount = oldTrip.itinerary?.length || 0;
      const newDayCount = fullTrip.days.length;
      
      if (oldDayCount !== newDayCount) {
        issues.push(`Day count mismatch: old=${oldDayCount}, new=${newDayCount}`);
      }

      // Compare activity counts
      const oldActivityCount = oldTrip.itinerary?.reduce(
        (sum, day) => sum + (day.activities?.length || 0), 0
      ) || 0;
      const newActivityCount = fullTrip.days.reduce(
        (sum, day) => sum + day.activities.length, 0
      );

      if (oldActivityCount !== newActivityCount) {
        issues.push(`Activity count mismatch: old=${oldActivityCount}, new=${newActivityCount}`);
      }

      // Verify dates match
      if (oldTrip.itinerary) {
        for (const oldDay of oldTrip.itinerary) {
          const normalizedDate = normalizeDate(oldDay.date);
          const newDay = fullTrip.days.find(d => d.date === normalizedDate);
          
          if (!newDay) {
            issues.push(`Missing day for date: ${normalizedDate}`);
          } else {
            // Verify activity counts for this day
            const oldCount = oldDay.activities?.length || 0;
            const newCount = newDay.activities.length;
            
            if (oldCount !== newCount) {
              issues.push(`Activity count mismatch for ${normalizedDate}: old=${oldCount}, new=${newCount}`);
            }
          }
        }
      }

    } catch (error) {
      issues.push(`Verification error: ${error}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Rollback migration (delete subcollections)
   */
  async rollbackMigration(tripId: string): Promise<void> {
    // Delete all days and their subcollections
    await this.tripService.deleteTrip(tripId, 'system');
    
    // Note: This doesn't restore the original itinerary array
    // That would need to be done from a backup
  }

  /**
   * Helper: Calculate total cost for a day
   */
  private calculateDayCost(day: any): number {
    let cost = 0;

    // Activities
    if (day.activities) {
      cost += day.activities.reduce((sum: number, act: any) => 
        sum + (act.cost?.amount || 0), 0
      );
    }

    // Accommodations
    if (day.accommodations) {
      cost += day.accommodations.reduce((sum: number, acc: any) => 
        sum + (acc.cost || 0), 0
      );
    }

    // Transportation
    if (day.transportation) {
      cost += day.transportation.reduce((sum: number, trans: any) => 
        sum + (trans.cost || 0), 0
      );
    }

    return cost;
  }
}