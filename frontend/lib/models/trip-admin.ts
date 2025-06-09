import { getAdminDb } from '@/lib/firebase/admin'
import { TripEnhanced } from '@/types/travel'
import { Timestamp } from 'firebase-admin/firestore'

export class TripModelAdmin {
  static readonly COLLECTION = 'trips'

  // Get a trip by ID using Admin SDK
  static async getById(tripId: string): Promise<TripEnhanced | null> {
    const adminDb = getAdminDb()
    if (!adminDb) {
      throw new Error('Firebase Admin SDK not initialized')
    }

    const doc = await adminDb.collection(this.COLLECTION).doc(tripId).get()
    
    if (!doc.exists) {
      return null
    }

    const data = doc.data()
    if (!data) {
      return null
    }

    // Convert Firestore timestamps to Date objects
    return {
      ...data,
      id: doc.id,
      startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : data.startDate,
      endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
    } as TripEnhanced
  }
}