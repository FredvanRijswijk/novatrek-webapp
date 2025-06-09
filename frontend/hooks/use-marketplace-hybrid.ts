import { useState, useEffect } from 'react'
import { 
  DocumentReference, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  onSnapshot,
  QueryConstraint
} from 'firebase/firestore'
import { getFirestore } from '@/lib/firebase'
import { MarketplaceExpertRef, MarketplaceProductRef } from '@/lib/models/marketplace-reference'

interface UseProductsOptions {
  expertId?: string
  realtime?: boolean
  includeInactive?: boolean
}

// Hook that supports both old and new data patterns
export function useMarketplaceProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<MarketplaceProductRef[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const { expertId, realtime = false, includeInactive = false } = options
    const db = getFirestore()

    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        let productsData: MarketplaceProductRef[] = []

        if (expertId) {
          // Create expert reference for new query pattern
          const expertRef = doc(db, 'marketplace_experts', expertId)

          // Build query constraints
          const constraints: QueryConstraint[] = []
          if (!includeInactive) {
            constraints.push(where('isActive', '==', true))
          }

          // Execute both queries in parallel for backward compatibility
          const [refResults, stringResults] = await Promise.all([
            // Query using reference field (new pattern)
            getDocs(query(
              collection(db, 'marketplace_products'),
              where('expertRef', '==', expertRef),
              ...constraints
            )),
            // Query using string ID (old pattern)
            getDocs(query(
              collection(db, 'marketplace_products'),
              where('expertId', '==', expertId),
              ...constraints
            ))
          ])

          // Combine and deduplicate results
          const productMap = new Map<string, MarketplaceProductRef>()
          
          refResults.forEach(doc => {
            productMap.set(doc.id, { ...doc.data(), id: doc.id } as MarketplaceProductRef)
          })
          
          stringResults.forEach(doc => {
            if (!productMap.has(doc.id)) {
              productMap.set(doc.id, { ...doc.data(), id: doc.id } as MarketplaceProductRef)
            }
          })

          productsData = Array.from(productMap.values())
        } else {
          // Get all products
          const snapshot = await getDocs(collection(db, 'marketplace_products'))
          productsData = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          } as MarketplaceProductRef))
        }

        setProducts(productsData)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    // Set up realtime listener if requested
    if (realtime && expertId) {
      const expertRef = doc(db, 'marketplace_experts', expertId)
      const constraints: QueryConstraint[] = []
      if (!includeInactive) {
        constraints.push(where('isActive', '==', true))
      }

      // Listen to both patterns
      const unsubscribers: (() => void)[] = []

      // Reference-based listener
      const unsubRef = onSnapshot(
        query(
          collection(db, 'marketplace_products'),
          where('expertRef', '==', expertRef),
          ...constraints
        ),
        (snapshot) => {
          const refProducts = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          } as MarketplaceProductRef))
          
          setProducts(current => {
            // Merge with existing products from string-based query
            const productMap = new Map<string, MarketplaceProductRef>()
            current.forEach(p => productMap.set(p.id, p))
            refProducts.forEach(p => productMap.set(p.id, p))
            return Array.from(productMap.values())
          })
        },
        (err) => setError(err)
      )
      unsubscribers.push(unsubRef)

      // String-based listener (for backward compatibility)
      const unsubString = onSnapshot(
        query(
          collection(db, 'marketplace_products'),
          where('expertId', '==', expertId),
          ...constraints
        ),
        (snapshot) => {
          const stringProducts = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          } as MarketplaceProductRef))
          
          setProducts(current => {
            // Merge with existing products
            const productMap = new Map<string, MarketplaceProductRef>()
            current.forEach(p => productMap.set(p.id, p))
            stringProducts.forEach(p => productMap.set(p.id, p))
            return Array.from(productMap.values())
          })
        }
      )
      unsubscribers.push(unsubString)

      return () => {
        unsubscribers.forEach(unsub => unsub())
      }
    } else {
      fetchProducts()
    }
  }, [options.expertId, options.realtime, options.includeInactive])

  return { products, loading, error }
}

// Hook to get product with populated expert data
export function useProductWithExpert(productId: string | null) {
  const [data, setData] = useState<{
    product: MarketplaceProductRef | null
    expert: MarketplaceExpertRef | null
  }>({ product: null, expert: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!productId) {
      setData({ product: null, expert: null })
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const db = getFirestore()

        // Get product
        const productRef = doc(db, 'marketplace_products', productId)
        const productSnapshot = await getDoc(productRef)

        if (!productSnapshot.exists()) {
          throw new Error('Product not found')
        }

        const product = { 
          ...productSnapshot.data(), 
          id: productSnapshot.id 
        } as MarketplaceProductRef

        let expert: MarketplaceExpertRef | null = null

        // Try reference field first (new pattern)
        if (product.expertRef) {
          const expertSnapshot = await getDoc(product.expertRef)
          if (expertSnapshot.exists()) {
            expert = { 
              ...expertSnapshot.data(), 
              id: expertSnapshot.id 
            } as MarketplaceExpertRef
          }
        } 
        // Fallback to string ID (old pattern)
        else if (product.expertId) {
          const expertRef = doc(db, 'marketplace_experts', product.expertId)
          const expertSnapshot = await getDoc(expertRef)
          if (expertSnapshot.exists()) {
            expert = { 
              ...expertSnapshot.data(), 
              id: expertSnapshot.id 
            } as MarketplaceExpertRef
          }
        }

        setData({ product, expert })
      } catch (err) {
        console.error('Error fetching product with expert:', err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [productId])

  return { ...data, loading, error }
}

// Hook for advanced queries using collection groups
export function useExpertProductReviews(expertId: string | null) {
  const [reviews, setReviews] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    productCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!expertId) {
      setReviews([])
      setLoading(false)
      return
    }

    const fetchReviews = async () => {
      try {
        setLoading(true)
        const db = getFirestore()
        const expertRef = doc(db, 'marketplace_experts', expertId)

        // Get all products for this expert (hybrid approach)
        const [refProducts, stringProducts] = await Promise.all([
          getDocs(query(
            collection(db, 'marketplace_products'),
            where('expertRef', '==', expertRef)
          )),
          getDocs(query(
            collection(db, 'marketplace_products'),
            where('expertId', '==', expertId)
          ))
        ])

        // Deduplicate products
        const productIds = new Set<string>()
        refProducts.forEach(doc => productIds.add(doc.id))
        stringProducts.forEach(doc => productIds.add(doc.id))

        // Get reviews for all products
        const reviewPromises = Array.from(productIds).map(productId =>
          getDocs(query(
            collection(db, 'marketplace_reviews'),
            where('productId', '==', productId)
          ))
        )

        const reviewSnapshots = await Promise.all(reviewPromises)
        const allReviews: any[] = []

        reviewSnapshots.forEach(snapshot => {
          snapshot.forEach(doc => {
            allReviews.push({ ...doc.data(), id: doc.id })
          })
        })

        // Calculate stats
        const totalRating = allReviews.reduce((sum, review) => sum + (review.rating || 0), 0)
        const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0

        setReviews(allReviews)
        setStats({
          totalReviews: allReviews.length,
          averageRating: Math.round(averageRating * 10) / 10,
          productCount: productIds.size
        })
      } catch (error) {
        console.error('Error fetching expert reviews:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [expertId])

  return { reviews, stats, loading }
}