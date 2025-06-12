export interface User {
  id: string
  email: string
  displayName: string
  photoURL?: string
  preferences?: UserPreferences
  subscription?: UserSubscription
  stripeCustomerId?: string
  createdAt: Date
  updatedAt: Date
}

export interface UserSubscription {
  subscriptionId: string
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid'
  planId: string | null
  currentPeriodEnd: Date
  currentPeriodStart: Date
  cancelAtPeriodEnd: boolean
  canceledAt: Date | null
  trialEnd: Date | null
  updatedAt: Date
}

export interface UserPreferences {
  travelStyle: 'budget' | 'mid-range' | 'luxury'
  accommodationType: 'hotel' | 'airbnb' | 'hostel' | 'resort' | 'any'
  activityTypes: ActivityType[]
  dietaryRestrictions: string[]
  accessibility: AccessibilityNeeds
  languages: string[]
  currency: string
  timeZone: string
}

export interface AccessibilityNeeds {
  mobilityAssistance: boolean
  visualImpairment: boolean
  hearingImpairment: boolean
  other: string[]
}

export type ActivityType = 
  | 'adventure' 
  | 'cultural' 
  | 'food' 
  | 'nature' 
  | 'shopping' 
  | 'nightlife' 
  | 'relaxation' 
  | 'museums' 
  | 'sports'
  | 'photography'

export interface TripPhoto {
  id: string
  url: string
  path: string
  caption?: string
  uploadedBy: string
  uploadedAt: Date
  activityId?: string
  dayNumber?: number
  location?: {
    lat: number
    lng: number
    name?: string
  }
}

export interface Trip {
  id: string
  userId: string
  title: string
  description?: string
  // V2 fields only
  destinationName?: string
  destinationCoordinates?: { lat: number; lng: number }
  destinationId?: string
  startDate: Date
  endDate: Date
  budget?: Budget
  travelers: Traveler[]
  itinerary: DayItinerary[]
  expenses?: Expense[] // Manual expenses not tied to activities
  status: 'planning' | 'booked' | 'active' | 'completed' | 'cancelled'
  aiRecommendations?: AIRecommendation[]
  weatherData?: WeatherData[]
  photos?: TripPhoto[]
  coverImage?: string
  packingListId?: string // Reference to associated packing list
  createdAt: Date
  updatedAt: Date
}

export interface Destination {
  id: string
  name: string
  country: string
  city: string
  coordinates: {
    lat: number
    lng: number
  }
  timeZone: string
  currency: string
  language: string[]
  description?: string
  imageUrl?: string
}

export interface Budget {
  total: number
  currency: string
  breakdown: {
    accommodation: number
    transportation: number
    food: number
    activities: number
    miscellaneous: number
  }
  spent?: number
}

export interface Expense {
  id: string
  tripId: string
  category: keyof Budget['breakdown']
  amount: number
  description: string
  date: Date
  createdBy: string
  createdAt: Date
}

export interface Traveler {
  id: string
  name: string
  email?: string
  age?: number
  relationship: 'self' | 'partner' | 'family' | 'friend'
  preferences?: Partial<UserPreferences>
}

export interface DayItinerary {
  id: string
  tripId: string
  date: Date
  dayNumber: number
  destinationId?: string // Reference to which destination this day belongs to
  activities: Activity[]
  accommodations?: Accommodation[]
  transportation?: Transportation[]
  notes?: string
  weather?: DayWeather
  estimatedCost?: number
}

export interface Activity {
  id: string
  name: string
  description?: string
  type: ActivityType | string
  location: Location
  startTime?: string | Date
  endTime?: string | Date
  duration?: number // in minutes
  cost?: {
    amount: number
    currency: string
    perPerson?: boolean
  }
  bookingUrl?: string
  rating?: number
  reviewCount?: number
  reviews?: Review[]
  openingHours?: string[]
  phone?: string
  website?: string
  images?: { url: string; caption?: string }[]
  tags?: string[]
  aiGenerated: boolean
  userAdded: boolean
  googlePlaceId?: string
  // Recommendation fields
  isRecommended?: boolean
  recommendedBy?: {
    type: 'expert' | 'novatrek' | 'community'
    id: string
    name: string
    profileUrl?: string
  }
  recommendationReason?: string
  tips?: string[]
  highlights?: string[]
}

export interface Location {
  name: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  placeId?: string // Google Places ID
}

export interface Accommodation {
  id: string
  name: string
  type: 'hotel' | 'airbnb' | 'hostel' | 'resort' | 'other'
  location: Location
  checkIn: Date
  checkOut: Date
  cost?: number
  currency?: string
  bookingUrl?: string
  rating?: number
  amenities: string[]
  images?: string[]
}

export interface Transportation {
  id: string
  type: 'flight' | 'train' | 'bus' | 'car' | 'taxi' | 'walk' | 'bike'
  from: Location
  to: Location
  departure: Date
  arrival?: Date
  cost?: number
  currency?: string
  bookingUrl?: string
  details?: string
}

export interface WeatherData {
  date: Date
  temperature: {
    high: number
    low: number
    unit: 'celsius' | 'fahrenheit'
  }
  condition: string
  humidity: number
  windSpeed: number
  precipitation: number
  icon: string
}

export interface DayWeather {
  date: Date
  high: number
  low: number
  condition: string
  icon: string
  precipitation: number
}

export interface AIRecommendation {
  id: string
  type: 'activity' | 'restaurant' | 'accommodation' | 'itinerary'
  content: any // The actual recommendation data
  reasoning: string
  confidence: number // 0-1
  createdAt: Date
  applied: boolean
}

export interface Review {
  id: string
  userId: string
  userName: string
  rating: number // 1-5
  comment: string
  date: Date
  helpful: number
}

export interface ChatMessage {
  id: string
  tripId?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    recommendations?: AIRecommendation[]
    context?: any
  }
}

export interface SavedPlace {
  id: string
  userId: string
  name: string
  location: Location
  type: ActivityType
  notes?: string
  tags: string[]
  savedAt: Date
}

export interface PackingCategory {
  id: string
  name: string
  icon?: string
  order: number
  items: PackingItem[]
}

export interface PackingItem {
  id: string
  name: string
  quantity?: number
  checked: boolean
  categoryId: string
  notes?: string
  isShared?: boolean
  sharedWith?: string[]
  aiSuggested?: boolean
  weatherDependent?: boolean
  activityDependent?: string[] // Related activity types
}

export interface PackingList {
  id: string
  tripId: string
  userId: string
  name: string
  categories: PackingCategory[]
  templateId?: string // Reference to standard template used
  weatherConsiderations?: {
    averageTemp: { high: number; low: number }
    rainExpected: boolean
    snowExpected: boolean
  }
  tripType?: 'leisure' | 'business' | 'adventure' | 'beach' | 'city' | 'mixed'
  lastUpdated: Date
  createdAt: Date
}

export interface PackingTemplate {
  id: string
  name: string
  description: string
  tripType: 'leisure' | 'business' | 'adventure' | 'beach' | 'city'
  climate: 'tropical' | 'temperate' | 'cold' | 'desert' | 'mixed'
  duration: 'weekend' | 'week' | 'extended' // 2-3 days, 4-7 days, 8+ days
  categories: PackingCategory[]
  isDefault: boolean
  createdAt: Date
}