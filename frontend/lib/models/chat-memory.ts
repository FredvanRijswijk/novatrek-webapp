import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  Timestamp,
  DocumentReference 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface ChatMemory {
  id: string;
  tripId: string;
  tripRef: DocumentReference;
  userRef: DocumentReference;
  type: 'recommendation' | 'tip' | 'booking' | 'note' | 'place';
  title: string;
  content: string;
  metadata: {
    day?: number;
    category?: string;
    placeId?: string;
    placeName?: string;
    tags: string[];
    source?: {
      messageId?: string;
      timestamp?: Date;
    };
  };
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateChatMemoryData = Omit<ChatMemory, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateChatMemoryData = Partial<Omit<ChatMemory, 'id' | 'tripRef' | 'userRef' | 'createdAt'>>;

export class ChatMemoryModel {
  private static COLLECTION = 'chat_memories';

  /**
   * Create a new chat memory
   */
  static async create(data: CreateChatMemoryData): Promise<ChatMemory> {
    const docRef = doc(collection(db, this.COLLECTION));
    const now = new Date();
    
    const memory: ChatMemory = {
      ...data,
      id: docRef.id,
      createdAt: now,
      updatedAt: now
    };

    await setDoc(docRef, {
      ...memory,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    });

    return memory;
  }

  /**
   * Get a chat memory by ID
   */
  static async getById(memoryId: string): Promise<ChatMemory | null> {
    const docRef = doc(db, this.COLLECTION, memoryId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      metadata: {
        ...data.metadata,
        source: data.metadata?.source ? {
          ...data.metadata.source,
          timestamp: data.metadata.source.timestamp?.toDate()
        } : undefined
      }
    } as ChatMemory;
  }

  /**
   * Get all memories for a trip
   */
  static async getTripMemories(tripId: string): Promise<ChatMemory[]> {
    const tripRef = doc(db, 'trips', tripId);
    const q = query(
      collection(db, this.COLLECTION),
      where('tripRef', '==', tripRef),
      orderBy('isPinned', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        metadata: {
          ...data.metadata,
          source: data.metadata?.source ? {
            ...data.metadata.source,
            timestamp: data.metadata.source.timestamp?.toDate()
          } : undefined
        }
      } as ChatMemory;
    });
  }

  /**
   * Get memories by type
   */
  static async getByType(tripId: string, type: ChatMemory['type']): Promise<ChatMemory[]> {
    const tripRef = doc(db, 'trips', tripId);
    const q = query(
      collection(db, this.COLLECTION),
      where('tripRef', '==', tripRef),
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        metadata: {
          ...data.metadata,
          source: data.metadata?.source ? {
            ...data.metadata.source,
            timestamp: data.metadata.source.timestamp?.toDate()
          } : undefined
        }
      } as ChatMemory;
    });
  }

  /**
   * Get memories by day
   */
  static async getByDay(tripId: string, dayNumber: number): Promise<ChatMemory[]> {
    const tripRef = doc(db, 'trips', tripId);
    const q = query(
      collection(db, this.COLLECTION),
      where('tripRef', '==', tripRef),
      where('metadata.day', '==', dayNumber),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        metadata: {
          ...data.metadata,
          source: data.metadata?.source ? {
            ...data.metadata.source,
            timestamp: data.metadata.source.timestamp?.toDate()
          } : undefined
        }
      } as ChatMemory;
    });
  }

  /**
   * Search memories by tags
   */
  static async searchByTags(tripId: string, tags: string[]): Promise<ChatMemory[]> {
    const tripRef = doc(db, 'trips', tripId);
    const q = query(
      collection(db, this.COLLECTION),
      where('tripRef', '==', tripRef),
      where('metadata.tags', 'array-contains-any', tags),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        metadata: {
          ...data.metadata,
          source: data.metadata?.source ? {
            ...data.metadata.source,
            timestamp: data.metadata.source.timestamp?.toDate()
          } : undefined
        }
      } as ChatMemory;
    });
  }

  /**
   * Update a memory
   */
  static async update(memoryId: string, data: UpdateChatMemoryData): Promise<void> {
    const docRef = doc(db, this.COLLECTION, memoryId);
    await setDoc(docRef, {
      ...data,
      updatedAt: Timestamp.fromDate(new Date())
    }, { merge: true });
  }

  /**
   * Toggle pin status
   */
  static async togglePin(memoryId: string): Promise<boolean> {
    const memory = await this.getById(memoryId);
    if (!memory) throw new Error('Memory not found');

    const newPinStatus = !memory.isPinned;
    await this.update(memoryId, { isPinned: newPinStatus });
    return newPinStatus;
  }

  /**
   * Delete a memory
   */
  static async delete(memoryId: string): Promise<void> {
    await deleteDoc(doc(db, this.COLLECTION, memoryId));
  }

  /**
   * Extract and save memory from chat message
   */
  static async createFromMessage(
    message: string,
    type: ChatMemory['type'],
    tripId: string,
    userId: string,
    metadata?: Partial<ChatMemory['metadata']>
  ): Promise<ChatMemory> {
    // Extract title from message (first line or first sentence)
    const title = message.split('\n')[0].substring(0, 100);
    
    // Auto-generate tags based on content
    const tags = this.extractTags(message, type);
    
    const userRef = doc(db, 'users', userId);
    const tripRef = doc(db, 'trips', tripId);

    return this.create({
      tripId,
      tripRef,
      userRef,
      type,
      title,
      content: message,
      metadata: {
        ...metadata,
        tags,
        source: {
          timestamp: new Date()
        }
      },
      isPinned: false
    });
  }

  /**
   * Extract relevant tags from content
   */
  private static extractTags(content: string, type: ChatMemory['type']): string[] {
    const tags: string[] = [type];
    const lowerContent = content.toLowerCase();

    // Common travel tags
    const tagPatterns = {
      restaurant: /restaurant|food|dining|eat|meal|breakfast|lunch|dinner/i,
      activity: /activity|visit|tour|museum|park|beach|hiking/i,
      transport: /transport|bus|train|metro|taxi|uber|flight/i,
      accommodation: /hotel|hostel|airbnb|stay|accommodation/i,
      shopping: /shop|buy|market|mall|souvenir/i,
      tip: /tip|advice|recommend|suggest|should|must/i,
      warning: /warning|avoid|careful|dangerous|closed/i,
      budget: /budget|cost|price|expensive|cheap|free/i
    };

    Object.entries(tagPatterns).forEach(([tag, pattern]) => {
      if (pattern.test(lowerContent)) {
        tags.push(tag);
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }
}