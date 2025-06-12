// Helper functions for search tools to access data directly
import { getAdminDb } from '@/lib/firebase/admin';

export async function searchGooglePlacesDirectly(params: {
  query: string;
  location?: { lat: number; lng: number };
  radius: number;
  types?: string[];
  minRating?: number;
  priceLevel?: number[];
  openNow?: boolean;
}) {
  const searchParams = new URLSearchParams();
  
  if (params.query) searchParams.append('query', params.query);
  if (params.location) {
    searchParams.append('location', `${params.location.lat},${params.location.lng}`);
  }
  searchParams.append('radius', params.radius.toString());
  if (params.types?.length) {
    searchParams.append('type', params.types.join('|'));
  }
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY is not set');
    return [];
  }
  
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${searchParams}&key=${apiKey}`;
  
  console.log('Google Places search URL:', url.replace(apiKey, 'REDACTED'));
  
  const response = await fetch(url);
  const data = await response.json();
  
  console.log('Google Places response:', {
    status: data.status,
    results_count: data.results?.length || 0,
    error_message: data.error_message
  });
  
  return data.results?.map((place: any) => {
    // Skip places without required data
    if (!place.geometry?.location || !place.name) {
      console.warn('Skipping place without geometry/name:', place.place_id);
      return null;
    }
    
    return {
      id: place.place_id,
      name: place.name,
      description: place.editorial_summary?.text,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        address: place.formatted_address || place.vicinity || ''
      },
      rating: place.rating,
      reviews: place.user_ratings_total,
      priceLevel: place.price_level,
      photos: place.photos?.slice(0, 3).map((p: any) => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photo_reference}&key=${apiKey}`
      ),
      types: place.types || [],
      openingHours: place.opening_hours,
      source: 'google'
    };
  }).filter(Boolean) || [];
}

export async function searchExpertRecommendationsDirectly(params: {
  type: string;
  location?: { lat: number; lng: number };
  types?: string[];
  radius: number;
}) {
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error('Admin DB not initialized');
    return [];
  }

  try {
    const recommendationsQuery = adminDb
      .collection('expertRecommendations')
      .where('status', '==', 'published');
    
    const snapshot = await recommendationsQuery.get();
    const recommendations: any[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Filter by types if provided
      if (params.types?.length && data.categories) {
        const hasMatchingType = params.types.some((type: string) => 
          data.categories.includes(type)
        );
        if (!hasMatchingType) return;
      }
      
      // Basic text matching if query provided
      if (params.type && !data.type?.includes(params.type)) {
        return;
      }
      
      recommendations.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        location: data.location,
        rating: data.expertRating || 5,
        expertRating: data.expertRating,
        expertReviews: [{
          expertId: data.expertId,
          expertName: data.expertName,
          rating: data.expertRating,
          review: data.review,
          verified: true
        }],
        photos: data.photos,
        types: data.categories,
        priceLevel: data.priceLevel,
        bookingUrl: data.bookingUrl,
        expertRecommended: true,
        expertTips: data.tips,
        bestTime: data.bestTime,
        duration: data.duration,
        source: 'expert'
      });
    });
    
    return recommendations;
  } catch (error) {
    console.error('Expert recommendations search error:', error);
    return [];
  }
}

export async function searchNovatrekActivitiesDirectly(params: {
  query?: string;
  types?: string[];
}) {
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error('Admin DB not initialized');
    return [];
  }

  try {
    const snapshot = await adminDb
      .collection('activities')
      .where('featured', '==', true)
      .orderBy('popularityScore', 'desc')
      .limit(10)
      .get();
      
    const activities: any[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      if (params.query && !data.name.toLowerCase().includes(params.query.toLowerCase())) {
        return;
      }
      
      activities.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        location: data.location,
        rating: data.rating,
        reviews: data.reviewCount,
        photos: data.photos,
        types: data.types,
        popularityScore: data.popularityScore,
        userSaves: data.saveCount,
        source: 'novatrek'
      });
    });
    
    return activities;
  } catch (error) {
    console.error('NovaTrek activities search error:', error);
    return [];
  }
}