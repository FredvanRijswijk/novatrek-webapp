import { db, auth } from '@/lib/firebase'
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'

// Travel Expert Profile
export interface TravelExpert {
  id: string;
  userId: string; // Firebase Auth UID
  stripeConnectAccountId: string;
  businessName: string;
  bio: string;
  specializations: string[];
  rating: number;
  reviewCount: number;
  status: 'pending' | 'active' | 'suspended';
  onboardingComplete: boolean;
  payoutSchedule: 'daily' | 'weekly' | 'monthly';
  profileImageUrl?: string;
  contactEmail?: string;
  websiteUrl?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Marketplace Products
export interface MarketplaceProduct {
  id: string;
  expertId: string;
  type: 'trip_template' | 'consultation' | 'custom_planning';
  title: string;
  description: string;
  price: number; // in cents
  currency: string;
  duration?: string; // for services (e.g., "2 hours", "3 days")
  tripLength?: number; // for trip templates (number of days)
  destinations?: string[]; // for trip templates
  included: string[];
  highlights?: string[];
  images: string[];
  status: 'draft' | 'active' | 'inactive';
  salesCount: number;
  rating: number;
  reviewCount: number;
  tags?: string[];
  maxGroupSize?: number;
  difficulty?: 'easy' | 'moderate' | 'challenging';
  bestTimeToVisit?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Marketplace Transactions
export interface MarketplaceTransaction {
  id: string;
  stripePaymentIntentId: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  productType: 'trip_template' | 'consultation' | 'custom_planning';
  productTitle: string;
  amount: number; // total amount in cents
  platformFee: number; // platform fee in cents
  sellerEarnings: number; // seller earnings in cents
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'refunded' | 'failed' | 'disputed';
  transferId?: string; // Stripe transfer ID
  refundId?: string; // Stripe refund ID
  disputeId?: string; // Stripe dispute ID
  metadata?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
  refundedAt?: Date;
}

// Product Reviews
export interface ProductReview {
  id: string;
  productId: string;
  productType: 'trip_template' | 'consultation' | 'custom_planning';
  buyerId: string;
  buyerName: string;
  buyerPhotoUrl?: string;
  sellerId: string;
  transactionId: string;
  rating: number; // 1-5
  comment: string;
  helpful: number; // count of helpful votes
  verified: boolean; // verified purchase
  response?: { // seller response
    text: string;
    date: Date;
  };
  createdAt: Date;
  updatedAt?: Date;
}

// Expert Application
export interface ExpertApplication {
  id: string;
  userId: string;
  businessName: string;
  email: string;
  phone?: string;
  experience: string;
  specializations: string[];
  portfolio?: string[];
  references?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'additional_info_required';
  reviewNotes?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

// Platform Configuration
export interface MarketplaceConfig {
  platformFeePercentage: number; // e.g., 0.15 for 15%
  minPlatformFee: number; // minimum fee in cents
  maxPlatformFee?: number; // optional maximum fee in cents
  supportedCurrencies: string[];
  payoutSchedules: ('daily' | 'weekly' | 'monthly')[];
  productTypes: {
    trip_template: { enabled: boolean; maxPrice?: number };
    consultation: { enabled: boolean; maxPrice?: number };
    custom_planning: { enabled: boolean; maxPrice?: number };
  };
}

// Firestore Collections
const COLLECTIONS = {
  EXPERTS: 'marketplace_experts',
  PRODUCTS: 'marketplace_products',
  TRANSACTIONS: 'marketplace_transactions',
  REVIEWS: 'marketplace_reviews',
  APPLICATIONS: 'marketplace_applications',
  CONFIG: 'marketplace_config'
} as const

export class MarketplaceModel {
  // Travel Expert Methods
  static async createExpert(data: Omit<TravelExpert, 'id' | 'createdAt' | 'updatedAt'>): Promise<TravelExpert> {
    const docRef = doc(collection(db, COLLECTIONS.EXPERTS))
    const expert = {
      ...data,
      id: docRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    await setDoc(docRef, expert)
    return { ...expert, createdAt: new Date(), updatedAt: new Date() }
  }

  static async getExpert(expertId: string): Promise<TravelExpert | null> {
    const docRef = doc(db, COLLECTIONS.EXPERTS, expertId)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return null
    const data = docSnap.data()
    return {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as TravelExpert
  }

  static async getExpertByUserId(userId: string): Promise<TravelExpert | null> {
    const q = query(
      collection(db, COLLECTIONS.EXPERTS),
      where('userId', '==', userId),
      limit(1)
    )
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) return null
    const doc = querySnapshot.docs[0]
    const data = doc.data()
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as TravelExpert
  }

  static async updateExpert(expertId: string, data: Partial<TravelExpert>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.EXPERTS, expertId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    })
  }

  // Product Methods
  static async createProduct(data: Omit<MarketplaceProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarketplaceProduct> {
    const docRef = doc(collection(db, COLLECTIONS.PRODUCTS))
    const product = {
      ...data,
      id: docRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    await setDoc(docRef, product)
    return { ...product, createdAt: new Date(), updatedAt: new Date() }
  }

  static async getProduct(productId: string): Promise<MarketplaceProduct | null> {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, productId)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return null
    const data = docSnap.data()
    return {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as MarketplaceProduct
  }

  static async getProductsByExpert(expertId: string, status?: 'draft' | 'active' | 'inactive'): Promise<MarketplaceProduct[]> {
    let q = query(
      collection(db, COLLECTIONS.PRODUCTS),
      where('expertId', '==', expertId)
    )
    
    if (status) {
      q = query(q, where('status', '==', status))
    }
    
    q = query(q, orderBy('createdAt', 'desc'))
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as MarketplaceProduct
    })
  }

