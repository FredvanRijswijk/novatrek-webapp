/**
 * Base Model for V2 Subcollection Structure - Admin Version
 * Uses Firebase Admin SDK for server-side operations
 */

import { Firestore } from 'firebase-admin/firestore';
import { cleanFirestoreData, convertTimestampsToDates } from '@/lib/utils/firebase-helpers';

export interface BaseDocument {
  id: string;
  createdAt: any;
  updatedAt: any;
}

export abstract class BaseModelAdminV2<T extends BaseDocument> {
  protected db: Firestore;
  
  constructor(
    db: Firestore,
    protected collectionPath: string | ((ids: string[]) => string)
  ) {
    this.db = db;
  }

  /**
   * Get the collection reference
   */
  protected getCollection(pathIds?: string[]) {
    const path = typeof this.collectionPath === 'function' 
      ? this.collectionPath(pathIds || [])
      : this.collectionPath;
    return this.db.collection(path);
  }

  /**
   * Create a new document
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, pathIds?: string[]): Promise<T> {
    const cleanedData = cleanFirestoreData({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const docRef = await this.getCollection(pathIds).add(cleanedData);
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
    const docRef = this.getCollection(pathIds).doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
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
      updatedAt: new Date()
    });
    
    await this.getCollection(pathIds).doc(id).update(cleanedUpdates);
  }

  /**
   * Delete a document
   */
  async delete(id: string, pathIds?: string[]): Promise<void> {
    await this.getCollection(pathIds).doc(id).delete();
  }

  /**
   * List documents with optional filters
   */
  async list(
    pathIds?: string[],
    filters?: Array<{ field: string; op: any; value: any }>,
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'asc',
    limitCount?: number
  ): Promise<T[]> {
    let query = this.getCollection(pathIds);
    
    if (filters) {
      filters.forEach(filter => {
        query = query.where(filter.field, filter.op, filter.value) as any;
      });
    }
    
    if (orderByField) {
      query = query.orderBy(orderByField, orderDirection) as any;
    }
    
    if (limitCount) {
      query = query.limit(limitCount) as any;
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() } as T;
      return convertTimestampsToDates(data);
    });
  }

  /**
   * Create batch for bulk operations
   */
  createBatch() {
    return this.db.batch();
  }

  /**
   * Batch create operation
   */
  batchCreate(batch: any, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, pathIds?: string[]) {
    const docRef = this.getCollection(pathIds).doc();
    const cleanedData = cleanFirestoreData({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    batch.set(docRef, cleanedData);
    return docRef;
  }

  /**
   * Batch delete operation
   */
  batchDelete(batch: any, id: string, pathIds?: string[]) {
    const docRef = this.getCollection(pathIds).doc(id);
    batch.delete(docRef);
  }
}