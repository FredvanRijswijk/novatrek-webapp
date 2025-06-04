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

export interface Trip {
  id: string
  userId: string
  title: string
  description?: string
  destination: Destination
  startDate: Date
  endDate: Date
  budget?: Budget
  travelers: Traveler[]
  itinerary: DayItinerary[]
  status: 'planning' | 'booked' | 'active' | 'completed' | 'cancelled'
  aiRecommendations?: AIRecommendation[]
  weatherData?: WeatherData[]
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
  type: ActivityType
  location: Location
  startTime?: Date
  endTime?: Date
  duration?: number // in minutes
  cost?: number
  currency?: string
  bookingUrl?: string
  rating?: number
  reviews?: Review[]
  aiGenerated: boolean
  userAdded: boolean
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