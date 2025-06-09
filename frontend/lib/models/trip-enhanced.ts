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
      ...tripData,
      status: 'planning',
      itinerary: [],
      aiRecommendations: [],
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

  // Get all trips for a user - queries both patterns
  static async getUserTrips(userId: string): Promise<TripEnhanced[]> {
    const userRef = doc(this.db, 'users', userId)
    
    // Query using both patterns for maximum compatibility
    const [refTrips, stringTrips] = await Promise.all([
      getCollection<TripEnhanced>(
        this.COLLECTION,
        where('userRef', '==', userRef),
        orderBy('createdAt', 'desc')
      ),
      getCollection<TripEnhanced>(
        this.COLLECTION,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
    ])

    // Combine and deduplicate results
    const tripMap = new Map<string, TripEnhanced>()
    
    refTrips.forEach(trip => {
      tripMap.set(trip.id, trip)
    })
    
    stringTrips.forEach(trip => {
      if (!tripMap.has(trip.id)) {
        tripMap.set(trip.id, trip)
      }
    })

    return Array.from(tripMap.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(trip => convertTimestampsToDates(trip))
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

  // Subscribe to user's trips - monitors both patterns
  static subscribeToUserTrips(userId: string, callback: (trips: TripEnhanced[]) => void) {
    const userRef = doc(this.db, 'users', userId)
    const tripMap = new Map<string, TripEnhanced>()

    // Subscribe to reference-based trips
    const unsubRef = subscribeToCollection<TripEnhanced>(
      this.COLLECTION,
      (refTrips) => {
        // Update map with reference-based trips
        refTrips.forEach(trip => {
          tripMap.set(trip.id, trip)
        })
        
        // Call callback with combined results
        const allTrips = Array.from(tripMap.values())
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .map(trip => convertTimestampsToDates(trip))
        callback(allTrips)
      },
      where('userRef', '==', userRef),
      orderBy('createdAt', 'desc')
    )

    // Subscribe to string-based trips
    const unsubString = subscribeToCollection<TripEnhanced>(
      this.COLLECTION,
      (stringTrips) => {
        // Update map with string-based trips
        stringTrips.forEach(trip => {
          if (!tripMap.has(trip.id)) {
            tripMap.set(trip.id, trip)
          }
        })
        
        // Call callback with combined results
        const allTrips = Array.from(tripMap.values())
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .map(trip => convertTimestampsToDates(trip))
        callback(allTrips)
      },
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    // Return combined unsubscribe function
    return () => {
      unsubRef()
      unsubString()
    }
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
}