  static async updateProduct(productId: string, data: Partial<MarketplaceProduct>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, productId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    })
  }

  // Transaction Methods
  static async createTransaction(data: Omit<MarketplaceTransaction, 'id' | 'createdAt'>): Promise<MarketplaceTransaction> {
    const docRef = doc(collection(db, COLLECTIONS.TRANSACTIONS))
    const transaction = {
      ...data,
      id: docRef.id,
      createdAt: serverTimestamp()
    }
    await setDoc(docRef, transaction)
    return { ...transaction, createdAt: new Date() }
  }

  static async getTransaction(transactionId: string): Promise<MarketplaceTransaction | null> {
    const docRef = doc(db, COLLECTIONS.TRANSACTIONS, transactionId)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return null
    const data = docSnap.data()
    return {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      completedAt: data.completedAt?.toDate(),
      refundedAt: data.refundedAt?.toDate()
    } as MarketplaceTransaction
  }

  static async getTransactionsByBuyer(buyerId: string, limit = 10): Promise<MarketplaceTransaction[]> {
    const q = query(
      collection(db, COLLECTIONS.TRANSACTIONS),
      where('buyerId', '==', buyerId),
      orderBy('createdAt', 'desc'),
      limit
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate(),
        refundedAt: data.refundedAt?.toDate()
      } as MarketplaceTransaction
    })
  }

  static async getTransactionsBySeller(sellerId: string, limit = 10): Promise<MarketplaceTransaction[]> {
    const q = query(
      collection(db, COLLECTIONS.TRANSACTIONS),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc'),
      limit
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate(),
        refundedAt: data.refundedAt?.toDate()
      } as MarketplaceTransaction
    })
  }

  static async updateTransaction(transactionId: string, data: Partial<MarketplaceTransaction>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TRANSACTIONS, transactionId)
    await updateDoc(docRef, data)
  }

  // Review Methods
  static async createReview(data: Omit<ProductReview, 'id' | 'createdAt'>): Promise<ProductReview> {
    const docRef = doc(collection(db, COLLECTIONS.REVIEWS))
    const review = {
      ...data,
      id: docRef.id,
      createdAt: serverTimestamp()
    }
    await setDoc(docRef, review)
    return { ...review, createdAt: new Date() }
  }

  static async getReviewsByProduct(productId: string, limit = 10): Promise<ProductReview[]> {
    const q = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc'),
      limit
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
        response: data.response ? {
          text: data.response.text,
          date: data.response.date?.toDate() || new Date()
        } : undefined
      } as ProductReview
    })
  }

  static async hasUserReviewedProduct(buyerId: string, productId: string): Promise<boolean> {
    const q = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('buyerId', '==', buyerId),
      where('productId', '==', productId),
      limit(1)
    )
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  }

  // Application Methods
  static async submitApplication(data: Omit<ExpertApplication, 'id' | 'submittedAt' | 'status'>): Promise<string> {
    const docRef = doc(collection(db, COLLECTIONS.APPLICATIONS))
    const application = {
      ...data,
      id: docRef.id,
      status: 'pending' as const,
      submittedAt: serverTimestamp()
    }
    await setDoc(docRef, application)
    return docRef.id
  }

  static async getApplicationByUserId(userId: string): Promise<ExpertApplication | null> {
    const q = query(
      collection(db, COLLECTIONS.APPLICATIONS),
      where('userId', '==', userId),
      orderBy('submittedAt', 'desc'),
      limit(1)
    )
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) return null
    const doc = querySnapshot.docs[0]
    const data = doc.data()
    return {
      ...data,
      id: doc.id,
      submittedAt: data.submittedAt?.toDate() || new Date(),
      reviewedAt: data.reviewedAt?.toDate()
    } as ExpertApplication
  }

  static async getApplicationById(applicationId: string): Promise<ExpertApplication | null> {
    const docRef = doc(db, COLLECTIONS.APPLICATIONS, applicationId)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return null
    const data = docSnap.data()
    return {
      ...data,
      id: docSnap.id,
      submittedAt: data.submittedAt?.toDate() || new Date(),
      reviewedAt: data.reviewedAt?.toDate()
    } as ExpertApplication
  }

  // Configuration Methods
  static async getMarketplaceConfig(): Promise<MarketplaceConfig> {
    const docRef = doc(db, COLLECTIONS.CONFIG, 'default')
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) {
      // Return default config if not set
      return {
        platformFeePercentage: 0.15,
        minPlatformFee: 100, // $1.00 minimum
        supportedCurrencies: ['usd'],
        payoutSchedules: ['daily', 'weekly', 'monthly'],
        productTypes: {
          trip_template: { enabled: true },
          consultation: { enabled: true },
          custom_planning: { enabled: true }
        }
      }
    }
    return docSnap.data() as MarketplaceConfig
  }
}