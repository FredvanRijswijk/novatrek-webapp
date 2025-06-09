import {
  doc,
  serverTimestamp,
  where,
  orderBy,
  DocumentReference,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  createDocument,
  updateDocument,
  deleteDocument,
  getDocument,
  getCollection,
  subscribeToCollection,
  subscribeToDocument,
} from '@/lib/firebase/firestore'
import { cleanFirestoreData, convertTimestampsToDates } from '@/lib/utils/firebase-helpers'
import type { TravelSegment, TransportType } from '@/components/trips/TravelSegment'

export interface TravelSegmentData extends Omit<TravelSegment, 'id' | 'departureDate' | 'arrivalDate'> {
  id: string
  tripId: string
  tripRef?: DocumentReference
  userId: string
  userRef?: DocumentReference
  departureDate: Date
  arrivalDate: Date
  createdAt: Date
  updatedAt: Date
}

export class TravelSegmentModel {
  static readonly COLLECTION = 'travel_segments'
  private static db = db

  // Create a new travel segment
  static async create(segmentData: Omit<TravelSegmentData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const enhancedData: any = {
      ...segmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    // Add references alongside string IDs
    if (segmentData.userId) {
      enhancedData.userRef = doc(this.db, 'users', segmentData.userId)
    }
    if (segmentData.tripId) {
      enhancedData.tripRef = doc(this.db, 'trips', segmentData.tripId)
    }

    const cleanedData = cleanFirestoreData(enhancedData)
    const docRef = await createDocument(this.COLLECTION, cleanedData)
    return docRef.id
  }

  // Get a travel segment by ID
  static async getById(segmentId: string): Promise<TravelSegmentData | null> {
    const segment = await getDocument<TravelSegmentData>(this.COLLECTION, segmentId)
    return segment ? convertTimestampsToDates(segment) : null
  }

  // Get all travel segments for a trip
  static async getTripSegments(tripId: string): Promise<TravelSegmentData[]> {
    const tripRef = doc(this.db, 'trips', tripId)
    
    const segments = await getCollection<TravelSegmentData>(
      this.COLLECTION,
      where('tripRef', '==', tripRef),
      orderBy('departureDate', 'asc'),
      orderBy('departureTime', 'asc')
    )

    return segments.map(segment => convertTimestampsToDates(segment))
  }

  // Get segments between two dates for a trip
  static async getSegmentsBetweenDates(
    tripId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<TravelSegmentData[]> {
    const tripRef = doc(this.db, 'trips', tripId)
    
    const segments = await getCollection<TravelSegmentData>(
      this.COLLECTION,
      where('tripRef', '==', tripRef),
      where('departureDate', '>=', startDate),
      where('departureDate', '<=', endDate),
      orderBy('departureDate', 'asc'),
      orderBy('departureTime', 'asc')
    )

    return segments.map(segment => convertTimestampsToDates(segment))
  }

  // Update a travel segment
  static async update(segmentId: string, updates: Partial<TravelSegmentData>): Promise<void> {
    const enhancedUpdates: any = {
      ...updates,
      updatedAt: serverTimestamp()
    }

    // Update references if IDs change
    if (updates.userId) {
      enhancedUpdates.userRef = doc(this.db, 'users', updates.userId)
    }
    if (updates.tripId) {
      enhancedUpdates.tripRef = doc(this.db, 'trips', updates.tripId)
    }

    const cleanedUpdates = cleanFirestoreData(enhancedUpdates)
    await updateDocument(this.COLLECTION, segmentId, cleanedUpdates)
  }

  // Delete a travel segment
  static async delete(segmentId: string): Promise<void> {
    await deleteDocument(this.COLLECTION, segmentId)
  }

  // Delete all segments for a trip
  static async deleteTripSegments(tripId: string): Promise<void> {
    const segments = await this.getTripSegments(tripId)
    await Promise.all(segments.map(segment => this.delete(segment.id)))
  }

  // Subscribe to trip segments
  static subscribeToTripSegments(
    tripId: string, 
    callback: (segments: TravelSegmentData[]) => void
  ) {
    const tripRef = doc(this.db, 'trips', tripId)
    
    return subscribeToCollection<TravelSegmentData>(
      this.COLLECTION,
      (segments) => {
        const converted = segments.map(segment => convertTimestampsToDates(segment))
        callback(converted)
      },
      where('tripRef', '==', tripRef),
      orderBy('departureDate', 'asc'),
      orderBy('departureTime', 'asc')
    )
  }

  // Get upcoming segments for a user
  static async getUpcomingSegments(userId: string, limit = 5): Promise<TravelSegmentData[]> {
    const userRef = doc(this.db, 'users', userId)
    const now = new Date()
    
    const segments = await getCollection<TravelSegmentData>(
      this.COLLECTION,
      where('userRef', '==', userRef),
      where('departureDate', '>=', now),
      orderBy('departureDate', 'asc'),
      orderBy('departureTime', 'asc')
    )

    return segments.slice(0, limit).map(segment => convertTimestampsToDates(segment))
  }

  // Check for transport on a specific date
  static async hasTransportOnDate(tripId: string, date: Date): Promise<boolean> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    const segments = await this.getSegmentsBetweenDates(tripId, startOfDay, endOfDay)
    return segments.length > 0
  }
}