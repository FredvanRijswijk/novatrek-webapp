import { 
  doc,
  DocumentReference,
  serverTimestamp,
  Timestamp,
  collection,
  writeBatch
} from 'firebase/firestore'
import { 
  createDocument, 
  updateDocument, 
  getDocument, 
  getCollection,
  where,
  orderBy
} from '@/lib/firebase'
import { db } from '@/lib/firebase'
import { User } from './user'
import { 
  MarketplaceExpert, 
  MarketplaceProduct, 
  MarketplaceTransaction,
  MarketplaceReview,
  MarketplaceApplication 
} from './marketplace'

// Enhanced types with reference fields
export interface MarketplaceExpertEnhanced extends MarketplaceExpert {
  userRef?: DocumentReference<User>
}

export interface MarketplaceProductEnhanced extends MarketplaceProduct {
  expertRef?: DocumentReference<MarketplaceExpertEnhanced>
}

export interface MarketplaceTransactionEnhanced extends MarketplaceTransaction {
  buyerRef?: DocumentReference<User>
  sellerRef?: DocumentReference<MarketplaceExpertEnhanced>
  productRef?: DocumentReference<MarketplaceProductEnhanced>
}

export interface MarketplaceReviewEnhanced extends MarketplaceReview {
  buyerRef?: DocumentReference<User>
  productRef?: DocumentReference<MarketplaceProductEnhanced>
  sellerRef?: DocumentReference<MarketplaceExpertEnhanced>
}

export interface MarketplaceApplicationEnhanced extends MarketplaceApplication {
  userRef?: DocumentReference<User>
  reviewedByRef?: DocumentReference<User>
}

export class MarketplaceModelEnhanced {
  private static db = db

  // Expert methods
  static async createExpert(data: Omit<MarketplaceExpert, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const enhancedData: any = {
      ...data,
      isApproved: false,
      stripeAccountStatus: 'pending',
    }

    // Add user reference alongside userId
    if (data.userId) {
      enhancedData.userRef = doc(this.db, 'users', data.userId)
    }

    const docRef = await createDocument('marketplace_experts', enhancedData)
    return docRef.id
  }

  static async getExpert(expertId: string): Promise<MarketplaceExpertEnhanced | null> {
    return await getDocument<MarketplaceExpertEnhanced>('marketplace_experts', expertId)
  }

  static async getExpertByUserId(userId: string): Promise<MarketplaceExpertEnhanced | null> {
    const userRef = doc(this.db, 'users', userId)
    
    // Try both patterns
    const [refExperts, stringExperts] = await Promise.all([
      getCollection<MarketplaceExpertEnhanced>(
        'marketplace_experts',
        where('userRef', '==', userRef)
      ),
      getCollection<MarketplaceExpertEnhanced>(
        'marketplace_experts',
        where('userId', '==', userId)
      )
    ])

    // Return first match from either query
    return refExperts[0] || stringExperts[0] || null
  }

  // Product methods
  static async createProduct(data: Omit<MarketplaceProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const enhancedData: any = {
      ...data,
      isActive: true,
      salesCount: 0,
      rating: 0,
      reviewCount: 0
    }

    // Add expert reference alongside expertId
    if (data.expertId) {
      enhancedData.expertRef = doc(this.db, 'marketplace_experts', data.expertId)
    }

    const docRef = await createDocument('marketplace_products', enhancedData)
    return docRef.id
  }

  static async getProduct(productId: string): Promise<MarketplaceProductEnhanced | null> {
    return await getDocument<MarketplaceProductEnhanced>('marketplace_products', productId)
  }

  static async getProductsByExpert(expertId: string): Promise<MarketplaceProductEnhanced[]> {
    const expertRef = doc(this.db, 'marketplace_experts', expertId)
    
    // Query both patterns
    const [refProducts, stringProducts] = await Promise.all([
      getCollection<MarketplaceProductEnhanced>(
        'marketplace_products',
        where('expertRef', '==', expertRef),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      ),
      getCollection<MarketplaceProductEnhanced>(
        'marketplace_products',
        where('expertId', '==', expertId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      )
    ])

    // Combine and deduplicate
    const productMap = new Map<string, MarketplaceProductEnhanced>()
    refProducts.forEach(p => productMap.set(p.id, p))
    stringProducts.forEach(p => {
      if (!productMap.has(p.id)) {
        productMap.set(p.id, p)
      }
    })

    return Array.from(productMap.values())
  }

  // Transaction methods
  static async createTransaction(data: Omit<MarketplaceTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const enhancedData: any = {
      ...data,
      status: 'pending'
    }

    // Add references alongside string IDs
    if (data.buyerId) {
      enhancedData.buyerRef = doc(this.db, 'users', data.buyerId)
    }
    if (data.sellerId) {
      enhancedData.sellerRef = doc(this.db, 'marketplace_experts', data.sellerId)
    }
    if (data.productId) {
      enhancedData.productRef = doc(this.db, 'marketplace_products', data.productId)
    }

    const docRef = await createDocument('marketplace_transactions', enhancedData)
    return docRef.id
  }

  // Review methods
  static async createReview(data: Omit<MarketplaceReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const enhancedData: any = { ...data }

    // Add references
    if (data.buyerId) {
      enhancedData.buyerRef = doc(this.db, 'users', data.buyerId)
    }
    if (data.productId) {
      enhancedData.productRef = doc(this.db, 'marketplace_products', data.productId)
    }
    if (data.sellerId) {
      enhancedData.sellerRef = doc(this.db, 'marketplace_experts', data.sellerId)
    }

    const docRef = await createDocument('marketplace_reviews', enhancedData)

    // Update product rating (using batch for atomicity)
    const batch = writeBatch(this.db)
    const productRef = doc(this.db, 'marketplace_products', data.productId)
    const product = await this.getProduct(data.productId)
    
    if (product) {
      const newReviewCount = (product.reviewCount || 0) + 1
      const newRating = ((product.rating || 0) * (product.reviewCount || 0) + data.rating) / newReviewCount
      
      batch.update(productRef, {
        rating: newRating,
        reviewCount: newReviewCount,
        updatedAt: serverTimestamp()
      })
      
      await batch.commit()
    }

    return docRef.id
  }

  // Application methods
  static async createApplication(data: Omit<MarketplaceApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const enhancedData: any = {
      ...data,
      status: 'pending'
    }

    // Add user reference
    if (data.userId) {
      enhancedData.userRef = doc(this.db, 'users', data.userId)
    }

    const docRef = await createDocument('marketplace_applications', enhancedData)
    return docRef.id
  }

  static async approveApplication(applicationId: string, reviewerId: string): Promise<void> {
    const reviewerRef = doc(this.db, 'users', reviewerId)
    
    await updateDocument('marketplace_applications', applicationId, {
      status: 'approved',
      reviewedBy: reviewerId,
      reviewedByRef: reviewerRef,
      reviewedAt: serverTimestamp()
    })
  }

  // Helper to update products with references for existing data
  static async updateProductWithReference(productId: string, expertId: string): Promise<void> {
    const expertRef = doc(this.db, 'marketplace_experts', expertId)
    
    await updateDocument('marketplace_products', productId, {
      expertRef: expertRef
    })
  }

  // Helper to update experts with user references
  static async updateExpertWithReference(expertId: string, userId: string): Promise<void> {
    const userRef = doc(this.db, 'users', userId)
    
    await updateDocument('marketplace_experts', expertId, {
      userRef: userRef
    })
  }
}