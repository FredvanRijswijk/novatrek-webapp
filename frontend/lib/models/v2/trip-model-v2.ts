/**
 * Trip Model V2 - Main trip document model
 */

import { BaseModelV2 } from './base-model';
import { TripV2, COLLECTIONS_V2 } from '@/types/travel-v2';
import { doc, DocumentReference } from 'firebase/firestore';
import { where, orderBy } from 'firebase/firestore';

export class TripModelV2 extends BaseModelV2<TripV2> {
  constructor() {
    super(COLLECTIONS_V2.TRIPS);
  }

  /**
   * Create a new trip with user reference
   */
  async createTrip(
    tripData: Omit<TripV2, 'id' | 'createdAt' | 'updatedAt' | 'userRef' | 'stats'>,
    userId: string
  ): Promise<TripV2> {
    const userRef = doc(this.db, 'users', userId) as DocumentReference;
    
    const enhancedData = {
      ...tripData,
      userRef,
      stats: {
        totalDays: 0,
        totalActivities: 0,
        totalExpenses: 0
      }
    };
    
    return this.create(enhancedData);
  }

  /**
   * Get all trips for a user
   */
  async getUserTrips(userId: string): Promise<TripV2[]> {
    const userRef = doc(this.db, 'users', userId);
    
    return this.list(
      undefined,
      [where('userRef', '==', userRef)],
      orderBy('createdAt', 'desc')
    );
  }

  /**
   * Update trip statistics
   */
  async updateStats(
    tripId: string,
    stats: Partial<TripV2['stats']>
  ): Promise<void> {
    const currentTrip = await this.getById(tripId);
    if (!currentTrip) {
      throw new Error('Trip not found');
    }
    
    await this.update(tripId, {
      stats: {
        ...currentTrip.stats,
        ...stats,
        lastActivityUpdate: new Date().toISOString()
      }
    });
  }

  /**
   * Check if user has access to trip
   */
  async hasAccess(tripId: string, userId: string): Promise<boolean> {
    try {
      const trip = await this.getById(tripId);
      if (!trip) return false;
      
      // Check ownership
      if (trip.userId === userId) return true;
    
      // Check if shared
      if (trip.sharedWith?.includes(userId)) return true;
      
      return false;
    } catch (error: any) {
      // If we get a permission error, it means the user doesn't have access
      if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
        console.log('Permission denied accessing trip:', tripId);
        return false;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Share trip with other users
   */
  async shareTrip(
    tripId: string,
    emails: string[]
  ): Promise<void> {
    const trip = await this.getById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }
    
    const updatedSharedWith = Array.from(
      new Set([...(trip.sharedWith || []), ...emails])
    );
    
    await this.update(tripId, {
      sharedWith: updatedSharedWith
    });
  }

  /**
   * Generate share token
   */
  async generateShareToken(tripId: string): Promise<string> {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    await this.update(tripId, {
      shareToken: token
    });
    
    return token;
  }

  /**
   * Get trip by share token
   */
  async getByShareToken(token: string): Promise<TripV2 | null> {
    const trips = await this.list(
      undefined,
      [where('shareToken', '==', token)]
    );
    
    return trips[0] || null;
  }
}