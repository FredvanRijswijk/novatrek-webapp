import { useState, useEffect } from 'react'
import { 
  DocumentReference, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  onSnapshot,
  orderBy,
  QueryConstraint
} from 'firebase/firestore'
import { getFirestore } from '@/lib/firebase'
import { TripRef, ChatMessageRef, PackingListRef, TripShareRef } from '@/lib/models/trip-reference'
import { User } from '@/lib/models/user'

interface UseTripOptions {
  userId?: string
  realtime?: boolean
  includeArchived?: boolean
}

// Hook that supports both old and new data patterns for trips
export function useUserTrips(options: UseTripOptions = {}) {
  const [trips, setTrips] = useState<TripRef[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const { userId, realtime = false, includeArchived = false } = options
    if (!userId) {
      setTrips([])
      setLoading(false)
      return
    }

    const db = getFirestore()

    const fetchTrips = async () => {
      try {
        setLoading(true)
        setError(null)

        // Create user reference for new query pattern
        const userRef = doc(db, 'users', userId)

        // Build query constraints
        const constraints: QueryConstraint[] = [
          orderBy('createdAt', 'desc')
        ]
        
        if (!includeArchived) {
          constraints.push(where('archived', '!=', true))
        }

        // Execute both queries in parallel for backward compatibility
        const [refResults, stringResults] = await Promise.all([
          // Query using reference field (new pattern)
          getDocs(query(
            collection(db, 'trips'),
            where('userRef', '==', userRef),
            ...constraints
          )),
          // Query using string ID (old pattern)
          getDocs(query(
            collection(db, 'trips'),
            where('userId', '==', userId),
            ...constraints
          ))
        ])

        // Combine and deduplicate results
        const tripMap = new Map<string, TripRef>()
        
        refResults.forEach(doc => {
          tripMap.set(doc.id, { ...doc.data(), id: doc.id } as TripRef)
        })
        
        stringResults.forEach(doc => {
          if (!tripMap.has(doc.id)) {
            tripMap.set(doc.id, { ...doc.data(), id: doc.id } as TripRef)
          }
        })

        const tripsData = Array.from(tripMap.values())
        setTrips(tripsData)
      } catch (err) {
        console.error('Error fetching trips:', err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    if (realtime) {
      const userRef = doc(db, 'users', userId)
      const constraints: QueryConstraint[] = [
        orderBy('createdAt', 'desc')
      ]
      
      if (!includeArchived) {
        constraints.push(where('archived', '!=', true))
      }

      // Set up realtime listeners for both patterns
      const unsubscribers: (() => void)[] = []

      // Reference-based listener
      const unsubRef = onSnapshot(
        query(
          collection(db, 'trips'),
          where('userRef', '==', userRef),
          ...constraints
        ),
        (snapshot) => {
          const refTrips = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          } as TripRef))
          
          setTrips(current => {
            const tripMap = new Map<string, TripRef>()
            current.forEach(t => tripMap.set(t.id, t))
            refTrips.forEach(t => tripMap.set(t.id, t))
            return Array.from(tripMap.values())
          })
        },
        (err) => setError(err)
      )
      unsubscribers.push(unsubRef)

      // String-based listener
      const unsubString = onSnapshot(
        query(
          collection(db, 'trips'),
          where('userId', '==', userId),
          ...constraints
        ),
        (snapshot) => {
          const stringTrips = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          } as TripRef))
          
          setTrips(current => {
            const tripMap = new Map<string, TripRef>()
            current.forEach(t => tripMap.set(t.id, t))
            stringTrips.forEach(t => tripMap.set(t.id, t))
            return Array.from(tripMap.values())
          })
        }
      )
      unsubscribers.push(unsubString)

      return () => {
        unsubscribers.forEach(unsub => unsub())
      }
    } else {
      fetchTrips()
    }
  }, [options.userId, options.realtime, options.includeArchived])

  return { trips, loading, error }
}

