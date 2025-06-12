/**
 * Base Model for V2 Subcollection Structure
 * Provides common CRUD operations for all subcollections
 */

import { 
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Query,
  DocumentReference,
  CollectionReference,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  WriteBatch,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cleanFirestoreData, convertTimestampsToDates } from '@/lib/utils/firebase-helpers';

export interface BaseDocument {
  id: string;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export abstract class BaseModelV2<T extends BaseDocument> {
  protected db = db;
  
  constructor(
    protected collectionPath: string | ((ids: string[]) => string)
  ) {}

  /**
   * Get the collection reference
   */
  protected getCollection(pathIds?: string[]): CollectionReference {
    const path = typeof this.collectionPath === 'function' 
      ? this.collectionPath(pathIds || [])
      : this.collectionPath;
    return collection(this.db, path);
  }

  /**
   * Create a new document
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, pathIds?: string[]): Promise<T> {
    const cleanedData = cleanFirestoreData({
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const docRef = await addDoc(this.getCollection(pathIds), cleanedData);
    const created = await this.getById(docRef.id, pathIds);
    
    if (!created) {
      throw new Error('Failed to create document');
    }
    
    return created;
  }

  /**
   * Get a document by ID
   */
  async getById(id: string, pathIds?: string[]): Promise<T | null> {
    const docRef = doc(this.getCollection(pathIds), id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = { id: docSnap.id, ...docSnap.data() } as T;
    return convertTimestampsToDates(data);
  }

  /**
   * Update a document
   */
  async update(id: string, updates: Partial<T>, pathIds?: string[]): Promise<void> {
    const cleanedUpdates = cleanFirestoreData({
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    const docRef = doc(this.getCollection(pathIds), id);
    await updateDoc(docRef, cleanedUpdates);
  }

  /**
   * Delete a document
   */
  async delete(id: string, pathIds?: string[]): Promise<void> {
    const docRef = doc(this.getCollection(pathIds), id);
    await deleteDoc(docRef);
  }

  /**
   * List documents with optional filters
   */
  async list(
    pathIds?: string[],
    filters?: Array<ReturnType<typeof where>>,
    ordering?: ReturnType<typeof orderBy>,
    limitCount?: number
  ): Promise<T[]> {
    let q: Query = this.getCollection(pathIds);
    
    if (filters) {
      filters.forEach(filter => {
        q = query(q, filter);
      });
    }
    
    if (ordering) {
      q = query(q, ordering);
    }
    
    if (limitCount) {
      q = query(q, firestoreLimit(limitCount));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() } as T;
      return convertTimestampsToDates(data);
    });
  }

  /**
   * Subscribe to a document
   */
  subscribe(
    id: string,
    callback: (data: T | null) => void,
    pathIds?: string[]
  ): () => void {
    const docRef = doc(this.getCollection(pathIds), id);
    
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() } as T;
        callback(convertTimestampsToDates(data));
      } else {
        callback(null);
      }
    });
  }

  /**
   * Subscribe to a collection
   */
  subscribeToCollection(
    callback: (data: T[]) => void,
    pathIds?: string[],
    filters?: Array<ReturnType<typeof where>>,
    ordering?: ReturnType<typeof orderBy>
  ): () => void {
    let q: Query = this.getCollection(pathIds);
    
    if (filters) {
      filters.forEach(filter => {
        q = query(q, filter);
      });
    }
    
    if (ordering) {
      q = query(q, ordering);
    }
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = { id: doc.id, ...doc.data() } as T;
        return convertTimestampsToDates(docData);
      });
      callback(data);
    });
  }

  /**
   * Batch operations
   */
  createBatch(): WriteBatch {
    return writeBatch(this.db);
  }

  /**
   * Add create operation to batch
   */
  batchCreate(
    batch: WriteBatch,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
    pathIds?: string[]
  ): DocumentReference {
    const cleanedData = cleanFirestoreData({
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    const docRef = doc(this.getCollection(pathIds));
    batch.set(docRef, cleanedData);
    return docRef;
  }

  /**
   * Add update operation to batch
   */
  batchUpdate(
    batch: WriteBatch,
    id: string,
    updates: Partial<T>,
    pathIds?: string[]
  ): void {
    const cleanedUpdates = cleanFirestoreData({
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    const docRef = doc(this.getCollection(pathIds), id);
    batch.update(docRef, cleanedUpdates);
  }

  /**
   * Add delete operation to batch
   */
  batchDelete(
    batch: WriteBatch,
    id: string,
    pathIds?: string[]
  ): void {
    const docRef = doc(this.getCollection(pathIds), id);
    batch.delete(docRef);
  }

  /**
   * Count documents in collection
   */
  async count(
    pathIds?: string[],
    filters?: Array<ReturnType<typeof where>>
  ): Promise<number> {
    let q: Query = this.getCollection(pathIds);
    
    if (filters) {
      filters.forEach(filter => {
        q = query(q, filter);
      });
    }
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  }
}