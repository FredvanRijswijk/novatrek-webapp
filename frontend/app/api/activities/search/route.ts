import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, getAdminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token
    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    const searchParams = request.nextUrl.searchParams;
    const queryText = searchParams.get('query') || '';
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = parseInt(searchParams.get('radius') || '5000');
    const types = searchParams.get('types')?.split(',') || [];
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const priceLevel = searchParams.get('priceLevel')?.split(',').map(Number) || [];
    const userPreferences = searchParams.get('userPreferences') 
      ? JSON.parse(searchParams.get('userPreferences')!) 
      : null;

    // Search from multiple sources in parallel
    const [googleResults, expertRecommendations, novatrekActivities] = await Promise.all([
      searchGooglePlaces({
        query: queryText,
        location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined,
        radius,
        types,
        minRating
      }),
      searchExpertRecommendations({
        query: queryText,
        location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined,
        types,
        radius
      }),
      searchNovatrekActivities({
        query: queryText,
        types,
        userPreferences
      })
    ]);

    // Merge and rank results
    const mergedResults = mergeAndRankResults(
      googleResults,
      expertRecommendations,
      novatrekActivities,
      userPreferences
    );

    // Apply additional filters
    const filteredResults = mergedResults.filter(result => {
      if (minRating && result.rating < minRating) return false;
      if (priceLevel.length && result.priceLevel && !priceLevel.includes(result.priceLevel)) return false;
      return true;
    });

    return NextResponse.json({
      results: filteredResults.slice(0, 20), // Top 20 results
      total: filteredResults.length,
      sources: {
        google: googleResults.length,
        experts: expertRecommendations.length,
        novatrek: novatrekActivities.length
      }
    });

  } catch (error) {
    console.error('Activity search error:', error);
    return NextResponse.json(
      { error: 'Failed to search activities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    const userId = authHeader?.startsWith('Bearer ') ? 
      await verifyIdToken(authHeader.split('Bearer ')[1]).then(token => token?.uid) : 
      null;

    // Parse request body
    const body = await request.json();
    const {
      location,
      activityType,
      searchQuery,
      budget,
      date,
      timeOfDay,
      preferIndoorActivities,
      preferOutdoorActivities,
      familyFriendly
    } = body;

    if (!location || !location.lat || !location.lng) {
      return NextResponse.json({ error: 'Location coordinates required' }, { status: 400 });
    }

    // Map activity type to Google Places types
    const typesMap: Record<string, string[]> = {
      'sightseeing': ['tourist_attraction', 'museum', 'art_gallery', 'point_of_interest'],
      'dining': ['restaurant', 'cafe', 'bar'],
      'accommodation': ['lodging', 'hotel'],
      'shopping': ['shopping_mall', 'store'],
      'entertainment': ['movie_theater', 'night_club', 'casino', 'amusement_park'],
      'activity': ['park', 'zoo', 'aquarium', 'stadium']
    };

    const types = activityType ? typesMap[activityType] || [] : [];

    // Search activities
    const [googleResults, expertRecommendations, novatrekActivities] = await Promise.all([
      searchGooglePlaces({
        query: searchQuery || activityType || '',
        location,
        radius: 5000,
        types,
        minRating: 3.5
      }),
      searchExpertRecommendations({
        query: searchQuery || activityType || '',
        location,
        types,
        radius: 5000
      }),
      searchNovatrekActivities({
        query: searchQuery || activityType || '',
        types
      })
    ]);

    // Combine and filter results
    let activities = [...expertRecommendations, ...novatrekActivities, ...googleResults];

    // Apply filters
    if (preferIndoorActivities) {
      activities = activities.filter(a => 
        a.types?.some((t: string) => ['museum', 'art_gallery', 'shopping_mall', 'movie_theater'].includes(t))
      );
    } else if (preferOutdoorActivities) {
      activities = activities.filter(a => 
        a.types?.some((t: string) => ['park', 'zoo', 'tourist_attraction', 'stadium'].includes(t))
      );
    }

    if (familyFriendly) {
      activities = activities.filter(a => 
        !a.types?.some((t: string) => ['bar', 'night_club', 'casino'].includes(t))
      );
    }

    // Sort by relevance (expert recommendations first, then by rating)
    activities.sort((a, b) => {
      if (a.expertRecommended && !b.expertRecommended) return -1;
      if (!a.expertRecommended && b.expertRecommended) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });

    return NextResponse.json({
      activities: activities.slice(0, 50),
      hasRecommendations: activities.some(a => a.expertRecommended),
      weather: null // Weather service not implemented yet
    });

  } catch (error) {
    console.error('Activity search POST error:', error);
    return NextResponse.json(
      { error: 'Failed to search activities' },
      { status: 500 }
    );
  }
}

function mapGoogleTypesToActivityType(types: string[]): string {
  if (!types || types.length === 0) return 'activity';
  
  // Check for dining types first (most specific)
  const diningTypes = ['restaurant', 'cafe', 'bar', 'food', 'meal_delivery', 'meal_takeaway', 'bakery'];
  if (types.some(t => diningTypes.includes(t))) return 'dining';
  
  // Check for accommodation
  const accommodationTypes = ['lodging', 'hotel', 'motel', 'resort', 'hostel'];
  if (types.some(t => accommodationTypes.includes(t))) return 'accommodation';
  
  // Check for sightseeing
  const sightseeingTypes = ['tourist_attraction', 'museum', 'art_gallery', 'church', 'city_hall', 'library', 'monument', 'park', 'zoo', 'aquarium'];
  if (types.some(t => sightseeingTypes.includes(t))) return 'sightseeing';
  
  // Check for shopping
  const shoppingTypes = ['shopping_mall', 'store', 'clothing_store', 'department_store', 'supermarket'];
  if (types.some(t => shoppingTypes.includes(t))) return 'shopping';
  
  // Check for entertainment
  const entertainmentTypes = ['movie_theater', 'night_club', 'casino', 'amusement_park', 'bowling_alley', 'stadium'];
  if (types.some(t => entertainmentTypes.includes(t))) return 'entertainment';
  
  // Check for transport
  const transportTypes = ['airport', 'train_station', 'bus_station', 'subway_station', 'transit_station'];
  if (types.some(t => transportTypes.includes(t))) return 'transport';
  
  // Default to activity
  return 'activity';
}

async function searchGooglePlaces(params: any) {
  try {
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
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${searchParams}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Debug log first result's photo data
    if (data.results?.[0]?.photos) {
      console.log('Google Places photo data:', JSON.stringify(data.results[0].photos[0], null, 2));
    }
    
    return data.results?.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      description: place.editorial_summary?.text,
      type: mapGoogleTypesToActivityType(place.types),
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        address: place.formatted_address
      },
      rating: place.rating,
      reviews: place.user_ratings_total,
      priceLevel: place.price_level,
      photos: place.photos?.slice(0, 3).map((p: any) => ({
        reference: p.photo_reference,
        width: p.width,
        height: p.height
      })),
      types: place.types,
      openingHours: place.opening_hours?.weekday_text || [],
      isOpenNow: place.opening_hours?.open_now,
      source: 'google'
    })) || [];
  } catch (error) {
    console.error('Google Places search error:', error);
    return [];
  }
}

