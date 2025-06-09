import { 
  DocumentReference, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  runTransaction,
  writeBatch,
  CollectionReference
} from 'firebase/firestore'
import { getFirestore } from '@/lib/firebase'
import { User } from './user'
import { Trip, DayItinerary, Activity, Expense, Photo } from './trip'

// Enhanced Trip interface with reference fields
export interface TripRef extends Omit<Trip, 'userId'> {
  userId: string // Keep for backward compatibility
  userRef: DocumentReference<User> // New reference field
}

// Chat message with references
export interface ChatMessageRef {
  id: string
  userId: string // Keep for backward compatibility
  userRef: DocumentReference<User> // Reference to user
  tripId?: string // Keep for backward compatibility
  tripRef?: DocumentReference<TripRef> // Reference to trip
  message: string
  role: 'user' | 'assistant'
  createdAt: Timestamp
}

// Trip share with references
export interface TripShareRef {
  id: string
  tripId: string // Keep for backward compatibility
  tripRef: DocumentReference<TripRef> // Reference to trip
  ownerId: string // Keep for backward compatibility
  ownerRef: DocumentReference<User> // Reference to owner
  token: string
  expiresAt: Timestamp
  createdAt: Timestamp
}

// Packing list with references
export interface PackingListRef {
  id: string
  tripId: string // Keep for backward compatibility
  tripRef: DocumentReference<TripRef> // Reference to trip
  userId: string // Keep for backward compatibility
  userRef: DocumentReference<User> // Reference to user
  items: Array<{
    id: string
    name: string
    checked: boolean
    category: string
  }>
  createdAt: Timestamp
  updatedAt: Timestamp
}

// User saved recommendation with references
export interface UserSavedRecommendationRef {
  id: string
  userId: string // Keep for backward compatibility
  userRef: DocumentReference<User> // Reference to user
  recommendationId: string // Keep for backward compatibility
  recommendationRef: DocumentReference // Reference to place_recommendations
  savedAt: Timestamp
  usedInTrips: string[] // Keep for backward compatibility
  usedInTripRefs: DocumentReference<TripRef>[] // References to trips
}

export class TripReferenceModel {
  private static db = getFirestore()

  // Trip methods with reference fields
  static async createTripWithReference(
    tripData: Omit<TripRef, 'id' | 'userRef' | 'createdAt' | 'updatedAt'>,
    userId: string
  ) {
    // Create reference to user document
    const userRef = doc(this.db, 'users', userId) as DocumentReference<User>
    
    // Verify user exists
    const userSnapshot = await getDoc(userRef)
    if (!userSnapshot.exists()) {
      throw new Error('User not found')
    }

    const tripRef = doc(collection(this.db, 'trips'))
    const trip: TripRef = {
      ...tripData,
      id: tripRef.id,
      userRef: userRef, // Store the reference
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    }
    
    await setDoc(tripRef, trip)
    return trip
  }

  // Hybrid query - works with both old string IDs and new references
  static async getTripsByUser(userId: string): Promise<TripRef[]> {
    const userRef = doc(this.db, 'users', userId)
    
    // Query using both patterns for backward compatibility
    const [refQuery, stringQuery] = await Promise.all([
      getDocs(query(
        collection(this.db, 'trips'),
        where('userRef', '==', userRef)
      )),
      getDocs(query(
        collection(this.db, 'trips'),
        where('userId', '==', userId)
      ))
    ])

    // Combine results and deduplicate
    const tripMap = new Map<string, TripRef>()
    
    refQuery.forEach(doc => {
      tripMap.set(doc.id, doc.data() as TripRef)
    })
    
    stringQuery.forEach(doc => {
      if (!tripMap.has(doc.id)) {
        tripMap.set(doc.id, doc.data() as TripRef)
      }
    })

    return Array.from(tripMap.values())
  }

  // Get trip with user data populated
  static async getTripWithUser(tripId: string) {
    const tripDoc = doc(this.db, 'trips', tripId)
    const tripSnapshot = await getDoc(tripDoc)
    
    if (!tripSnapshot.exists()) {
      return null
    }

    const trip = tripSnapshot.data() as TripRef

    // If trip has reference field, use it to get user data
    if (trip.userRef) {
      const userSnapshot = await getDoc(trip.userRef)
      const user = userSnapshot.exists() ? userSnapshot.data() : null
      return { trip, user }
    }

    // Fallback to string ID for backward compatibility
    if (trip.userId) {
      const userRef = doc(this.db, 'users', trip.userId)
      const userSnapshot = await getDoc(userRef)
      const user = userSnapshot.exists() ? userSnapshot.data() as User : null
      return { trip, user }
    }

    return { trip, user: null }
  }

