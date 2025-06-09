import { 
  Timestamp, 
  DocumentReference,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where as whereConstraint,
  orderBy as orderByConstraint,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import { 
  createDocument, 
  updateDocument, 
  getDocument, 
  getCollection, 
  deleteDocument,
  where,
  orderBy
} from '@/lib/firebase';
import { convertTimestampsToDates } from '@/lib/utils/firebase-helpers';
import { TravelCapture } from './capture';
import { User } from './user';
import { Trip } from './trip';

export interface TravelCaptureEnhanced extends Omit<TravelCapture, 'userId' | 'assignedTo'> {
  // Keep string IDs for backward compatibility
  userId: string;
  assignedTo?: string; // tripId
  
  // Add DocumentReference fields for better querying
  userRef: DocumentReference<User>;
  tripRef?: DocumentReference<Trip>; // Reference to assigned trip
}


export class CaptureModelEnhanced {
  static COLLECTION = 'captures';
  static db = db;

  /**
   * Create a new capture with references
   */
  static async create(
    capture: Omit<TravelCaptureEnhanced, 'id' | 'createdAt' | 'updatedAt' | 'userRef' | 'tripRef'>,
    userId: string
  ): Promise<TravelCaptureEnhanced> {
    const userRef = doc(db, 'users', userId) as DocumentReference<User>;
    
    const captureData: any = {
      ...capture,
      userId, // Keep for backward compatibility
      userRef,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isProcessed: capture.isProcessed ?? false,
      isSorted: capture.isSorted ?? false,
      tags: capture.tags ?? []
    };

    // Add trip reference if assigned
    if (capture.assignedTo) {
      captureData.tripRef = doc(db, 'trips', capture.assignedTo) as DocumentReference<Trip>;
    }

    const docRef = await addDoc(collection(db, this.COLLECTION), captureData);
    
    return {
      ...capture,
      id: docRef.id,
      userRef,
      tripRef: captureData.tripRef,
      createdAt: new Date(),
      updatedAt: new Date(),
      isProcessed: capture.isProcessed ?? false,
      isSorted: capture.isSorted ?? false,
      tags: capture.tags ?? []
    } as TravelCaptureEnhanced;
  }

  /**
   * Get all captures for a user using references
   */
  static async getUserCaptures(userId: string): Promise<TravelCaptureEnhanced[]> {
    const userRef = doc(db, 'users', userId) as DocumentReference<User>;
    
    const captures = await getCollection<TravelCaptureEnhanced>(
      this.COLLECTION,
      where('userRef', '==', userRef),
      orderBy('capturedAt', 'desc')
    );
    
    return captures.map(capture => convertTimestampsToDates(capture));
  }

  /**
   * Get captures assigned to a specific trip
   */
  static async getTripCaptures(tripId: string): Promise<TravelCaptureEnhanced[]> {
    const tripRef = doc(db, 'trips', tripId) as DocumentReference<Trip>;
    
    const captures = await getCollection<TravelCaptureEnhanced>(
      this.COLLECTION,
      where('tripRef', '==', tripRef),
      orderBy('capturedAt', 'desc')
    );
    
    return captures.map(capture => convertTimestampsToDates(capture));
  }

  /**
   * Get unsorted captures (not assigned to any trip)
   */
  static async getUnsortedCaptures(userId: string): Promise<TravelCaptureEnhanced[]> {
    const userRef = doc(db, 'users', userId) as DocumentReference<User>;
    
    const captures = await getCollection<TravelCaptureEnhanced>(
      this.COLLECTION,
      where('userRef', '==', userRef),
      where('isSorted', '==', false),
      orderBy('capturedAt', 'desc')
    );
    
    return captures.map(capture => convertTimestampsToDates(capture));
  }

  /**
   * Update a capture
   */
  static async update(
    captureId: string,
    updates: Partial<Omit<TravelCaptureEnhanced, 'id' | 'userId' | 'userRef' | 'createdAt'>>
  ): Promise<void> {
    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    // Handle trip assignment
    if ('assignedTo' in updates) {
      if (updates.assignedTo) {
        updateData.tripRef = doc(db, 'trips', updates.assignedTo) as DocumentReference<Trip>;
        updateData.isSorted = true;
      } else {
        updateData.tripRef = null;
        updateData.isSorted = false;
      }
    }

    await updateDoc(doc(db, this.COLLECTION, captureId), updateData);
  }

  /**
   * Assign capture to a trip
   */
  static async assignToTrip(captureId: string, tripId: string | null): Promise<void> {
    const updates: any = {
      assignedTo: tripId,
      isSorted: !!tripId,
      updatedAt: serverTimestamp()
    };

    if (tripId) {
      updates.tripRef = doc(db, 'trips', tripId) as DocumentReference<Trip>;
    } else {
      updates.tripRef = null;
    }

    await updateDoc(doc(db, this.COLLECTION, captureId), updates);
  }

  /**
   * Update extracted data
   */
  static async updateExtractedData(
    captureId: string,
    extractedData: TravelCaptureEnhanced['extractedData']
  ): Promise<void> {
    await updateDoc(doc(db, this.COLLECTION, captureId), {
      extractedData,
      isProcessed: true,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Delete a capture
   */
  static async delete(captureId: string): Promise<void> {
    await deleteDoc(doc(db, this.COLLECTION, captureId));
  }

  /**
   * Subscribe to user captures with real-time updates
   */
  static subscribeToUserCaptures(
    userId: string,
    callback: (captures: TravelCaptureEnhanced[]) => void
  ): () => void {
    const userRef = doc(db, 'users', userId) as DocumentReference<User>;
    
    const q = collection(db, this.COLLECTION);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const captures = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          } as TravelCaptureEnhanced))
          .filter(capture => capture.userRef?.id === userRef.id)
          .sort((a, b) => {
            const dateA = a.capturedAt instanceof Timestamp ? a.capturedAt.toDate() : new Date(a.capturedAt);
            const dateB = b.capturedAt instanceof Timestamp ? b.capturedAt.toDate() : new Date(b.capturedAt);
            return dateB.getTime() - dateA.getTime();
          });
        
        callback(captures.map(capture => convertTimestampsToDates(capture)));
      }
    );

    return unsubscribe;
  }

  /**
   * Subscribe to trip captures with real-time updates
   */
  static subscribeToCapturesByTrip(
    tripId: string,
    callback: (captures: TravelCaptureEnhanced[]) => void
  ): () => void {
    const tripRef = doc(db, 'trips', tripId) as DocumentReference<Trip>;
    
    const q = collection(db, this.COLLECTION);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const captures = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          } as TravelCaptureEnhanced))
          .filter(capture => capture.tripRef?.id === tripRef.id)
          .sort((a, b) => {
            const dateA = a.capturedAt instanceof Timestamp ? a.capturedAt.toDate() : new Date(a.capturedAt);
            const dateB = b.capturedAt instanceof Timestamp ? b.capturedAt.toDate() : new Date(b.capturedAt);
            return dateB.getTime() - dateA.getTime();
          });
        
        callback(captures.map(capture => convertTimestampsToDates(capture)));
      }
    );

    return unsubscribe;
  }
}