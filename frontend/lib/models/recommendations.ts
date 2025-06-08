import { db } from '@/lib/firebase'
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
  GeoPoint,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore'

// Place Recommendation model
export interface PlaceRecommendation {
  id: string;
  googlePlaceId: string;
  name: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    city?: string;
    country?: string;
  };
  type: string; // restaurant, activity, hotel, etc.
  recommendedBy: {
    type: 'expert' | 'novatrek' | 'community';
    id: string; // expertId or 'novatrek' or userId
    name: string;
    profileUrl?: string;
  };
  reason?: string; // Why this place is recommended
  description?: string; // Detailed description
  tags: string[]; // e.g., ['romantic', 'budget-friendly', 'family', 'local-favorite']
  seasons?: string[]; // Best seasons to visit
  priceLevel?: number; // 1-4 scale
  rating?: number;
  images?: {
    url: string;
    caption?: string;
  }[];
  tips?: string[]; // Expert tips for visiting
  highlights?: string[]; // Key features or must-try items
  openingHours?: string[];
  phone?: string;
  website?: string;
  bookingUrl?: string;
  stats: {
    saveCount: number;
    viewCount: number;
    usedInTrips: number;
  };
  status: 'active' | 'inactive' | 'pending';
  featured: boolean; // For homepage/prominent display
  createdAt: Date;
  updatedAt: Date;
}

// Expert's saved places collection
export interface ExpertSavedPlace {
  id: string;
  expertId: string;
  googlePlaceId: string;
  name: string;
  location: {
    address: string;
    coordinates: GeoPoint;
    city?: string;
    country?: string;
  };
  type: string;
  tags: string[];
  personalNotes?: string; // Private notes from expert
  publicReason?: string; // Public recommendation reason
  addedAt: Date;
  isPublic: boolean; // Whether to show in recommendations
}

// User's saved recommendations
export interface UserSavedRecommendation {
  id: string;
  userId: string;
  recommendationId: string;
  savedAt: Date;
  usedInTrips?: string[]; // Trip IDs where this was used
  personalNotes?: string;
}

// Collection References
const COLLECTIONS = {
  RECOMMENDATIONS: 'place_recommendations',
  EXPERT_SAVED_PLACES: 'expert_saved_places',
  USER_SAVED_RECOMMENDATIONS: 'user_saved_recommendations'
} as const

export class RecommendationModel {
  // Create a new recommendation
  static async createRecommendation(
    data: Omit<PlaceRecommendation, 'id' | 'createdAt' | 'updatedAt' | 'stats'>
  ): Promise<PlaceRecommendation> {
    const docRef = doc(collection(db, COLLECTIONS.RECOMMENDATIONS))
    const recommendation = {
      ...data,
      id: docRef.id,
      stats: {
        saveCount: 0,
        viewCount: 0,
        usedInTrips: 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    await setDoc(docRef, recommendation)
    return { 
      ...recommendation, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    }
  }

  // Get recommendations by city
  static async getRecommendationsByCity(
    city: string, 
    type?: string,
    limitCount = 20
  ): Promise<PlaceRecommendation[]> {
    const constraints: any[] = [
      where('location.city', '==', city),
      where('status', '==', 'active')
    ]
    
    if (type) {
      constraints.push(where('type', '==', type))
    }
    
    // Featured recommendations first, then by save count
    constraints.push(orderBy('featured', 'desc'))
    constraints.push(orderBy('stats.saveCount', 'desc'))
    constraints.push(limit(limitCount))
    
    const q = query(collection(db, COLLECTIONS.RECOMMENDATIONS), ...constraints)
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as PlaceRecommendation
    })
  }

  // Get recommendations by expert
  static async getRecommendationsByExpert(
    expertId: string,
    limitCount = 20
  ): Promise<PlaceRecommendation[]> {
    const q = query(
      collection(db, COLLECTIONS.RECOMMENDATIONS),
      where('recommendedBy.id', '==', expertId),
      where('recommendedBy.type', '==', 'expert'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as PlaceRecommendation
    })
  }

