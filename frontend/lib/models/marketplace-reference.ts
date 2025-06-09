import { 
  DocumentReference, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  runTransaction,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface MarketplaceExpertRef {
  id: string
  userId: string
  businessName: string
  description: string
  logoUrl?: string
  stripeAccountId?: string
  stripeAccountStatus?: 'pending' | 'active' | 'restricted'
  isApproved: boolean
  specialties: string[]
  location?: {
    city?: string
    country?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface MarketplaceProductRef {
  id: string
  title: string
  description: string
  price: number
  expertId: string // Keep for backward compatibility
  expertRef: DocumentReference<MarketplaceExpertRef> // New reference field
  images: string[]
  category: string
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export class MarketplaceReferenceModel {
  private static db = db

  // Expert methods
  static async createExpert(expertData: Omit<MarketplaceExpertRef, 'id' | 'createdAt' | 'updatedAt'>) {
    const expertRef = doc(collection(this.db, 'marketplace_experts'))
    const expert: MarketplaceExpertRef = {
      ...expertData,
      id: expertRef.id,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    }
    await setDoc(expertRef, expert)
    return expert
  }

  static async getExpert(expertId: string): Promise<MarketplaceExpertRef | null> {
    const expertRef = doc(this.db, 'marketplace_experts', expertId)
    const snapshot = await getDoc(expertRef)
    return snapshot.exists() ? snapshot.data() as MarketplaceExpertRef : null
  }

  // Product methods with reference fields
  static async createProductWithReference(
    productData: Omit<MarketplaceProductRef, 'id' | 'expertRef' | 'createdAt' | 'updatedAt'>,
    expertId: string
  ) {
    // Create reference to expert document
    const expertRef = doc(this.db, 'marketplace_experts', expertId) as DocumentReference<MarketplaceExpertRef>
    
    // Verify expert exists
    const expertSnapshot = await getDoc(expertRef)
    if (!expertSnapshot.exists()) {
      throw new Error('Expert not found')
    }

    const productRef = doc(collection(this.db, 'marketplace_products'))
    const product: MarketplaceProductRef = {
      ...productData,
      id: productRef.id,
      expertRef: expertRef, // Store the reference
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    }
    
    await setDoc(productRef, product)
    return product
  }

  // Hybrid query - works with both old string IDs and new references
  static async getProductsByExpert(expertId: string): Promise<MarketplaceProductRef[]> {
    const expertRef = doc(this.db, 'marketplace_experts', expertId)
    
    // Query using both patterns for backward compatibility
    const [refQuery, stringQuery] = await Promise.all([
      getDocs(query(
        collection(this.db, 'marketplace_products'),
        where('expertRef', '==', expertRef),
        where('isActive', '==', true)
      )),
      getDocs(query(
        collection(this.db, 'marketplace_products'),
        where('expertId', '==', expertId),
        where('isActive', '==', true)
      ))
    ])

    // Combine results and deduplicate
    const productMap = new Map<string, MarketplaceProductRef>()
    
    refQuery.forEach(doc => {
      productMap.set(doc.id, doc.data() as MarketplaceProductRef)
    })
    
    stringQuery.forEach(doc => {
      if (!productMap.has(doc.id)) {
        productMap.set(doc.id, doc.data() as MarketplaceProductRef)
      }
    })

    return Array.from(productMap.values())
  }

  // Get product with populated expert data
  static async getProductWithExpert(productId: string) {
    const productRef = doc(this.db, 'marketplace_products', productId)
    const productSnapshot = await getDoc(productRef)
    
    if (!productSnapshot.exists()) {
      return null
    }

    const product = productSnapshot.data() as MarketplaceProductRef

    // If product has reference field, use it to get expert data
    if (product.expertRef) {
      const expertSnapshot = await getDoc(product.expertRef)
      const expert = expertSnapshot.exists() ? expertSnapshot.data() : null
      return { product, expert }
    }

    // Fallback to string ID for backward compatibility
    if (product.expertId) {
      const expert = await this.getExpert(product.expertId)
      return { product, expert }
    }

    return { product, expert: null }
  }

  // Migration utility: Convert string IDs to references
  static async migrateProductsToReferences(batchSize = 500) {
    const productsSnapshot = await getDocs(collection(this.db, 'marketplace_products'))
    const products = productsSnapshot.docs
    
    let migrated = 0
    let failed = 0

    // Process in batches
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = writeBatch(this.db)
      const batchProducts = products.slice(i, i + batchSize)

      for (const productDoc of batchProducts) {
        const product = productDoc.data()
        
        // Skip if already has reference
        if (product.expertRef) {
          continue
        }

        // Create reference from string ID
        if (product.expertId) {
          try {
            const expertRef = doc(this.db, 'marketplace_experts', product.expertId)
            
            // Verify expert exists
            const expertSnapshot = await getDoc(expertRef)
            if (expertSnapshot.exists()) {
              batch.update(productDoc.ref, {
                expertRef: expertRef,
                updatedAt: serverTimestamp()
              })
              migrated++
            } else {
              console.error(`Expert ${product.expertId} not found for product ${productDoc.id}`)
              failed++
            }
          } catch (error) {
            console.error(`Failed to migrate product ${productDoc.id}:`, error)
            failed++
          }
        }
      }

      await batch.commit()
    }

    return { migrated, failed, total: products.length }
  }

  // Atomic transaction example with references
  static async purchaseProductWithReference(
    productId: string,
    buyerId: string,
    paymentIntentId: string
  ) {
    return runTransaction(this.db, async (transaction) => {
      const productRef = doc(this.db, 'marketplace_products', productId)
      const productSnapshot = await transaction.get(productRef)
      
      if (!productSnapshot.exists()) {
        throw new Error('Product not found')
      }

      const product = productSnapshot.data() as MarketplaceProductRef
      
      // Use reference to get expert data in same transaction
      if (product.expertRef) {
        const expertSnapshot = await transaction.get(product.expertRef)
        if (!expertSnapshot.exists()) {
          throw new Error('Expert not found')
        }
        
        const expert = expertSnapshot.data()
        
        // Create transaction record
        const transactionRef = doc(collection(this.db, 'marketplace_transactions'))
        transaction.set(transactionRef, {
          id: transactionRef.id,
          productId,
          productRef: productRef, // Reference to product
          expertRef: product.expertRef, // Reference to expert
          buyerId,
          buyerRef: doc(this.db, 'users', buyerId), // Reference to buyer
          amount: product.price,
          paymentIntentId,
          status: 'completed',
          createdAt: serverTimestamp()
        })

        // Update expert's total sales (if tracking)
        // This is atomic with the transaction
        if (expert.totalSales !== undefined) {
          transaction.update(product.expertRef, {
            totalSales: expert.totalSales + 1,
            updatedAt: serverTimestamp()
          })
        }

        return { product, expert, transactionId: transactionRef.id }
      }

      throw new Error('Product missing expert reference')
    })
  }
}