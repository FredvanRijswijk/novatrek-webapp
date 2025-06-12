/**
 * Travel Types V2 - Subcollection Structure
 * 
 * This file defines the new data structure using Firestore subcollections
 * for better scalability and performance.
 */

import { DocumentReference, Timestamp } from 'firebase/firestore';

// ===== Core Trip Document (Lean) =====
export interface TripV2 {
  id: string;
  
  // Core Information
  title: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'completed';
  
  // User References
  userId: string;
  userRef?: DocumentReference;
  
  // Main Dates (normalized to YYYY-MM-DD)
  startDate: string;
  endDate: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  
  // Destinations
  destination?: Destination; // Legacy single destination
  destinations?: TripDestination[]; // Multi-destination support
  
  // Travelers
  travelers: Traveler[];
  
  // Budget
  budget?: Budget;
  
  // Sharing
  sharedWith?: string[];
  shareToken?: string;
  isPublic?: boolean;
  
  // Statistics (denormalized for quick access)
  stats?: {
    totalDays: number;
    totalActivities: number;
    totalExpenses: number;
    lastActivityUpdate?: Timestamp | string;
  };
  
  // No nested arrays - moved to subcollections
  // itinerary: removed
  // expenses: moved to subcollection
  // aiRecommendations: moved to subcollection
}

// ===== Days Subcollection =====
export interface DayV2 {
  id: string;
  tripId: string;
  
  // Core Day Information
  dayNumber: number;
  date: string; // YYYY-MM-DD
  
  // Destination for this day
  destinationId?: string;
  destinationName?: string;
  
  // Day metadata
  type?: 'destination' | 'travel';
  notes?: string;
  weather?: WeatherData;
  
  // Statistics (denormalized for quick access)
  stats?: {
    activityCount: number;
    accommodationCount: number;
    transportCount: number;
    totalCost: number;
    lastUpdate?: Timestamp | string;
  };
  
  // Travel day specific
  fromDestination?: string;
  toDestination?: string;
}

// ===== Activities Subcollection =====
export interface ActivityV2 {
  id: string;
  dayId: string;
  tripId: string;
  
  // Core Activity Information
  name: string;
  description?: string;
  type: 'sightseeing' | 'dining' | 'activity' | 'transport' | 'accommodation' | 'other';
  category?: string;
  
  // Location
  location: {
    lat: number;
    lng: number;
    address: string;
    placeId?: string;
  };
  
  // Timing
  time?: string; // HH:MM
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  duration?: number; // minutes
  
  // Cost
  cost?: {
    amount: number;
    currency: string;
    perPerson?: boolean;
  };
  
  // Booking
  bookingRequired?: boolean;
  bookingUrl?: string;
  confirmationNumber?: string;
  
  // Metadata
  tags?: string[];
  photos?: string[];
  rating?: number;
  priority?: 'must-see' | 'nice-to-have' | 'optional';
  status?: 'planned' | 'booked' | 'completed' | 'cancelled';
  
  // AI Enhancement
  novatrekEnhanced?: boolean;
  expertRecommended?: boolean;
  aiSuggested?: boolean;
  confidence?: number;
  
  // Travel optimization
  travelTimeFromPrevious?: number; // minutes
  weatherSuitability?: boolean;
  
  // Timestamps
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  addedAt?: string; // When added to itinerary
  createdBy?: string; // userId who added it
}

// ===== Accommodations Subcollection =====
export interface AccommodationV2 {
  id: string;
  dayId: string;
  tripId: string;
  
  // Core Information
  name: string;
  type: 'hotel' | 'airbnb' | 'hostel' | 'resort' | 'other';
  
  // Location
  location: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    placeId?: string;
  };
  
  // Dates
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  checkInTime?: string; // HH:MM
  checkOutTime?: string; // HH:MM
  
  // Cost
  cost?: number;
  currency?: string;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  
  // Booking
  confirmationNumber?: string;
  bookingUrl?: string;
  cancellationPolicy?: string;
  
  // Details
  roomType?: string;
  guests?: number;
  amenities?: string[];
  rating?: number;
  photos?: string[];
  notes?: string;
  
  // Timestamps
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  bookedAt?: Timestamp | string;
}

// ===== Transportation Subcollection =====
export interface TransportationV2 {
  id: string;
  dayId: string;
  tripId: string;
  
  // Core Information
  type: 'flight' | 'train' | 'bus' | 'car' | 'ferry' | 'taxi' | 'other';
  mode?: string; // More specific: "high-speed-rail", "domestic-flight", etc.
  
  // Route
  from: {
    name: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
    terminal?: string;
  };
  to: {
    name: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
    terminal?: string;
  };
  
  // Timing
  departureDate: string; // YYYY-MM-DD
  departureTime: string; // HH:MM
  arrivalDate: string; // YYYY-MM-DD
  arrivalTime: string; // HH:MM
  duration?: number; // minutes
  
