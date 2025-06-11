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
  subscribeToCollection,
  where,
  orderBy,
  limit as firestoreLimit
} from '@/lib/firebase'
import { db } from '@/lib/firebase'
import { ChatMessage, ChatSession, AIProvider } from './chat'
import { User } from './user'
import { Trip } from '@/types/travel'

// Enhanced types with reference fields
export interface ChatMessageEnhanced extends ChatMessage {
  userRef?: DocumentReference<User>
  tripRef?: DocumentReference<Trip>
}

export interface ChatSessionEnhanced extends ChatSession {
  userRef?: DocumentReference<User>
  tripRef?: DocumentReference<Trip>
}

export class ChatModelEnhanced {
  private static db = db

  // Create a new chat message with references
  static async createMessage(
    message: Omit<ChatMessage, 'id' | 'createdAt' | 'metadata'>
  ): Promise<string> {
    const enhancedData: any = {
      ...message,
      metadata: {
        model: message.provider || 'vertex-gemini-flash'
      }
    }

    // Add references alongside string IDs
    if (message.userId) {
      enhancedData.userRef = doc(this.db, 'users', message.userId)
    }
    if (message.tripId) {
      enhancedData.tripRef = doc(this.db, 'trips', message.tripId)
    }

    const docRef = await createDocument('chat_messages', enhancedData)
    return docRef.id
  }

  // Get chat messages for a trip - queries both patterns
  static async getTripMessages(
    tripId: string, 
    limit: number = 50
  ): Promise<ChatMessageEnhanced[]> {
    const tripRef = doc(this.db, 'trips', tripId)
    
    // Query both patterns
    const [refMessages, stringMessages] = await Promise.all([
      getCollection<ChatMessageEnhanced>(
        'chat_messages',
        where('tripRef', '==', tripRef),
        orderBy('createdAt', 'asc'),
        firestoreLimit(limit)
      ),
      getCollection<ChatMessageEnhanced>(
        'chat_messages',
        where('tripId', '==', tripId),
        orderBy('createdAt', 'asc'),
        firestoreLimit(limit)
      )
    ])

    // Combine and deduplicate, maintaining order
    const messageMap = new Map<string, ChatMessageEnhanced>()
    
    // Add all messages to map to deduplicate
    refMessages.forEach(msg => {
      messageMap.set(msg.id, msg)
    })
    stringMessages.forEach(msg => {
      messageMap.set(msg.id, msg)
    })

    // Sort by createdAt
    return Array.from(messageMap.values()).sort((a, b) => 
      a.createdAt.toMillis() - b.createdAt.toMillis()
    )
  }

  // Get user's chat messages - queries both patterns
  static async getUserMessages(
    userId: string, 
    limit: number = 50
  ): Promise<ChatMessageEnhanced[]> {
    const userRef = doc(this.db, 'users', userId)
    
    const [refMessages, stringMessages] = await Promise.all([
      getCollection<ChatMessageEnhanced>(
        'chat_messages',
        where('userRef', '==', userRef),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      ),
      getCollection<ChatMessageEnhanced>(
        'chat_messages',
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      )
    ])

    // Combine and deduplicate
    const messageMap = new Map<string, ChatMessageEnhanced>()
    
    refMessages.forEach(msg => {
      messageMap.set(msg.id, msg)
    })
    stringMessages.forEach(msg => {
      messageMap.set(msg.id, msg)
    })

    return Array.from(messageMap.values()).sort((a, b) => 
      b.createdAt.toMillis() - a.createdAt.toMillis()
    )
  }

  // Create a chat session with references
  static async createSession(
    session: Omit<ChatSession, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const enhancedData: any = {
      ...session,
      messageCount: 0,
      lastMessageAt: serverTimestamp()
    }

    // Add references
    if (session.userId) {
      enhancedData.userRef = doc(this.db, 'users', session.userId)
    }
    if (session.tripId) {
      enhancedData.tripRef = doc(this.db, 'trips', session.tripId)
    }

    const docRef = await createDocument('chat_sessions', enhancedData)
    return docRef.id
  }

