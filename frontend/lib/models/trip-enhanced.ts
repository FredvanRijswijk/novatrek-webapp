import { 
  doc,
  DocumentReference,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { 
  createDocument, 
  updateDocument, 
  getDocument, 
  getCollection, 
  deleteDocument,
  subscribeToDocument,
  subscribeToCollection,
  where,
  orderBy,
  limit
} from '@/lib/firebase'
import { db } from '@/lib/firebase'
import { Trip, DayItinerary, Activity, Expense } from '@/types/travel'
import { User } from './user'
import { cleanFirestoreData, convertTimestampsToDates } from '@/lib/utils/firebase-helpers'

// Enhanced Trip type with reference field
export interface TripEnhanced extends Trip {
  userRef?: DocumentReference<User> // New reference field
}

export class TripModelEnhanced {
  static readonly COLLECTION = 'trips'
  private static db = db

  // Create a new trip with both userId and userRef
  static async create(tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // Create user reference if userId is provided
    let enhancedData: any = {
      status: 'planning',
      itinerary: [],
      aiRecommendations: [],
      ...tripData, // Spread tripData after defaults so it can override them
    }

    // Add user reference alongside userId for new documents
    if (tripData.userId) {
      enhancedData.userRef = doc(this.db, 'users', tripData.userId)
    }

    // Clean the data to remove undefined values
    const cleanedData = cleanFirestoreData(enhancedData)
    const docRef = await createDocument(this.COLLECTION, cleanedData)
    return docRef.id
  }

  // Get a trip by ID
  static async getById(tripId: string): Promise<TripEnhanced | null> {
    const trip = await getDocument<TripEnhanced>(this.COLLECTION, tripId)
    return trip ? convertTimestampsToDates(trip) : null
  }

  // Get all trips for a user - uses references only
  static async getUserTrips(userId: string): Promise<TripEnhanced[]> {
    const userRef = doc(this.db, 'users', userId)
    
    const trips = await getCollection<TripEnhanced>(
      this.COLLECTION,
      where('userRef', '==', userRef),
      orderBy('createdAt', 'desc')
    )

    return trips.map(trip => convertTimestampsToDates(trip))
  }

  // Update trip - optionally update references if userId changes
  static async update(tripId: string, updates: Partial<Trip>): Promise<void> {
    let enhancedUpdates: any = { ...updates }

    // If userId is being updated, also update userRef
    if (updates.userId && !updates.hasOwnProperty('userRef')) {
      enhancedUpdates.userRef = doc(this.db, 'users', updates.userId)
    }

    const cleanedUpdates = cleanFirestoreData(enhancedUpdates)
    await updateDocument(this.COLLECTION, tripId, cleanedUpdates)
  }

  // Delete trip
  static async delete(tripId: string): Promise<void> {
    await deleteDocument(this.COLLECTION, tripId)
  }

  // Subscribe to trip changes
  static subscribeToTrip(tripId: string, callback: (trip: TripEnhanced | null) => void) {
    return subscribeToDocument<TripEnhanced>(this.COLLECTION, tripId, (trip) => {
      callback(trip ? convertTimestampsToDates(trip) : null)
    })
  }

  // Subscribe to user's trips - uses references only
  static subscribeToUserTrips(userId: string, callback: (trips: TripEnhanced[]) => void) {
    const userRef = doc(this.db, 'users', userId)

    return subscribeToCollection<TripEnhanced>(
      this.COLLECTION,
      (trips) => {
        const convertedTrips = trips.map(trip => convertTimestampsToDates(trip))
        callback(convertedTrips)
      },
      where('userRef', '==', userRef),
      orderBy('createdAt', 'desc')
    )
  }

  // Add activity to itinerary
  static async addActivity(tripId: string, dayNumber: number, activity: Activity): Promise<void> {
    const trip = await this.getById(tripId)
    if (!trip) throw new Error('Trip not found')

    const dayIndex = trip.itinerary.findIndex(day => day.dayNumber === dayNumber)
    
    if (dayIndex === -1) {
      // Create new day if it doesn't exist
      const newDay: DayItinerary = {
        id: `day-${dayNumber}`,
        tripId,
        date: new Date(trip.startDate.getTime() + (dayNumber - 1) * 24 * 60 * 60 * 1000),
        dayNumber,
        activities: [activity],
        notes: ''
      }
      trip.itinerary.push(newDay)
    } else {
      trip.itinerary[dayIndex].activities.push(activity)
    }

    await this.update(tripId, { itinerary: trip.itinerary })
  }

  // Remove activity from itinerary
  static async removeActivity(tripId: string, dayNumber: number, activityId: string): Promise<void> {
    const trip = await this.getById(tripId)
    if (!trip) throw new Error('Trip not found')

    const dayIndex = trip.itinerary.findIndex(day => day.dayNumber === dayNumber)
    if (dayIndex === -1) throw new Error('Day not found')

    trip.itinerary[dayIndex].activities = trip.itinerary[dayIndex].activities.filter(
      activity => activity.id !== activityId
    )

    await this.update(tripId, { itinerary: trip.itinerary })
  }

  // Update activity
  static async updateActivity(
    tripId: string, 
    dayNumber: number, 
    activityId: string, 
    updates: Partial<Activity>
  ): Promise<void> {
    const trip = await this.getById(tripId)
    if (!trip) throw new Error('Trip not found')

    const dayIndex = trip.itinerary.findIndex(day => day.dayNumber === dayNumber)
    if (dayIndex === -1) throw new Error('Day not found')

    const activityIndex = trip.itinerary[dayIndex].activities.findIndex(a => a.id === activityId)
    if (activityIndex === -1) throw new Error('Activity not found')

    trip.itinerary[dayIndex].activities[activityIndex] = {
      ...trip.itinerary[dayIndex].activities[activityIndex],
      ...updates
    }

    await this.update(tripId, { itinerary: trip.itinerary })
  }

  // Add expense
  static async addExpense(tripId: string, expense: Expense): Promise<void> {
    const trip = await this.getById(tripId)
    if (!trip) throw new Error('Trip not found')

    const expenses = [...(trip.expenses || []), expense]
    await this.update(tripId, { expenses })
  }

  // Update expense
  static async updateExpense(tripId: string, expenseId: string, updates: Partial<Expense>): Promise<void> {
    const trip = await this.getById(tripId)
    if (!trip) throw new Error('Trip not found')

    const expenses = (trip.expenses || []).map(exp => 
      exp.id === expenseId ? { ...exp, ...updates } : exp
    )
    await this.update(tripId, { expenses })
  }

  // Remove expense
  static async removeExpense(tripId: string, expenseId: string): Promise<void> {
    const trip = await this.getById(tripId)
    if (!trip) throw new Error('Trip not found')

    const expenses = (trip.expenses || []).filter(exp => exp.id !== expenseId)
    await this.update(tripId, { expenses })
  }

  // Add accommodation
  static async addAccommodation(tripId: string, dayNumber: number, accommodation: any): Promise<void> {
    const trip = await this.getById(tripId)
    if (!trip) throw new Error('Trip not found')

    const dayIndex = trip.itinerary.findIndex(day => day.dayNumber === dayNumber)
    if (dayIndex === -1) {
      // Create the day if it doesn't exist
      trip.itinerary.push({
        id: `day-${Date.now()}`,
        tripId,
        date: new Date(trip.startDate),
        dayNumber,
        activities: [],
        accommodations: [accommodation]
      })
    } else {
      // Add to existing day
      if (!trip.itinerary[dayIndex].accommodations) {
        trip.itinerary[dayIndex].accommodations = []
      }
      trip.itinerary[dayIndex].accommodations!.push(accommodation)
    }

    await this.update(tripId, { itinerary: trip.itinerary })
  }

  // Calculate trip duration in days
  static getDuration(trip: Trip): number {
    const startDate = new Date(trip.startDate)
    const endDate = new Date(trip.endDate)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }
}