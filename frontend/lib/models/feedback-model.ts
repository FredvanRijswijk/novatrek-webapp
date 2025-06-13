import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  collection,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export type FeedbackCategory = 
  | 'bug'
  | 'feature_request'
  | 'improvement'
  | 'ui_ux'
  | 'performance'
  | 'other';

export type FeedbackStatus = 
  | 'new'
  | 'in_review'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'wont_fix';

export type FeedbackPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export interface FeedbackEntry {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  category: FeedbackCategory;
  title: string;
  description: string;
  rating?: number; // 1-5 satisfaction rating
  status: FeedbackStatus;
  priority?: FeedbackPriority;
  adminNotes?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  resolvedAt?: Timestamp;
  metadata?: {
    url?: string; // Page where feedback was submitted
    userAgent?: string;
    screenResolution?: string;
    appVersion?: string;
  };
}

export class FeedbackModel {
  private collectionName = 'feedback';

  async createFeedback(data: {
    userId: string;
    userEmail: string;
    userName?: string;
    category: FeedbackCategory;
    title: string;
    description: string;
    rating?: number;
    metadata?: FeedbackEntry['metadata'];
  }): Promise<FeedbackEntry> {
    const entry: Omit<FeedbackEntry, 'id'> = {
      ...data,
      status: 'new',
      createdAt: serverTimestamp() as Timestamp,
    };

    const docRef = doc(collection(db, this.collectionName));
    await setDoc(docRef, entry);

    return {
      id: docRef.id,
      ...entry,
      createdAt: Timestamp.now(), // Temporary for return
    };
  }

  async getFeedbackById(id: string): Promise<FeedbackEntry | null> {
    const docRef = doc(db, this.collectionName, id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as FeedbackEntry;
  }

  async getUserFeedback(userId: string, pageSize: number = 20): Promise<FeedbackEntry[]> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as FeedbackEntry[];
  }

  async getAllFeedback(
    filters?: {
      status?: FeedbackStatus;
      category?: FeedbackCategory;
      priority?: FeedbackPriority;
    },
    pageSize: number = 50
  ): Promise<FeedbackEntry[]> {
    let q = query(
      collection(db, this.collectionName),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    // Apply filters if provided
    if (filters?.status) {
      q = query(
        collection(db, this.collectionName),
        where('status', '==', filters.status),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
    }

    if (filters?.category) {
      q = query(
        collection(db, this.collectionName),
        where('category', '==', filters.category),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as FeedbackEntry[];
  }

  async updateFeedbackStatus(
    id: string, 
    status: FeedbackStatus,
    adminNotes?: string,
    priority?: FeedbackPriority
  ): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (status === 'completed' || status === 'wont_fix') {
      updateData.resolvedAt = serverTimestamp();
    }

    await updateDoc(docRef, updateData);
  }

  async getFeedbackStats() {
    const snapshot = await getDocs(collection(db, this.collectionName));
    
    const stats = {
      total: snapshot.size,
      byStatus: {
        new: 0,
        in_review: 0,
        planned: 0,
        in_progress: 0,
        completed: 0,
        wont_fix: 0,
      },
      byCategory: {
        bug: 0,
        feature_request: 0,
        improvement: 0,
        ui_ux: 0,
        performance: 0,
        other: 0,
      },
      avgRating: 0,
      totalRatings: 0,
    };

    let totalRating = 0;
    let ratingCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data() as FeedbackEntry;
      stats.byStatus[data.status]++;
      stats.byCategory[data.category]++;
      
      if (data.rating) {
        totalRating += data.rating;
        ratingCount++;
      }
    });

    if (ratingCount > 0) {
      stats.avgRating = totalRating / ratingCount;
      stats.totalRatings = ratingCount;
    }

    return stats;
  }
}