  // Subscribe to trip messages with both patterns
  static subscribeToTripMessages(
    tripId: string,
    callback: (messages: ChatMessageEnhanced[]) => void,
    limit: number = 50
  ) {
    const tripRef = doc(this.db, 'trips', tripId)
    const messageMap = new Map<string, ChatMessageEnhanced>()

    // Subscribe to reference-based messages
    const unsubRef = subscribeToCollection<ChatMessageEnhanced>(
      'chat_messages',
      (refMessages) => {
        // Update map with reference-based messages
        refMessages.forEach(msg => {
          messageMap.set(msg.id, msg)
        })
        
        // Call callback with combined results
        const allMessages = Array.from(messageMap.values())
          .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis())
        callback(allMessages)
      },
      where('tripRef', '==', tripRef),
      orderBy('createdAt', 'asc'),
      firestoreLimit(limit)
    )

    // Subscribe to string-based messages
    const unsubString = subscribeToCollection<ChatMessageEnhanced>(
      'chat_messages',
      (stringMessages) => {
        // Update map with string-based messages
        stringMessages.forEach(msg => {
          if (!messageMap.has(msg.id)) {
            messageMap.set(msg.id, msg)
          }
        })
        
        // Call callback with combined results
        const allMessages = Array.from(messageMap.values())
          .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis())
        callback(allMessages)
      },
      where('tripId', '==', tripId),
      orderBy('createdAt', 'asc'),
      firestoreLimit(limit)
    )

    // Return combined unsubscribe function
    return () => {
      unsubRef()
      unsubString()
    }
  }

  // Helper to update existing messages with references
  static async updateMessageWithReferences(
    messageId: string, 
    userId?: string, 
    tripId?: string
  ): Promise<void> {
    const updates: any = {}
    
    if (userId) {
      updates.userRef = doc(this.db, 'users', userId)
    }
    if (tripId) {
      updates.tripRef = doc(this.db, 'trips', tripId)
    }

    if (Object.keys(updates).length > 0) {
      await updateDocument('chat_messages', messageId, updates)
    }
  }

  // Get message statistics for a user
  static async getUserStats(userId: string): Promise<{
    totalMessages: number
    sessionsCount: number
    tripsWithChat: number
  }> {
    const userRef = doc(this.db, 'users', userId)
    
    // Get messages count
    const [refMessages, stringMessages] = await Promise.all([
      getCollection<ChatMessageEnhanced>(
        'chat_messages',
        where('userRef', '==', userRef),
        where('role', '==', 'user')
      ),
      getCollection<ChatMessageEnhanced>(
        'chat_messages',
        where('userId', '==', userId),
        where('role', '==', 'user')
      )
    ])

    // Deduplicate messages
    const messageIds = new Set<string>()
    const tripIds = new Set<string>()
    
    refMessages.forEach(msg => {
      messageIds.add(msg.id)
      if (msg.tripId) tripIds.add(msg.tripId)
    })
    stringMessages.forEach(msg => {
      messageIds.add(msg.id)
      if (msg.tripId) tripIds.add(msg.tripId)
    })

    // Get sessions count
    const [refSessions, stringSessions] = await Promise.all([
      getCollection<ChatSessionEnhanced>(
        'chat_sessions',
        where('userRef', '==', userRef)
      ),
      getCollection<ChatSessionEnhanced>(
        'chat_sessions',
        where('userId', '==', userId)
      )
    ])

    const sessionIds = new Set<string>()
    refSessions.forEach(session => {
      sessionIds.add(session.id)
    })
    stringSessions.forEach(session => {
      sessionIds.add(session.id)
    })

    return {
      totalMessages: messageIds.size,
      sessionsCount: sessionIds.size,
      tripsWithChat: tripIds.size
    }
  }

  // Delete a chat message
  static async delete(messageId: string): Promise<void> {
    await deleteDocument('chat_messages', messageId)
  }
}