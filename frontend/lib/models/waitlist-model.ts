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

export interface WaitlistEntry {
  id: string;
  email: string;
  name?: string;
  referralSource?: string;
  interests?: string[];
  createdAt: Timestamp;
  approvedAt?: Timestamp;
  invitedAt?: Timestamp;
  status: 'pending' | 'approved' | 'invited' | 'joined';
  position?: number;
  metadata?: {
    ip?: string;
    userAgent?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
}

export class WaitlistModel {
  private collectionName = 'waitlist';

  async addToWaitlist(data: {
    email: string;
    name?: string;
    referralSource?: string;
    interests?: string[];
    metadata?: WaitlistEntry['metadata'];
  }): Promise<WaitlistEntry> {
    // Check if email already exists
    const existing = await this.getByEmail(data.email);
    if (existing) {
      throw new Error('Email already on waitlist');
    }

    // Get current position
    const position = await this.getNextPosition();

    const entry: Omit<WaitlistEntry, 'id'> = {
      ...data,
      createdAt: serverTimestamp() as Timestamp,
      status: 'pending',
      position,
    };

    const docRef = doc(collection(db, this.collectionName));
    await setDoc(docRef, entry);

    return {
      id: docRef.id,
      ...entry,
      createdAt: Timestamp.now(), // Temporary for return
    };
  }

  async getByEmail(email: string): Promise<WaitlistEntry | null> {
    const q = query(
      collection(db, this.collectionName),
      where('email', '==', email.toLowerCase())
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as WaitlistEntry;
  }

  async getById(id: string): Promise<WaitlistEntry | null> {
    const docRef = doc(db, this.collectionName, id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as WaitlistEntry;
  }

  async getNextPosition(): Promise<number> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('position', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return 1;
    
    const lastEntry = snapshot.docs[0].data() as WaitlistEntry;
    return (lastEntry.position || 0) + 1;
  }

  async approveUser(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
    });
  }

  async inviteUser(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      status: 'invited',
      invitedAt: serverTimestamp(),
    });
  }

  async markAsJoined(email: string): Promise<void> {
    const entry = await this.getByEmail(email);
    if (!entry) return;

    const docRef = doc(db, this.collectionName, entry.id);
    await updateDoc(docRef, {
      status: 'joined',
    });
  }

  async getWaitlistStats() {
    const snapshot = await getDocs(collection(db, this.collectionName));
    
    const stats = {
      total: snapshot.size,
      pending: 0,
      approved: 0,
      invited: 0,
      joined: 0,
    };

    snapshot.forEach((doc) => {
      const data = doc.data() as WaitlistEntry;
      stats[data.status]++;
    });

    return stats;
  }

  async getWaitlistEntries(
    status?: WaitlistEntry['status'],
    pageSize: number = 50
  ): Promise<WaitlistEntry[]> {
    let q = query(
      collection(db, this.collectionName),
      orderBy('createdAt', 'desc')
    );

    if (status) {
      q = query(
        collection(db, this.collectionName),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as WaitlistEntry[];
  }
}