import { Trip, DayItinerary, Activity, WeatherData } from '@/types/travel';
import { TravelPreferences } from '@/types/preferences';
import { 
  EnhancedTripContext, 
  DayContext, 
  TimeSlot, 
  TripProgress, 
  BudgetAnalysis,
  TripIssue,
  DetailedActivity,
  BudgetBreakdown
} from '@/types/chat-context';
import { format, differenceInDays, parseISO, addMinutes, isBefore, isAfter } from 'date-fns';

export class TripContextBuilder {
  private trip: Trip;
  private preferences?: TravelPreferences;
  private weatherData?: WeatherData[];

  constructor(trip: Trip, preferences?: TravelPreferences, weatherData?: WeatherData[]) {
    this.trip = trip;
    this.preferences = preferences;
    this.weatherData = weatherData;
  }

  build(): EnhancedTripContext {
    let startDate: Date;
    let endDate: Date;
    let formattedDates = 'Date not set';
    
    try {
      // Handle various date formats
      if (this.trip.startDate) {
        if (this.trip.startDate instanceof Date) {
          startDate = this.trip.startDate;
        } else if (typeof this.trip.startDate === 'string') {
          startDate = new Date(this.trip.startDate);
        } else if ((this.trip.startDate as any).toDate) {
          // Handle Firestore Timestamp
          startDate = (this.trip.startDate as any).toDate();
        } else {
          startDate = new Date();
        }
      } else {
        startDate = new Date();
      }
      
      if (this.trip.endDate) {
        if (this.trip.endDate instanceof Date) {
          endDate = this.trip.endDate;
        } else if (typeof this.trip.endDate === 'string') {
          endDate = new Date(this.trip.endDate);
        } else if ((this.trip.endDate as any).toDate) {
          // Handle Firestore Timestamp
          endDate = (this.trip.endDate as any).toDate();
        } else {
          endDate = new Date();
        }
      } else {
        endDate = new Date();
      }
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('Invalid trip dates:', { start: this.trip.startDate, end: this.trip.endDate });
        startDate = new Date();
        endDate = new Date();
      } else {
        formattedDates = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
      }
    } catch (error) {
      console.error('Error parsing trip dates:', error);
      startDate = new Date();
      endDate = new Date();
    }
    
