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
import { Trip, DayItinerary, Activity } from '@/types/travel'

export class TripModel {
  static readonly COLLECTION = 'trips'

  // Create a new trip
  static async create(tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await createDocument(this.COLLECTION, {
      ...tripData,
      status: 'planning',
      itinerary: [],
      aiRecommendations: [],
    })
    return docRef.id
  }

  // Get a trip by ID
  static async getById(tripId: string): Promise<Trip | null> {
    return await getDocument<Trip>(this.COLLECTION, tripId)
  }

  // Get all trips for a user
  static async getUserTrips(userId: string): Promise<Trip[]> {
    return await getCollection<Trip>(
      this.COLLECTION,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
  }

  // Update trip
  static async update(tripId: string, updates: Partial<Trip>): Promise<void> {
    await updateDocument(this.COLLECTION, tripId, updates)
  }

  // Delete trip
  static async delete(tripId: string): Promise<void> {
    await deleteDocument(this.COLLECTION, tripId)
  }

  // Subscribe to trip changes
  static subscribeToTrip(tripId: string, callback: (trip: Trip | null) => void) {
    return subscribeToDocument<Trip>(this.COLLECTION, tripId, callback)
  }

  // Subscribe to user's trips
  static subscribeToUserTrips(userId: string, callback: (trips: Trip[]) => void) {
    return subscribeToCollection<Trip>(
      this.COLLECTION,
      callback,
      where('userId', '==', userId),
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

  // Update day notes
  static async updateDayNotes(tripId: string, dayNumber: number, notes: string): Promise<void> {
    const trip = await this.getById(tripId)
    if (!trip) throw new Error('Trip not found')

    const dayIndex = trip.itinerary.findIndex(day => day.dayNumber === dayNumber)
    if (dayIndex === -1) throw new Error('Day not found')

    trip.itinerary[dayIndex].notes = notes
    await this.update(tripId, { itinerary: trip.itinerary })
  }

  // Get upcoming trips
  static async getUpcomingTrips(userId: string): Promise<Trip[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return await getCollection<Trip>(
      this.COLLECTION,
      where('userId', '==', userId),
      where('startDate', '>=', today),
      orderBy('startDate', 'asc'),
      limit(5)
    )
  }

  // Calculate trip duration in days
  static getDuration(trip: Trip): number {
    const startDate = new Date(trip.startDate)
    const endDate = new Date(trip.endDate)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  // Get trip progress (for active trips)
  static getProgress(trip: Trip): number {
    if (trip.status !== 'active') return 0

    const today = new Date()
    const startDate = new Date(trip.startDate)
    const endDate = new Date(trip.endDate)

    if (today < startDate) return 0
    if (today > endDate) return 100

    const totalDays = this.getDuration(trip)
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    return Math.round((daysPassed / totalDays) * 100)
  }
}