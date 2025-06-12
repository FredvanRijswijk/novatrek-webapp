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
    // Get trips with userRef (V2 only)
    const userRef = this.db.doc(`users/${userId}`);
    const trips = await this.list(
      undefined,
      [{ field: 'userRef', op: '==', value: userRef }],
      'createdAt',
      'desc'
    );
    
    return trips;
  }

  /**
   * Check if user has access to trip
   */
  async hasAccess(tripId: string, userId: string): Promise<boolean> {
    const trip = await this.getById(tripId);
    if (!trip) return false;
    
    // Check ownership (V2 pattern only)
    const userRef = this.db.doc(`users/${userId}`);
    if (trip.userRef && trip.userRef.path === userRef.path) return true;
    
    // Check if shared
    if (trip.sharedWith?.includes(userId)) return true;
    
    return false;
  }
}