  // Booking
  carrier?: string;
  flightNumber?: string;
  trainNumber?: string;
  confirmationNumber?: string;
  bookingUrl?: string;
  seat?: string;
  class?: string;
  
  // Cost
  cost?: number;
  currency?: string;
  
  // Details
  status?: 'scheduled' | 'delayed' | 'cancelled' | 'completed';
  notes?: string;
  baggageInfo?: string;
  
  // Timestamps
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

// ===== Expenses Subcollection =====
export interface ExpenseV2 {
  id: string;
  tripId: string;
  dayId?: string; // Optional link to specific day
  
  // Core Information
  description: string;
  amount: number;
  currency: string;
  category: 'food' | 'transport' | 'accommodation' | 'activity' | 'shopping' | 'other';
  
  // Details
  date: string; // YYYY-MM-DD
  paidBy: string; // traveler ID
  splitWith?: string[]; // traveler IDs
  
  // Receipt
  receiptUrl?: string;
  notes?: string;
  
  // Location
  location?: {
    name: string;
    coordinates?: { lat: number; lng: number };
  };
  
  // Timestamps
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

// ===== AI Recommendations Subcollection =====
export interface AIRecommendationV2 {
  id: string;
  tripId: string;
  dayId?: string; // Optional link to specific day
  
  // Recommendation Details
  type: 'activity' | 'restaurant' | 'accommodation' | 'transport' | 'tip';
  title: string;
  description: string;
  
  // Relevance
  confidence: number; // 0-1
  reasons: string[];
  basedOn?: string[]; // What preferences/context led to this
  
  // Action
  actionable: boolean;
  actionType?: 'add-to-itinerary' | 'book-now' | 'consider' | 'avoid';
  targetDate?: string; // YYYY-MM-DD
  
  // Details (varies by type)
  details?: {
    location?: Location;
    cost?: Cost;
    duration?: number;
    bookingUrl?: string;
    alternativeTo?: string; // ID of existing item
  };
  
  // Status
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  
  // Timestamps
  createdAt: Timestamp | string;
  expiresAt?: Timestamp | string;
  respondedAt?: Timestamp | string;
}

// ===== Shared Types (unchanged) =====
export interface Destination {
  id: string;
  name: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  placeId?: string;
  timeZone?: string;
  currency?: string;
  language?: string[];
}

export interface TripDestination {
  destination: Destination;
  arrivalDate: string;
  departureDate: string;
  accommodation?: any;
  notes?: string;
}

export interface Traveler {
  id: string;
  name: string;
  email?: string;
  relationship?: 'self' | 'partner' | 'family' | 'friend';
}

export interface Budget {
  total: number;
  currency: string;
  breakdown?: {
    accommodation: number;
    activities: number;
    food: number;
    transport: number;
    shopping: number;
    other: number;
  };
}

export interface WeatherData {
  date: string;
  temperature: number;
  condition: string;
  precipitation: number;
  windSpeed: number;
}

export interface Location {
  name: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  placeId?: string;
}

export interface Cost {
  amount: number;
  currency: string;
  perPerson?: boolean;
}

// ===== Packing Lists Subcollection =====
export interface PackingListV2 {
  id: string;
  tripId: string;
  
  // Core Information
  name: string;
  description?: string;
  isPrimary?: boolean;
  template?: 'beach' | 'mountain' | 'city' | 'business' | 'adventure' | 'custom';
  
  // Items
  items: PackingItemV2[];
  completedItems: string[]; // Array of item IDs that are checked off
  
  // Statistics
  stats: {
    totalItems: number;
    completedItems: number;
    categories: Record<string, number>; // Category name -> item count
  };
  
  // Timestamps
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface PackingItemV2 {
  id: string;
  name: string;
  category: 'Clothing' | 'Electronics' | 'Documents' | 'Personal Care' | 'Health' | 
            'Footwear' | 'Accessories' | 'Bags' | 'Gear' | 'Beach' | 'Activities' | 
            'Office' | 'Safety' | 'Other';
  quantity: number;
  essential?: boolean;
  optional?: boolean;
  weatherDependent?: boolean;
  customItem?: boolean;
  notes?: string;
}

// ===== Collection Paths =====
export const COLLECTIONS_V2 = {
  TRIPS: 'trips',
  DAYS: (tripId: string) => `trips/${tripId}/days`,
  ACTIVITIES: (tripId: string, dayId: string) => `trips/${tripId}/days/${dayId}/activities`,
  ACCOMMODATIONS: (tripId: string, dayId: string) => `trips/${tripId}/days/${dayId}/accommodations`,
  TRANSPORTATION: (tripId: string, dayId: string) => `trips/${tripId}/days/${dayId}/transportation`,
  EXPENSES: (tripId: string) => `trips/${tripId}/expenses`,
  PACKING_LISTS: (tripId: string) => `trips/${tripId}/packing_lists`,
  AI_RECOMMENDATIONS: (tripId: string) => `trips/${tripId}/ai_recommendations`,
} as const;