    return {
      tripId: this.trip.id,
      destination: this.getDestinationName(),
      destinations: this.getDestinations(),
      dates: {
        start: startDate,
        end: endDate,
        formatted: formattedDates
      },
      travelers: {
        count: this.trip.travelers.length,
        type: this.getTravelType()
      },
      detailedItinerary: this.buildDetailedItinerary(),
      userPreferences: this.preferences,
      budget: this.analyzeBudget(),
      progress: this.analyzeProgress(),
      weatherForecast: this.weatherData,
      currentDestination: this.getCurrentDestinationInfo(),
      issues: this.detectIssues(),
      stats: this.calculateStats()
    };
  }

  private getDestinationName(): string {
    return this.trip.destinationName || 'Unknown';
  }

  private getDestinations(): string[] {
    return this.trip.destinationName ? [this.trip.destinationName] : [];
  }

  private getTravelType(): 'solo' | 'couple' | 'family' | 'friends' | 'group' {
    const count = this.trip.travelers.length;
    if (count === 1) return 'solo';
    if (count === 2) {
      const hasPartner = this.trip.travelers.some(t => t.relationship === 'partner');
      return hasPartner ? 'couple' : 'friends';
    }
    const hasFamily = this.trip.travelers.some(t => t.relationship === 'family');
    return hasFamily ? 'family' : count > 4 ? 'group' : 'friends';
  }

  private buildDetailedItinerary(): DayContext[] {
    const itinerary = this.trip.itinerary || [];
    
    return itinerary.map(day => {
      const activities = this.enhanceActivities(day.activities || [], day.dayNumber);
      const freeSlots = this.calculateFreeTimeSlots(activities);
      const meals = this.checkMeals(activities);
      
      return {
        dayNumber: day.dayNumber,
        date: day.date instanceof Date ? day.date : new Date(day.date),
        activities,
        accommodations: day.accommodations,
        transportation: day.transportation,
        totalCost: this.calculateDayCost(day),
        freeTimeSlots: freeSlots,
        hasBreakfast: meals.breakfast,
        hasLunch: meals.lunch,
        hasDinner: meals.dinner,
        weather: this.getWeatherForDay(day.date)
      };
    });
  }

  private enhanceActivities(activities: Activity[], dayNumber: number): DetailedActivity[] {
    return activities.map(activity => {
      const enhanced: DetailedActivity = {
        ...activity,
        dayNumber,
        conflicts: this.findConflicts(activity, activities),
        weatherSuitable: this.checkWeatherSuitability(activity, dayNumber)
      };
      return enhanced;
    });
  }

  private calculateFreeTimeSlots(activities: DetailedActivity[]): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const sortedActivities = [...activities].sort((a, b) => {
      const timeA = this.parseTime(a.startTime);
      const timeB = this.parseTime(b.startTime);
      return timeA - timeB;
    });

    // Check morning slot (8:00 - first activity)
    if (sortedActivities.length > 0) {
      const firstActivity = sortedActivities[0];
      const firstStart = this.parseTime(firstActivity.startTime);
      if (firstStart > 8 * 60) { // After 8 AM
        slots.push({
          start: '08:00',
          end: this.formatTime(firstStart),
          duration: firstStart - 8 * 60
        });
      }
    } else {
      // Whole day is free
      slots.push({
        start: '08:00',
        end: '22:00',
        duration: 14 * 60
      });
    }

    // Check between activities
    for (let i = 0; i < sortedActivities.length - 1; i++) {
      const current = sortedActivities[i];
      const next = sortedActivities[i + 1];
      
      const currentEnd = this.parseTime(current.startTime) + (current.duration || 60);
      const nextStart = this.parseTime(next.startTime);
      
      if (nextStart - currentEnd > 30) { // At least 30 minutes gap
        slots.push({
          start: this.formatTime(currentEnd),
          end: this.formatTime(nextStart),
          duration: nextStart - currentEnd
        });
      }
    }

    // Check evening slot (last activity - 22:00)
    if (sortedActivities.length > 0) {
      const lastActivity = sortedActivities[sortedActivities.length - 1];
      const lastEnd = this.parseTime(lastActivity.startTime) + (lastActivity.duration || 60);
      if (lastEnd < 22 * 60) { // Before 10 PM
        slots.push({
          start: this.formatTime(lastEnd),
          end: '22:00',
          duration: 22 * 60 - lastEnd
        });
      }
    }

    return slots.filter(slot => slot.duration >= 30); // Only slots 30+ minutes
  }

  private parseTime(time: string | Date | undefined): number {
    if (!time) return 0;
    if (typeof time === 'string') {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    }
    const date = time instanceof Date ? time : new Date(time);
    return date.getHours() * 60 + date.getMinutes();
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private checkMeals(activities: DetailedActivity[]): { breakfast: boolean; lunch: boolean; dinner: boolean } {
    const hasMeal = (timeRange: [number, number], types: string[]) => {
      return activities.some(activity => {
        const time = this.parseTime(activity.startTime);
        const isInTimeRange = time >= timeRange[0] && time <= timeRange[1];
        const isMealType = types.some(type => 
          activity.type === type || 
          activity.name.toLowerCase().includes(type) ||
          (activity.type === 'dining' && isInTimeRange)
        );
        return isInTimeRange && isMealType;
      });
    };

    return {
      breakfast: hasMeal([6 * 60, 11 * 60], ['breakfast', 'brunch', 'cafe']),
      lunch: hasMeal([11 * 60, 15 * 60], ['lunch', 'brunch', 'restaurant']),
      dinner: hasMeal([17 * 60, 22 * 60], ['dinner', 'restaurant'])
    };
  }

  private calculateDayCost(day: DayItinerary): number {
    let cost = 0;
    
    // Activities
    day.activities?.forEach(activity => {
      if (activity.cost) {
        const activityCost = activity.cost.amount * (activity.cost.perPerson ? this.trip.travelers.length : 1);
        cost += activityCost;
      }
    });
    
    // Accommodations
    day.accommodations?.forEach(accommodation => {
      if (accommodation.cost) {
        cost += accommodation.cost;
      }
    });
    
    // Transportation
    day.transportation?.forEach(transport => {
      if (transport.cost) {
        cost += transport.cost;
      }
    });
    
    return cost;
  }

  private findConflicts(activity: Activity, allActivities: Activity[]): string[] {
    const conflicts: string[] = [];
    if (!activity.startTime) return conflicts;
    
    const activityStart = this.parseTime(activity.startTime);
    const activityEnd = activityStart + (activity.duration || 60);
    
    allActivities.forEach(other => {
      if (other.id === activity.id || !other.startTime) return;
      
      const otherStart = this.parseTime(other.startTime);
      const otherEnd = otherStart + (other.duration || 60);
      
      // Check for overlap
      if ((activityStart < otherEnd && activityEnd > otherStart)) {
        conflicts.push(other.name);
      }
    });
    
    return conflicts;
  }

  private checkWeatherSuitability(activity: Activity, dayNumber: number): boolean {
    if (!this.weatherData) return true;
    
    const weather = this.weatherData[dayNumber - 1];
    if (!weather) return true;
    
    const isOutdoor = ['outdoor', 'nature', 'beach', 'hiking', 'sightseeing'].includes(activity.type);
    if (!isOutdoor) return true;
    
    // Check for bad weather conditions
    const isBadWeather = 
      weather.precipitation > 70 || // Heavy rain
      weather.windSpeed > 50 || // Strong wind
      weather.condition.toLowerCase().includes('storm');
      
    return !isBadWeather;
  }

  private getWeatherForDay(date: Date | string): WeatherData | undefined {
    if (!this.weatherData) return undefined;
    
    const dateObj = date instanceof Date ? date : new Date(date);
    const dayIndex = differenceInDays(dateObj, this.trip.startDate);
    
    return this.weatherData[dayIndex];
  }

  private analyzeBudget(): BudgetAnalysis {
    const total = this.trip.budget?.total || 0;
    const breakdown: BudgetBreakdown = {
      accommodation: 0,
      activities: 0,
      food: 0,
      transport: 0,
      shopping: 0,
      other: 0
    };
    
    // Calculate spent by category
    this.trip.itinerary?.forEach(day => {
      day.activities?.forEach(activity => {
        if (activity.cost) {
          const cost = activity.cost.amount * (activity.cost.perPerson ? this.trip.travelers.length : 1);
          if (activity.type === 'dining') {
            breakdown.food += cost;
          } else {
            breakdown.activities += cost;
          }
        }
      });
      
      day.accommodations?.forEach(acc => {
        breakdown.accommodation += acc.cost || 0;
      });
      
      day.transportation?.forEach(trans => {
        breakdown.transport += trans.cost || 0;
      });
    });
    
    const spent = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    const remaining = total - spent;
    const totalDays = differenceInDays(this.trip.endDate, this.trip.startDate) + 1;
    const daysElapsed = Math.min(differenceInDays(new Date(), this.trip.startDate), totalDays);
    const daysRemaining = Math.max(totalDays - daysElapsed, 1);
    
    return {
      total,
      spent,
      remaining,
      breakdown: this.trip.budget?.breakdown || breakdown,
      dailyAverage: total / totalDays,
      spentByCategory: breakdown,
      remainingDaily: remaining / daysRemaining,
      isOverBudget: spent > total,
      projectedOverage: spent > total ? spent - total : undefined
    };
  }

  private analyzeProgress(): TripProgress {
    const startDate = this.trip.startDate instanceof Date ? this.trip.startDate : new Date(this.trip.startDate);
    const endDate = this.trip.endDate instanceof Date ? this.trip.endDate : new Date(this.trip.endDate);
    const totalDays = differenceInDays(endDate, startDate) + 1;
    
    const daysWithActivities = this.trip.itinerary?.filter(day => 
      day.activities && day.activities.length > 0
    ).length || 0;
    
    const emptyDays = [];
    const packedDays = [];
    
    for (let i = 1; i <= totalDays; i++) {
      const day = this.trip.itinerary?.find(d => d.dayNumber === i);
      const activityCount = day?.activities?.length || 0;
      
      if (activityCount === 0) {
        emptyDays.push(i);
      } else if (activityCount > 5) { // More than 5 activities is considered packed
        packedDays.push(i);
      }
    }
    
    const accommodationDays = this.trip.itinerary?.filter(day => 
      day.accommodations && day.accommodations.length > 0
    ).length || 0;
    
    const totalActivities = this.trip.itinerary?.reduce((sum, day) => 
      sum + (day.activities?.length || 0), 0
    ) || 0;
    
    return {
      daysPlanned: daysWithActivities,
      totalDays,
      accommodationCoverage: (accommodationDays / totalDays) * 100,
      activitiesPerDay: totalActivities / totalDays,
      emptyDays,
      packedDays
    };
  }

  private getCurrentDestinationInfo() {
    // V2 only uses destinationCoordinates and other trip-level fields
    if (!this.trip.destinationCoordinates) return undefined;
    
    return {
      timezone: 'UTC', // V2 doesn't have timezone info yet
      currency: 'USD', // V2 doesn't have currency info yet
      language: ['English'], // V2 doesn't have language info yet
      coordinates: this.trip.destinationCoordinates
    };
  }

  private detectIssues(): TripIssue[] {
    const issues: TripIssue[] = [];
    
    // Check each day
    this.trip.itinerary?.forEach(day => {
      // Time conflicts
      day.activities?.forEach(activity => {
        const conflicts = this.findConflicts(activity, day.activities || []);
        if (conflicts.length > 0) {
          issues.push({
            type: 'time_conflict',
            severity: 'high',
            day: day.dayNumber,
            message: `${activity.name} overlaps with ${conflicts.join(', ')}`,
            suggestion: 'Adjust timing or choose one activity',
            activities: [activity.name, ...conflicts]
          });
        }
      });
      
      // Meal gaps
      const meals = this.checkMeals(day.activities as DetailedActivity[] || []);
      if (!meals.lunch && day.activities && day.activities.length > 0) {
        issues.push({
          type: 'meal_gap',
          severity: 'medium',
          day: day.dayNumber,
          message: 'No lunch planned',
          suggestion: 'Add a lunch break between activities'
        });
      }
      
      // No accommodation
      if (!day.accommodations || day.accommodations.length === 0) {
        issues.push({
          type: 'no_accommodation',
          severity: 'high',
          day: day.dayNumber,
          message: `No accommodation for Day ${day.dayNumber}`,
          suggestion: 'Book accommodation for this night'
        });
      }
    });
    
    // Budget issues
    const budget = this.analyzeBudget();
    if (budget.isOverBudget) {
      issues.push({
        type: 'budget_overrun',
        severity: 'high',
        message: `Over budget by ${budget.projectedOverage}`,
        suggestion: 'Review expensive activities or find free alternatives'
      });
    }
    
    return issues;
  }

  private calculateStats() {
    const totalActivities = this.trip.itinerary?.reduce((sum, day) => 
      sum + (day.activities?.length || 0), 0
    ) || 0;
    
    const photoSpots = this.trip.itinerary?.reduce((sum, day) => 
      sum + (day.activities?.filter(a => 
        a.tags?.includes('photography') || 
        a.type === 'sightseeing' ||
        a.name.toLowerCase().includes('viewpoint')
      ).length || 0), 0
    ) || 0;
    
    const restaurants = this.trip.itinerary?.reduce((sum, day) => 
      sum + (day.activities?.filter(a => 
        a.type === 'dining' || a.type === 'restaurant'
      ).length || 0), 0
    ) || 0;
    
    const freeTimeMinutes = this.trip.itinerary?.reduce((sum, day) => {
      const slots = this.calculateFreeTimeSlots(day.activities as DetailedActivity[] || []);
      return sum + slots.reduce((slotSum, slot) => slotSum + slot.duration, 0);
    }, 0) || 0;
    
    return {
      totalActivities,
      photoSpots,
      restaurants,
      freeTime: Math.round(freeTimeMinutes / 60), // Convert to hours
      totalDistance: undefined, // TODO: Calculate with Google Maps
      walkingTime: undefined // TODO: Calculate with Google Maps
    };
  }
}