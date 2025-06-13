import { getAdminDb } from '@/lib/firebase/admin';
import { 
  FeedbackCategory, 
  FeedbackStatus, 
  FeedbackPriority, 
  FeedbackEntry 
} from './feedback-model';

export class FeedbackModelAdmin {
  private collectionName = 'feedback';
  
  private getDb() {
    const db = getAdminDb();
    if (!db) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    return db;
  }

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
    const docRef = this.getDb().collection(this.collectionName).doc();
    
    const entry = {
      ...data,
      status: 'new' as FeedbackStatus,
      createdAt: new Date(),
    };

    await docRef.set(entry);

    return {
      id: docRef.id,
      ...entry,
      createdAt: entry.createdAt as any,
    };
  }

  async getFeedbackById(id: string): Promise<FeedbackEntry | null> {
    const doc = await this.getDb().collection(this.collectionName).doc(id).get();
    
    if (!doc.exists) return null;
    
    return {
      id: doc.id,
      ...doc.data(),
    } as FeedbackEntry;
  }

  async getUserFeedback(userId: string, pageSize: number = 20): Promise<FeedbackEntry[]> {
    const snapshot = await this.getDb()
      .collection(this.collectionName)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(pageSize)
      .get();
    
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
    let query = this.getDb()
      .collection(this.collectionName)
      .orderBy('createdAt', 'desc')
      .limit(pageSize);

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters?.category) {
      query = query.where('category', '==', filters.category);
    }

    const snapshot = await query.get();
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
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (status === 'completed' || status === 'wont_fix') {
      updateData.resolvedAt = new Date();
    }

    await this.getDb().collection(this.collectionName).doc(id).update(updateData);
  }

  async getFeedbackStats() {
    const snapshot = await this.getDb().collection(this.collectionName).get();
    
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