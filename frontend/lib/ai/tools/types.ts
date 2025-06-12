import { z } from 'zod';
import { Trip, TripDay } from '@/lib/models/trip';
import { TripV2, DayV2, ActivityV2 } from '@/types/travel-v2';
import { User } from '@/lib/models/user';
import { TravelPreferences } from '@/types/preferences';

// Extended day type that includes activities for V2
export interface DayWithActivities extends DayV2 {
  activities: ActivityV2[];
  accommodations?: any[];
  transportation?: any[];
}

export interface ToolContext {
  userId: string;
  user: User;
  trip: (Trip | TripV2) & {
    // Ensure these fields are available for tools
    destinationCoordinates?: { lat: number; lng: number };
    destinationName?: string;
  };
  tripDays: TripDay[] | DayWithActivities[]; // Support both structures
  preferences: TravelPreferences;
  currentDate?: string;
  currentActivity?: any;
  weather?: any;
  budget?: {
    total: number;
    spent: number;
    remaining: number;
    categories: Record<string, number>;
  };
  // Admin services for tools that need write access
  adminServices?: {
    tripService: any; // TripServiceAdminV2
    dayModel: any; // DayModelAdminV2
    activityModel: any; // ActivityModelAdminV2
  };
}

export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    source?: string;
    confidence?: number;
    alternatives?: any[];
    warnings?: string[];
    suggestions?: string[];
  };
}

export interface TravelTool<TParams = any, TResult = any> {
  id: string;
  name: string;
  description: string;
  category: 'search' | 'booking' | 'planning' | 'utility' | 'expert';
  parameters: z.ZodSchema<TParams>;
  execute: (params: TParams, context: ToolContext) => Promise<ToolResult<TResult>>;
  requiresAuth?: boolean;
  requiresSubscription?: 'free' | 'premium' | 'expert';
  rateLimit?: {
    requests: number;
    window: string;
  };
}

export interface SearchResult {
  id: string;
  name: string;
  description?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  rating?: number;
  reviews?: number;
  priceLevel?: number;
  photos?: string[];
  types?: string[];
  openingHours?: any;
  website?: string;
  phone?: string;
  // Expert and ranking fields
  expertRating?: number;
  expertReviews?: Array<{
    expertId: string;
    expertName: string;
    rating: number;
    review: string;
    verified: boolean;
  }>;
  novatrekScore?: number;
  rankingFactors?: {
    expertEndorsed: boolean;
    popularityScore: number;
    matchScore: number;
    distanceScore: number;
  };
}

export interface ActivityResult extends SearchResult {
  duration?: number;
  bestTime?: string;
  bookingRequired?: boolean;
  bookingUrl?: string;
  suitableFor?: string[];
  accessibility?: string[];
  weatherDependent?: boolean;
  indoorOutdoor?: 'indoor' | 'outdoor' | 'both';
}

export interface RestaurantResult extends SearchResult {
  cuisine?: string[];
  dietary?: string[];
  mealTypes?: string[];
  reservationUrl?: string;
  deliveryAvailable?: boolean;
  takeoutAvailable?: boolean;
  averageCost?: number;
}

export interface ToolRegistry {
  register(tool: TravelTool): void;
  get(toolId: string): TravelTool | undefined;
  getByCategory(category: string): TravelTool[];
  getAvailableTools(context: ToolContext): TravelTool[];
  execute(toolId: string, params: any, context: ToolContext): Promise<ToolResult>;
}