/**
 * Trip Model V2 - Admin Version
 * Uses Firebase Admin SDK for server-side operations
 */

import { Firestore } from 'firebase-admin/firestore';
import { BaseModelAdminV2 } from './base-model-admin';
import { TripV2, COLLECTIONS_V2 } from '@/types/travel-v2';

export class TripModelAdminV2 extends BaseModelAdminV2<TripV2> {
  constructor(db: Firestore) {
    super(db, COLLECTIONS_V2.TRIPS);
  }

  /**
   * Get all trips for a user
   */
  async getUserTrips(userId: string): Promise<TripV2[]> {
    // Get trips with userId string (V1)
    const v1Trips = await this.list(
      undefined,
      [{ field: 'userId', op: '==', value: userId }],
      'createdAt',
      'desc'
    );
    
    // Get trips with userRef (V2)
    const userRef = this.db.doc(`users/${userId}`);
    const v2Trips = await this.list(
      undefined,
      [{ field: 'userRef', op: '==', value: userRef }],
      'createdAt',
      'desc'
    );
    
    // Combine and deduplicate
    const tripMap = new Map<string, TripV2>();
    [...v2Trips, ...v1Trips].forEach(trip => {
      tripMap.set(trip.id, trip);
    });
    
    // Sort by creation date
    return Array.from(tripMap.values()).sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  }

  /**
   * Check if user has access to trip
   */
  async hasAccess(tripId: string, userId: string): Promise<boolean> {
    const trip = await this.getById(tripId);
    if (!trip) return false;
    
    // Check ownership (V1 pattern)
    if (trip.userId === userId) return true;
    
    // Check ownership (V2 pattern)
    const userRef = this.db.doc(`users/${userId}`);
    if (trip.userRef && trip.userRef.path === userRef.path) return true;
    
    // Check if shared
    if (trip.sharedWith?.includes(userId)) return true;
    
    return false;
  }
}