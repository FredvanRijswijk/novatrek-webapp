import { TripModelEnhanced, TripEnhanced } from './trip-enhanced';
import { Trip } from '@/types/travel';
import { normalizeDate } from '@/lib/utils/date-helpers';
import { subscribeToDocument } from '@/lib/firebase';
import { convertTimestampsToDates } from '@/lib/utils/firebase-helpers';

/**
 * Extended Trip Model that normalizes all dates to YYYY-MM-DD format
 * This ensures consistency between chat and itinerary views
 */
export class TripModelNormalized extends TripModelEnhanced {
  
  /**
   * Get a trip by ID with normalized dates
   */
  static async getByIdNormalized(tripId: string): Promise<Trip | null> {
    const trip = await super.getById(tripId);
    if (!trip) return null;
    
    return this.normalizeTripDates(trip);
  }
  
  /**
   * Get all trips for a user with normalized dates
   */
  static async getUserTripsNormalized(userId: string): Promise<Trip[]> {
    const trips = await super.getUserTrips(userId);
    return trips.map(trip => this.normalizeTripDates(trip));
  }
  
  /**
   * Subscribe to trip updates with normalized dates
   */
  static subscribeToTripNormalized(
    tripId: string, 
    callback: (trip: Trip | null) => void
  ): () => void {
    return subscribeToDocument<TripEnhanced>(
      this.COLLECTION,
      tripId,
      (trip) => {
        if (trip) {
          const convertedTrip = convertTimestampsToDates(trip);
          callback(this.normalizeTripDates(convertedTrip));
        } else {
          callback(null);
        }
      }
    );
  }
  
  /**
   * Normalize all dates in a trip to YYYY-MM-DD format
   */
  private static normalizeTripDates(trip: TripEnhanced): Trip {
    const normalized: Trip = {
      ...trip,
      // Normalize root dates
      startDate: normalizeDate(trip.startDate),
      endDate: normalizeDate(trip.endDate),
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt
    };
    
    // Normalize itinerary dates
    if (normalized.itinerary) {
      normalized.itinerary = normalized.itinerary.map(day => ({
        ...day,
        date: normalizeDate(day.date),
        // Normalize activity times if needed
        activities: day.activities?.map(activity => ({
          ...activity,
          // Keep time fields as is, but ensure date fields are normalized
          date: activity.date ? normalizeDate(activity.date) : undefined
        }))
      }));
    }
    
    // Normalize destination dates
    if (normalized.destinations) {
      normalized.destinations = normalized.destinations.map(dest => ({
        ...dest,
        arrivalDate: normalizeDate(dest.arrivalDate),
        departureDate: normalizeDate(dest.departureDate)
      }));
    }
    
    return normalized;
  }
}