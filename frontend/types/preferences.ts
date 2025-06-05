// Travel preferences stored separately from user profile for privacy
export interface TravelPreferences {
  id: string
  userId: string // Reference to user, but stored separately
  
  // Travel style preferences
  travelStyle: TravelStyle[]
  pacePreference: 'relaxed' | 'moderate' | 'packed'
  
  // Accommodation preferences
  accommodationTypes: AccommodationType[]
  accommodationAmenities: string[]
  roomPreferences: RoomPreference[]
  
  // Activity preferences
  activityTypes: ActivityType[]
  interests: Interest[]
  fitnessLevel: 'low' | 'moderate' | 'high' | 'very-high'
  
  // Food preferences
  dietaryRestrictions: DietaryRestriction[]
  cuisinePreferences: string[]
  diningStyle: DiningStyle[]
  
  // Budget preferences (private by default)
  budgetRange: {
    min: number
    max: number
    currency: string
    isPrivate: boolean // Default true
  }
  spendingPriorities: SpendingPriority[]
  
  // Travel logistics
  transportPreferences: TransportType[]
  mobilityNeeds: string[]
  
  // General preferences
  languages: string[]
  travelCompanions: 'solo' | 'couple' | 'family' | 'friends' | 'mixed'
  childrenAges?: number[] // Only if traveling with children
  
  // Privacy settings
  shareWithGroups: boolean // Allow sharing basic prefs in group travel
  anonymousGroupSharing: boolean // Share without revealing identity
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  lastUsedAt?: Date
}

// Enums for preference options
export type TravelStyle = 
  | 'adventure'
  | 'cultural'
  | 'relaxation'
  | 'luxury'
  | 'budget'
  | 'eco-friendly'
  | 'family-friendly'
  | 'romantic'
  | 'business'
  | 'backpacking'
  | 'photography'
  | 'foodie'

export type AccommodationType =
  | 'hotel'
  | 'hostel'
  | 'airbnb'
  | 'resort'
  | 'boutique'
  | 'camping'
  | 'homestay'
  | 'villa'

export type RoomPreference =
  | 'single'
  | 'double'
  | 'twin'
  | 'suite'
  | 'shared'
  | 'private-bathroom'
  | 'kitchen'
  | 'balcony'
  | 'ground-floor'

export type ActivityType =
  | 'sightseeing'
  | 'museums'
  | 'outdoor'
  | 'adventure-sports'
  | 'water-sports'
  | 'nightlife'
  | 'shopping'
  | 'wellness'
  | 'festivals'
  | 'wildlife'
  | 'historical'
  | 'arts'

export type Interest =
  | 'history'
  | 'art'
  | 'architecture'
  | 'nature'
  | 'food'
  | 'music'
  | 'sports'
  | 'technology'
  | 'spirituality'
  | 'photography'
  | 'local-culture'
  | 'crafts'

export type DietaryRestriction =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'halal'
  | 'kosher'
  | 'dairy-free'
  | 'nut-allergy'
  | 'seafood-allergy'
  | 'low-sodium'
  | 'diabetic'

export type DiningStyle =
  | 'street-food'
  | 'local-cuisine'
  | 'fine-dining'
  | 'casual'
  | 'cafes'
  | 'food-markets'
  | 'familiar-chains'

export type SpendingPriority =
  | 'accommodation'
  | 'food'
  | 'activities'
  | 'shopping'
  | 'transportation'
  | 'experiences'

export type TransportType =
  | 'walking'
  | 'public-transport'
  | 'taxi'
  | 'rental-car'
  | 'bicycle'
  | 'train'
  | 'domestic-flights'

// Subset of preferences safe to share in groups
export interface ShareablePreferences {
  travelStyle: TravelStyle[]
  pacePreference: 'relaxed' | 'moderate' | 'packed'
  activityTypes: ActivityType[]
  interests: Interest[]
  dietaryRestrictions: DietaryRestriction[]
  fitnessLevel: 'low' | 'moderate' | 'high' | 'very-high'
  mobilityNeeds: string[]
  // Budget is only shared as ranges if explicitly allowed
  budgetRange?: {
    category: 'budget' | 'mid-range' | 'luxury'
  }
}

// Function to extract shareable preferences
export function getShareablePreferences(
  prefs: TravelPreferences,
  includebudget = false
): ShareablePreferences {
  const shareable: ShareablePreferences = {
    travelStyle: prefs.travelStyle,
    pacePreference: prefs.pacePreference,
    activityTypes: prefs.activityTypes,
    interests: prefs.interests,
    dietaryRestrictions: prefs.dietaryRestrictions,
    fitnessLevel: prefs.fitnessLevel,
    mobilityNeeds: prefs.mobilityNeeds,
  }

  if (includebudget && prefs.shareWithGroups && !prefs.budgetRange.isPrivate) {
    // Convert to category instead of exact amounts
    const avgBudget = (prefs.budgetRange.min + prefs.budgetRange.max) / 2
    let category: 'budget' | 'mid-range' | 'luxury' = 'mid-range'
    
    if (avgBudget < 1000) category = 'budget'
    else if (avgBudget > 5000) category = 'luxury'
    
    shareable.budgetRange = { category }
  }

  return shareable
}