  // Create chat message with references
  static async createChatMessageWithReferences(
    messageData: Omit<ChatMessageRef, 'id' | 'userRef' | 'tripRef' | 'createdAt'>,
    userId: string,
    tripId?: string
  ) {
    const userRef = doc(this.db, 'users', userId) as DocumentReference<User>
    const tripRef = tripId ? doc(this.db, 'trips', tripId) as DocumentReference<TripRef> : undefined

    const messageRef = doc(collection(this.db, 'chat_messages'))
    const message: ChatMessageRef = {
      ...messageData,
      id: messageRef.id,
      userRef,
      tripRef,
      createdAt: serverTimestamp() as Timestamp
    }

    await setDoc(messageRef, message)
    return message
  }

  // Get chat messages with hybrid query
  static async getChatMessagesByTrip(tripId: string): Promise<ChatMessageRef[]> {
    const tripRef = doc(this.db, 'trips', tripId)

    const [refQuery, stringQuery] = await Promise.all([
      getDocs(query(
        collection(this.db, 'chat_messages'),
        where('tripRef', '==', tripRef)
      )),
      getDocs(query(
        collection(this.db, 'chat_messages'),
        where('tripId', '==', tripId)
      ))
    ])

    const messageMap = new Map<string, ChatMessageRef>()
    
    refQuery.forEach(doc => {
      messageMap.set(doc.id, doc.data() as ChatMessageRef)
    })
    
    stringQuery.forEach(doc => {
      if (!messageMap.has(doc.id)) {
        messageMap.set(doc.id, doc.data() as ChatMessageRef)
      }
    })

    return Array.from(messageMap.values()).sort((a, b) => 
      a.createdAt.toMillis() - b.createdAt.toMillis()
    )
  }

  // Transaction example: Share trip with atomic operations
  static async shareTripWithReferences(
    tripId: string,
    ownerId: string,
    token: string,
    expiresAt: Date
  ) {
    return runTransaction(this.db, async (transaction) => {
      const tripRef = doc(this.db, 'trips', tripId) as DocumentReference<TripRef>
      const ownerRef = doc(this.db, 'users', ownerId) as DocumentReference<User>
      
      // Verify trip exists and user owns it
      const tripSnapshot = await transaction.get(tripRef)
      if (!tripSnapshot.exists()) {
        throw new Error('Trip not found')
      }
      
      const trip = tripSnapshot.data()
      
      // Check ownership (support both patterns)
      const isOwner = (trip.userRef && trip.userRef.id === ownerId) || 
                      (trip.userId === ownerId)
      
      if (!isOwner) {
        throw new Error('Unauthorized: User does not own this trip')
      }

      // Create share record
      const shareRef = doc(collection(this.db, 'tripShares'))
      const share: TripShareRef = {
        id: shareRef.id,
        tripId,
        tripRef,
        ownerId,
        ownerRef,
        token,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: serverTimestamp() as Timestamp
      }

      transaction.set(shareRef, share)

      // Update trip's share count (if tracking)
      if (trip.shareCount !== undefined) {
        transaction.update(tripRef, {
          shareCount: trip.shareCount + 1,
          lastSharedAt: serverTimestamp()
        })
      }

      return share
    })
  }

  // Migration: Convert subcollection approach example
  static async migrateToSubcollections(tripId: string, options = { dryRun: false }) {
    const { dryRun } = options
    const tripRef = doc(this.db, 'trips', tripId)
    const tripSnapshot = await getDoc(tripRef)
    
    if (!tripSnapshot.exists()) {
      throw new Error('Trip not found')
    }

    const trip = tripSnapshot.data() as TripRef
    const batch = writeBatch(this.db)

    // Move itinerary to subcollection
    if (trip.itinerary && trip.itinerary.length > 0) {
      const itineraryRef = collection(tripRef, 'itinerary') as CollectionReference<DayItinerary>
      
      trip.itinerary.forEach((day, index) => {
        const dayRef = doc(itineraryRef)
        if (!dryRun) {
          batch.set(dayRef, {
            ...day,
            order: index,
            createdAt: serverTimestamp() as Timestamp
          })
        }
        console.log(`Would migrate day ${day.date} to subcollection`)
      })
    }

    // Move expenses to subcollection
    if (trip.expenses && trip.expenses.length > 0) {
      const expensesRef = collection(tripRef, 'expenses') as CollectionReference<Expense>
      
      trip.expenses.forEach(expense => {
        const expenseRef = doc(expensesRef)
        if (!dryRun) {
          batch.set(expenseRef, {
            ...expense,
            createdAt: serverTimestamp() as Timestamp
          })
        }
        console.log(`Would migrate expense ${expense.description} to subcollection`)
      })
    }

    if (!dryRun) {
      // Remove embedded arrays from main document
      batch.update(tripRef, {
        itinerary: null,
        expenses: null,
        updatedAt: serverTimestamp()
      })
      
      await batch.commit()
      console.log('Migration completed')
    } else {
      console.log('Dry run completed - no changes made')
    }
  }
}