// Hook to get trip with user data
export function useTripWithUser(tripId: string | null) {
  const [data, setData] = useState<{
    trip: TripRef | null
    user: User | null
  }>({ trip: null, user: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!tripId) {
      setData({ trip: null, user: null })
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const db = getFirestore()

        // Get trip
        const tripRef = doc(db, 'trips', tripId)
        const tripSnapshot = await getDoc(tripRef)

        if (!tripSnapshot.exists()) {
          throw new Error('Trip not found')
        }

        const trip = { 
          ...tripSnapshot.data(), 
          id: tripSnapshot.id 
        } as TripRef

        let user: User | null = null

        // Try reference field first (new pattern)
        if (trip.userRef) {
          const userSnapshot = await getDoc(trip.userRef)
          if (userSnapshot.exists()) {
            user = { 
              ...userSnapshot.data(), 
              id: userSnapshot.id 
            } as User
          }
        } 
        // Fallback to string ID (old pattern)
        else if (trip.userId) {
          const userRef = doc(db, 'users', trip.userId)
          const userSnapshot = await getDoc(userRef)
          if (userSnapshot.exists()) {
            user = { 
              ...userSnapshot.data(), 
              id: userSnapshot.id 
            } as User
          }
        }

        setData({ trip, user })
      } catch (err) {
        console.error('Error fetching trip with user:', err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tripId])

  return { ...data, loading, error }
}

// Hook for chat messages with hybrid queries
export function useTripChatMessages(tripId: string | null, realtime = true) {
  const [messages, setMessages] = useState<ChatMessageRef[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!tripId) {
      setMessages([])
      setLoading(false)
      return
    }

    const db = getFirestore()
    const tripRef = doc(db, 'trips', tripId)

    if (realtime) {
      const unsubscribers: (() => void)[] = []

      // Reference-based listener
      const unsubRef = onSnapshot(
        query(
          collection(db, 'chat_messages'),
          where('tripRef', '==', tripRef),
          orderBy('createdAt', 'asc')
        ),
        (snapshot) => {
          const refMessages = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          } as ChatMessageRef))
          
          setMessages(current => {
            const messageMap = new Map<string, ChatMessageRef>()
            current.forEach(m => messageMap.set(m.id, m))
            refMessages.forEach(m => messageMap.set(m.id, m))
            return Array.from(messageMap.values()).sort((a, b) => 
              a.createdAt.toMillis() - b.createdAt.toMillis()
            )
          })
          setLoading(false)
        },
        (err) => {
          setError(err)
          setLoading(false)
        }
      )
      unsubscribers.push(unsubRef)

      // String-based listener
      const unsubString = onSnapshot(
        query(
          collection(db, 'chat_messages'),
          where('tripId', '==', tripId),
          orderBy('createdAt', 'asc')
        ),
        (snapshot) => {
          const stringMessages = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          } as ChatMessageRef))
          
          setMessages(current => {
            const messageMap = new Map<string, ChatMessageRef>()
            current.forEach(m => messageMap.set(m.id, m))
            stringMessages.forEach(m => messageMap.set(m.id, m))
            return Array.from(messageMap.values()).sort((a, b) => 
              a.createdAt.toMillis() - b.createdAt.toMillis()
            )
          })
        }
      )
      unsubscribers.push(unsubString)

      return () => {
        unsubscribers.forEach(unsub => unsub())
      }
    } else {
      // One-time fetch
      const fetchMessages = async () => {
        try {
          const [refResults, stringResults] = await Promise.all([
            getDocs(query(
              collection(db, 'chat_messages'),
              where('tripRef', '==', tripRef),
              orderBy('createdAt', 'asc')
            )),
            getDocs(query(
              collection(db, 'chat_messages'),
              where('tripId', '==', tripId),
              orderBy('createdAt', 'asc')
            ))
          ])

          const messageMap = new Map<string, ChatMessageRef>()
          
          refResults.forEach(doc => {
            messageMap.set(doc.id, { ...doc.data(), id: doc.id } as ChatMessageRef)
          })
          
          stringResults.forEach(doc => {
            if (!messageMap.has(doc.id)) {
              messageMap.set(doc.id, { ...doc.data(), id: doc.id } as ChatMessageRef)
            }
          })

          const allMessages = Array.from(messageMap.values()).sort((a, b) => 
            a.createdAt.toMillis() - b.createdAt.toMillis()
          )
          
          setMessages(allMessages)
        } catch (err) {
          setError(err as Error)
        } finally {
          setLoading(false)
        }
      }

      fetchMessages()
    }
  }, [tripId, realtime])

  return { messages, loading, error }
}

// Hook for packing list with hybrid queries
export function useTripPackingList(tripId: string | null, userId: string | null) {
  const [packingList, setPackingList] = useState<PackingListRef | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!tripId || !userId) {
      setPackingList(null)
      setLoading(false)
      return
    }

    const fetchPackingList = async () => {
      try {
        setLoading(true)
        setError(null)
        const db = getFirestore()

        const tripRef = doc(db, 'trips', tripId)
        const userRef = doc(db, 'users', userId)

        // Try both query patterns
        const [refResults, stringResults] = await Promise.all([
          // New pattern with references
          getDocs(query(
            collection(db, 'packing_lists'),
            where('tripRef', '==', tripRef),
            where('userRef', '==', userRef)
          )),
          // Old pattern with strings
          getDocs(query(
            collection(db, 'packing_lists'),
            where('tripId', '==', tripId),
            where('userId', '==', userId)
          ))
        ])

        // Take the first result from either query
        let packingData: PackingListRef | null = null
        
        if (refResults.docs.length > 0) {
          packingData = { 
            ...refResults.docs[0].data(), 
            id: refResults.docs[0].id 
          } as PackingListRef
        } else if (stringResults.docs.length > 0) {
          packingData = { 
            ...stringResults.docs[0].data(), 
            id: stringResults.docs[0].id 
          } as PackingListRef
        }

        setPackingList(packingData)
      } catch (err) {
        console.error('Error fetching packing list:', err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchPackingList()
  }, [tripId, userId])

  return { packingList, loading, error }
}