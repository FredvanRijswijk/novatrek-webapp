import { 
  getFirestore, 
  doc, 
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { app } from './index';
import { normalizeDate } from '@/lib/utils/date-helpers';

const db = getFirestore(app);

/**
 * Clean up duplicate trip days and ensure proper date ordering
 */
export async function cleanupTripDays(tripId: string, userId: string) {
  try {
    // Get the trip document
    const tripRef = doc(db, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);
    
    if (!tripSnap.exists()) {
      throw new Error('Trip not found');
    }
    
    const tripData = tripSnap.data();
    
    // Verify ownership
    if (tripData.userId !== userId && 
        tripData.userRef?.id !== userId &&
        tripData.userRef?.path !== `users/${userId}`) {
      throw new Error('Unauthorized');
    }
    
    // Get current itinerary
    const itinerary = tripData.itinerary || [];
    
    // Convert all dates to consistent format and remove duplicates
    const dateMap = new Map();
    
    itinerary.forEach(day => {
      const dateStr = normalizeDate(day.date);
      if (!dateStr) return; // Skip invalid dates
      
      // Keep the day with more activities or the newer one
      if (!dateMap.has(dateStr) || 
          (day.activities?.length || 0) > (dateMap.get(dateStr).activities?.length || 0)) {
        dateMap.set(dateStr, {
          ...day,
          date: new Date(dateStr + 'T00:00:00'), // Normalize date format
          dateStr
        });
      }
    });
    
    // Convert back to array and sort by date
    const cleanedItinerary = Array.from(dateMap.values())
      .sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime())
      .map((day, index) => ({
        ...day,
        dayNumber: index + 1,
        id: day.id || `day-${index + 1}-${Date.now()}`
      }));
    
    // Remove the temporary dateStr field
    cleanedItinerary.forEach(day => delete day.dateStr);
    
    // Update the trip
    await updateDoc(tripRef, {
      itinerary: cleanedItinerary,
      updatedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      originalCount: itinerary.length,
      cleanedCount: cleanedItinerary.length,
      removedDuplicates: itinerary.length - cleanedItinerary.length,
      dates: cleanedItinerary.map(d => d.date)
    };
    
  } catch (error) {
    console.error('Cleanup error:', error);
    throw error;
  }
}