  // Get NovaTrek's official recommendations
  static async getNovaTrekRecommendations(
    city?: string,
    type?: string,
    limitCount = 20
  ): Promise<PlaceRecommendation[]> {
    const constraints: any[] = [
      where('recommendedBy.type', '==', 'novatrek'),
      where('status', '==', 'active')
    ]
    
    if (city) {
      constraints.push(where('location.city', '==', city))
    }
    
    if (type) {
      constraints.push(where('type', '==', type))
    }
    
    constraints.push(orderBy('featured', 'desc'))
    constraints.push(orderBy('stats.saveCount', 'desc'))
    constraints.push(limit(limitCount))
    
    const q = query(collection(db, COLLECTIONS.RECOMMENDATIONS), ...constraints)
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as PlaceRecommendation
    })
  }

  // Search recommendations by location bounds
  static async getRecommendationsByBounds(
    northEast: { lat: number; lng: number },
    southWest: { lat: number; lng: number },
    type?: string
  ): Promise<PlaceRecommendation[]> {
    // Note: Firestore doesn't support geographic queries natively
    // This would need to be implemented with geohashing or a different approach
    // For now, return empty array with a comment about implementation
    console.warn('Geographic bounds search not implemented. Consider using city-based search.')
    return []
  }

  // Update recommendation stats
  static async incrementRecommendationStat(
    recommendationId: string,
    stat: 'saveCount' | 'viewCount' | 'usedInTrips'
  ): Promise<void> {
    const docRef = doc(db, COLLECTIONS.RECOMMENDATIONS, recommendationId)
    await updateDoc(docRef, {
      [`stats.${stat}`]: increment(1),
      updatedAt: serverTimestamp()
    })
  }

  // Expert saved places methods
  static async saveExpertPlace(
    expertId: string,
    place: Omit<ExpertSavedPlace, 'id' | 'expertId' | 'addedAt'>
  ): Promise<ExpertSavedPlace> {
    const docRef = doc(collection(db, COLLECTIONS.EXPERT_SAVED_PLACES))
    const savedPlace = {
      ...place,
      id: docRef.id,
      expertId,
      location: {
        ...place.location,
        coordinates: new GeoPoint(
          place.location.coordinates.lat,
          place.location.coordinates.lng
        )
      },
      addedAt: serverTimestamp()
    }
    await setDoc(docRef, savedPlace)
    return {
      ...savedPlace,
      location: {
        ...savedPlace.location,
        coordinates: {
          lat: place.location.coordinates.lat,
          lng: place.location.coordinates.lng
        }
      },
      addedAt: new Date()
    }
  }

  static async getExpertSavedPlaces(
    expertId: string,
    isPublic?: boolean
  ): Promise<ExpertSavedPlace[]> {
    const constraints: any[] = [
      where('expertId', '==', expertId)
    ]
    
    if (isPublic !== undefined) {
      constraints.push(where('isPublic', '==', isPublic))
    }
    
    constraints.push(orderBy('addedAt', 'desc'))
    
    const q = query(collection(db, COLLECTIONS.EXPERT_SAVED_PLACES), ...constraints)
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      const geoPoint = data.location.coordinates as GeoPoint
      return {
        ...data,
        id: doc.id,
        location: {
          ...data.location,
          coordinates: {
            lat: geoPoint.latitude,
            lng: geoPoint.longitude
          }
        },
        addedAt: data.addedAt?.toDate() || new Date()
      } as ExpertSavedPlace
    })
  }

  // User saved recommendations
  static async saveRecommendationForUser(
    userId: string,
    recommendationId: string,
    notes?: string
  ): Promise<UserSavedRecommendation> {
    const docRef = doc(
      db, 
      COLLECTIONS.USER_SAVED_RECOMMENDATIONS, 
      `${userId}_${recommendationId}`
    )
    
    const saved = {
      id: docRef.id,
      userId,
      recommendationId,
      personalNotes: notes,
      savedAt: serverTimestamp()
    }
    
    await setDoc(docRef, saved)
    
    // Increment save count on the recommendation
    await this.incrementRecommendationStat(recommendationId, 'saveCount')
    
    return { ...saved, savedAt: new Date() }
  }

  static async getUserSavedRecommendations(
    userId: string
  ): Promise<UserSavedRecommendation[]> {
    const q = query(
      collection(db, COLLECTIONS.USER_SAVED_RECOMMENDATIONS),
      where('userId', '==', userId),
      orderBy('savedAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        savedAt: data.savedAt?.toDate() || new Date()
      } as UserSavedRecommendation
    })
  }

  // Add recommendation to trip
  static async addRecommendationToTrip(
    userId: string,
    recommendationId: string,
    tripId: string
  ): Promise<void> {
    const docRef = doc(
      db, 
      COLLECTIONS.USER_SAVED_RECOMMENDATIONS, 
      `${userId}_${recommendationId}`
    )
    
    await updateDoc(docRef, {
      usedInTrips: arrayUnion(tripId)
    })
    
    // Increment used in trips count
    await this.incrementRecommendationStat(recommendationId, 'usedInTrips')
  }

  // Convert expert saved place to public recommendation
  static async publishExpertPlace(
    expertId: string,
    savedPlaceId: string,
    additionalData: {
      reason: string;
      description?: string;
      tags?: string[];
      tips?: string[];
      highlights?: string[];
    }
  ): Promise<PlaceRecommendation> {
    // Get the saved place
    const savedPlaceDoc = await getDoc(
      doc(db, COLLECTIONS.EXPERT_SAVED_PLACES, savedPlaceId)
    )
    
    if (!savedPlaceDoc.exists()) {
      throw new Error('Saved place not found')
    }
    
    const savedPlace = savedPlaceDoc.data() as ExpertSavedPlace
    
    if (savedPlace.expertId !== expertId) {
      throw new Error('Unauthorized')
    }
    
    // Get expert info
    const { MarketplaceModel } = await import('./marketplace')
    const expert = await MarketplaceModel.getExpertByUserId(expertId)
    
    if (!expert) {
      throw new Error('Expert profile not found')
    }
    
    // Create recommendation
    const geoPoint = savedPlace.location.coordinates as GeoPoint
    const recommendation = await this.createRecommendation({
      googlePlaceId: savedPlace.googlePlaceId,
      name: savedPlace.name,
      location: {
        ...savedPlace.location,
        coordinates: {
          lat: geoPoint.latitude,
          lng: geoPoint.longitude
        }
      },
      type: savedPlace.type,
      recommendedBy: {
        type: 'expert',
        id: expert.id,
        name: expert.businessName,
        profileUrl: `/experts/${expert.slug}`
      },
      reason: additionalData.reason,
      description: additionalData.description,
      tags: [...savedPlace.tags, ...(additionalData.tags || [])],
      tips: additionalData.tips,
      highlights: additionalData.highlights,
      status: 'active',
      featured: false
    })
    
    // Update saved place to mark as public
    await updateDoc(doc(db, COLLECTIONS.EXPERT_SAVED_PLACES, savedPlaceId), {
      isPublic: true,
      publicReason: additionalData.reason
    })
    
    return recommendation
  }
}