async function searchExpertRecommendations(params: any) {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      console.log('Admin DB not initialized for expert recommendations');
      return [];
    }

    // Query expert recommendations from Firestore
    const recommendationsQuery = adminDb
      .collection('expertRecommendations')
      .where('status', '==', 'published');
    
    // Note: Firestore doesn't support combining array-contains-any with other queries efficiently
    // In production, you'd use a more sophisticated indexing strategy
    
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
      if (params.query && !data.name.toLowerCase().includes(params.query.toLowerCase()) &&
          !data.description?.toLowerCase().includes(params.query.toLowerCase())) {
        return;
      }
      
      recommendations.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        type: mapGoogleTypesToActivityType(data.categories || []),
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

async function searchNovatrekActivities(params: any) {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      console.log('Admin DB not initialized for NovaTrek activities');
      return [];
    }

    // Search saved activities from the NovaTrek database
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
        type: mapGoogleTypesToActivityType(data.types || []),
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

function mergeAndRankResults(
  googleResults: any[],
  expertResults: any[],
  novatrekResults: any[],
  userPreferences: any
) {
  const merged = new Map();
  
  // Start with expert recommendations (highest priority)
  expertResults.forEach(item => {
    merged.set(item.id, {
      ...item,
      score: 100, // Base expert score
      sources: ['expert']
    });
  });
  
  // Add Google results
  googleResults.forEach(item => {
    const existing = merged.get(item.id);
    if (existing) {
      // Enhance existing expert recommendation with Google data
      merged.set(item.id, {
        ...existing,
        ...item,
        expertRecommended: existing.expertRecommended,
        expertReviews: existing.expertReviews,
        score: existing.score + 20, // Boost for being in both
        sources: [...existing.sources, 'google']
      });
    } else {
      merged.set(item.id, {
        ...item,
        score: calculateGoogleScore(item),
        sources: ['google']
      });
    }
  });
  
  // Add NovaTrek results
  novatrekResults.forEach(item => {
    const existing = merged.get(item.id);
    if (existing) {
      merged.set(item.id, {
        ...existing,
        popularityScore: item.popularityScore,
        userSaves: item.userSaves,
        score: existing.score + (item.popularityScore || 0) * 10,
        sources: [...existing.sources, 'novatrek']
      });
    } else {
      merged.set(item.id, {
        ...item,
        score: 50 + (item.popularityScore || 0) * 10,
        sources: ['novatrek']
      });
    }
  });
  
  // Apply user preference scoring
  if (userPreferences) {
    for (const [id, item] of merged.entries()) {
      const preferenceScore = calculatePreferenceScore(item, userPreferences);
      merged.set(id, {
        ...item,
        score: item.score + preferenceScore,
        preferenceMatch: preferenceScore > 0
      });
    }
  }
  
  // Convert to array and sort by score
  return Array.from(merged.values())
    .sort((a, b) => b.score - a.score);
}

function calculateGoogleScore(item: any): number {
  let score = 50; // Base Google score
  
  if (item.rating) {
    score += item.rating * 5; // Up to 25 points
  }
  
  if (item.reviews > 100) {
    score += Math.min(10, item.reviews / 50); // Up to 10 points for popularity
  }
  
  return score;
}

function calculatePreferenceScore(item: any, preferences: any): number {
  let score = 0;
  
  // Match activity types
  if (preferences.activityTypes && item.types) {
    const matches = item.types.filter((t: string) => 
      preferences.activityTypes.some((pref: string) => 
        t.toLowerCase().includes(pref.toLowerCase())
      )
    );
    score += matches.length * 5;
  }
  
  // Match interests
  if (preferences.interests && (item.name || item.description)) {
    const text = `${item.name} ${item.description || ''}`.toLowerCase();
    preferences.interests.forEach((interest: string) => {
      if (text.includes(interest.toLowerCase())) {
        score += 10;
      }
    });
  }
  
  // Accessibility match
  if (preferences.accessibility?.includes('wheelchair') && 
      item.types?.includes('wheelchair_accessible')) {
    score += 15;
  }
  
  return score;
}