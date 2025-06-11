import { Trip, Activity, Accommodation, Transportation, WeatherData, DayItinerary } from './travel';
import { TravelPreferences } from './preferences';

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;
  duration: number; // minutes
}

export interface BudgetBreakdown {
  accommodation: number;
  activities: number;
  food: number;
  transport: number;
  shopping: number;
  other: number;
}

export interface DetailedActivity extends Activity {
  dayNumber: number;
  conflicts?: string[];
  weatherSuitable: boolean;
}

export interface DayContext {
  dayNumber: number;
  date: Date;
  activities: DetailedActivity[];
  accommodations?: Accommodation[];
  transportation?: Transportation[];
  totalCost: number;
  freeTimeSlots: TimeSlot[];
  hasBreakfast: boolean;
  hasLunch: boolean;
  hasDinner: boolean;
  weather?: WeatherData;
}

export interface TripProgress {
  daysPlanned: number;
  totalDays: number;
  accommodationCoverage: number; // percentage
  activitiesPerDay: number;
  emptyDays: number[];
  packedDays: number[]; // days with too many activities
}

export interface BudgetAnalysis {
  total: number;
  spent: number;
  remaining: number;
  breakdown: BudgetBreakdown;
  dailyAverage: number;
  projectedOverage?: number;
  spentByCategory: BudgetBreakdown;
  remainingDaily: number;
  isOverBudget: boolean;
}

export interface EnhancedTripContext {
  // Basic Info
  tripId: string;
  destination: string;
  destinations?: string[]; // for multi-destination trips
  dates: {
    start: Date;
    end: Date;
    formatted: string;
  };
  travelers: {
    count: number;
    type: 'solo' | 'couple' | 'family' | 'friends' | 'group';
  };
  
  // Detailed Itinerary
  detailedItinerary: DayContext[];
  
  // User Preferences
  userPreferences?: TravelPreferences;
  
  // Budget Analysis
  budget: BudgetAnalysis;
  
  // Trip Progress
  progress: TripProgress;
  
  // Weather Context
  weatherForecast?: WeatherData[];
  
  // Location Context
  currentDestination?: {
    timezone: string;
    currency: string;
    language: string[];
    coordinates?: { lat: number; lng: number };
  };
  
  // Issues & Alerts
  issues: TripIssue[];
  
  // Quick Stats
  stats: {
    totalActivities: number;
    totalDistance?: number; // km between all activities
    walkingTime?: number; // total minutes of walking
    photoSpots: number;
    restaurants: number;
    freeTime: number; // total hours
  };
}

export interface TripIssue {
  type: 'time_conflict' | 'meal_gap' | 'rushed_transition' | 'weather_conflict' | 'budget_overrun' | 'no_accommodation';
  severity: 'low' | 'medium' | 'high';
  day?: number;
  message: string;
  suggestion: string;
  activities?: string[]; // affected activity names
}

export interface SmartSuggestion {
  id: string;
  text: string;
  icon: string;
  priority: number;
  category: 'planning' | 'booking' | 'discovery' | 'optimization' | 'alert';
  metadata?: {
    day?: number;
    placeType?: string;
    budget?: number;
  };
}