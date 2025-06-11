import { getAdminDb } from './admin';
import { Trip } from '@/types/travel';

/**
 * Server-side trip operations using Firebase Admin SDK
 */
export class AdminTripModel {
  /**
   * Get a trip by ID using Admin SDK
   */
  static async getById(tripId: string): Promise<Trip | null> {
    try {
      const db = getAdminDb();
      const doc = await db.collection('trips').doc(tripId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      const data = doc.data();
      if (!data) {
        return null;
      }
      
      // Convert Firestore timestamps to Date objects
      return {
        ...data,
        id: doc.id,
        startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate),
        endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        // Handle nested dates in itinerary
        itinerary: data.itinerary?.map((day: any) => ({
          ...day,
          date: day.date?.toDate ? day.date.toDate() : new Date(day.date)
        })) || [],
        // Handle userRef if it exists
        userId: data.userId || data.userRef?.id || data.userRef?._path?.segments?.[1]
      } as Trip;
    } catch (error) {
      console.error('Error fetching trip:', error);
      throw error;
    }
  }

  /**
   * Add an activity to a trip using Admin SDK
   */
  static async addActivity(tripId: string, dayNumber: number, activity: any): Promise<void> {
    try {
      const db = getAdminDb();
      const tripRef = db.collection('trips').doc(tripId);
      
      // Get current trip data
      const tripDoc = await tripRef.get();
      if (!tripDoc.exists) {
        throw new Error('Trip not found');
      }
      
      const tripData = tripDoc.data()!;
      const itinerary = tripData.itinerary || [];
      
      // Find or create day
      let dayIndex = itinerary.findIndex((day: any) => day.dayNumber === dayNumber);
      if (dayIndex === -1) {
        // Create new day
        itinerary.push({
          id: `day-${Date.now()}`,
          tripId,
          dayNumber,
          date: new Date(tripData.startDate),
          activities: [activity]
        });
      } else {
        // Add to existing day
        itinerary[dayIndex].activities = itinerary[dayIndex].activities || [];
        itinerary[dayIndex].activities.push(activity);
      }
      
      // Update trip
      await tripRef.update({
        itinerary,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  }

  /**
   * Add accommodation to a trip using Admin SDK
   */
  static async addAccommodation(tripId: string, dayNumber: number, accommodation: any): Promise<void> {
    try {
      const db = getAdminDb();
      const tripRef = db.collection('trips').doc(tripId);
      
      // Get current trip data
      const tripDoc = await tripRef.get();
      if (!tripDoc.exists) {
        throw new Error('Trip not found');
      }
      
      const tripData = tripDoc.data()!;
      const itinerary = tripData.itinerary || [];
      
      // Find or create day
      let dayIndex = itinerary.findIndex((day: any) => day.dayNumber === dayNumber);
      if (dayIndex === -1) {
        // Create new day
        itinerary.push({
          id: `day-${Date.now()}`,
          tripId,
          dayNumber,
          date: new Date(tripData.startDate),
          activities: [],
          accommodations: [accommodation]
        });
      } else {
        // Add to existing day
        itinerary[dayIndex].accommodations = itinerary[dayIndex].accommodations || [];
        itinerary[dayIndex].accommodations.push(accommodation);
      }
      
      // Update trip
      await tripRef.update({
        itinerary,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error adding accommodation:', error);
      throw error;
    }
  }
}