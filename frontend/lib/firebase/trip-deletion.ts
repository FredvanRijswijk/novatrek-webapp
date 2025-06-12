import { 
  getFirestore, 
  doc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  DocumentReference
} from 'firebase/firestore';
import { getStorage, ref, listAll, deleteObject } from 'firebase/storage';
import { app } from './index';

const db = getFirestore(app);
const storage = getStorage(app);

interface DeletionResult {
  success: boolean;
  deletedCounts: {
    days: number;
    chatMessages: number;
    chatSessions: number;
    chatMemories: number;
    packingLists: number;
    flights: number;
    travelSegments: number;
    captures: number;
    tripShares: number;
    photos: number;
  };
  errors: string[];
}

/**
 * Comprehensively delete a trip and all related data
 * This ensures GDPR compliance and prevents orphaned data
 */
export async function deleteTrip(tripId: string, userId: string): Promise<DeletionResult> {
  const result: DeletionResult = {
    success: true,
    deletedCounts: {
      days: 0,
      chatMessages: 0,
      chatSessions: 0,
      chatMemories: 0,
      packingLists: 0,
      flights: 0,
      travelSegments: 0,
      captures: 0,
      tripShares: 0,
      photos: 0
    },
    errors: []
  };

  try {
    // Verify the trip belongs to the user before deletion
    const tripRef = doc(db, 'trips', tripId);
    const tripSnap = await getDocs(query(collection(db, 'trips'), where('__name__', '==', tripId)));
    
    if (tripSnap.empty) {
      throw new Error('Trip not found');
    }

    const tripData = tripSnap.docs[0].data();
    if (tripData.userId !== userId && 
        tripData.userRef?.id !== userId &&
        tripData.userRef?.path !== `users/${userId}`) {
      throw new Error('Unauthorized: You can only delete your own trips');
    }

    // Use batched writes for better performance
    const batch = writeBatch(db);

    // 1. Delete days subcollection
    try {
      const daysRef = collection(db, 'trips', tripId, 'days');
      const daysSnapshot = await getDocs(daysRef);
      daysSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        result.deletedCounts.days++;
      });
    } catch (error) {
      result.errors.push(`Error deleting days: ${error}`);
    }

    // 2. Delete chat messages
    try {
      // Delete by tripId (legacy)
      const chatMessagesQuery1 = query(collection(db, 'chat_messages'), where('tripId', '==', tripId));
      const chatMessagesSnapshot1 = await getDocs(chatMessagesQuery1);
      chatMessagesSnapshot1.forEach((doc) => {
        batch.delete(doc.ref);
        result.deletedCounts.chatMessages++;
      });

      // Delete by tripRef (new reference field)
      const chatMessagesQuery2 = query(collection(db, 'chat_messages'), where('tripRef', '==', tripRef));
      const chatMessagesSnapshot2 = await getDocs(chatMessagesQuery2);
      chatMessagesSnapshot2.forEach((doc) => {
        batch.delete(doc.ref);
        result.deletedCounts.chatMessages++;
      });
    } catch (error) {
      result.errors.push(`Error deleting chat messages: ${error}`);
    }

    // 3. Delete chat sessions
    try {
      const chatSessionsQuery1 = query(collection(db, 'chat_sessions'), where('tripId', '==', tripId));
      const chatSessionsSnapshot1 = await getDocs(chatSessionsQuery1);
      chatSessionsSnapshot1.forEach((doc) => {
        batch.delete(doc.ref);
        result.deletedCounts.chatSessions++;
      });

      const chatSessionsQuery2 = query(collection(db, 'chat_sessions'), where('tripRef', '==', tripRef));
      const chatSessionsSnapshot2 = await getDocs(chatSessionsQuery2);
      chatSessionsSnapshot2.forEach((doc) => {
        batch.delete(doc.ref);
        result.deletedCounts.chatSessions++;
      });
    } catch (error) {
      result.errors.push(`Error deleting chat sessions: ${error}`);
    }

    // 4. Delete chat memories
    try {
      const chatMemoriesQuery1 = query(collection(db, 'chat_memories'), where('tripId', '==', tripId));
      const chatMemoriesSnapshot1 = await getDocs(chatMemoriesQuery1);
      chatMemoriesSnapshot1.forEach((doc) => {
        batch.delete(doc.ref);
        result.deletedCounts.chatMemories++;
      });

      const chatMemoriesQuery2 = query(collection(db, 'chat_memories'), where('tripRef', '==', tripRef));
      const chatMemoriesSnapshot2 = await getDocs(chatMemoriesQuery2);
      chatMemoriesSnapshot2.forEach((doc) => {
        batch.delete(doc.ref);
        result.deletedCounts.chatMemories++;
      });
    } catch (error) {
      result.errors.push(`Error deleting chat memories: ${error}`);
    }

    // 5. Delete packing lists
    try {
      const packingQuery1 = query(collection(db, 'packing_lists'), where('tripId', '==', tripId));
      const packingSnapshot1 = await getDocs(packingQuery1);
      packingSnapshot1.forEach((doc) => {
        batch.delete(doc.ref);
        result.deletedCounts.packingLists++;
      });

      const packingQuery2 = query(collection(db, 'packing_lists'), where('tripRef', '==', tripRef));
      const packingSnapshot2 = await getDocs(packingQuery2);
      packingSnapshot2.forEach((doc) => {
        batch.delete(doc.ref);
        result.deletedCounts.packingLists++;
      });
    } catch (error) {
      result.errors.push(`Error deleting packing lists: ${error}`);
    }

    // 6. Delete flights
    try {
      const flightsQuery1 = query(collection(db, 'flights'), where('tripId', '==', tripId));
      const flightsSnapshot1 = await getDocs(flightsQuery1);
      flightsSnapshot1.forEach((doc) => {
        batch.delete(doc.ref);
        result.deletedCounts.flights++;
      });

      const flightsQuery2 = query(collection(db, 'flights'), where('tripRef', '==', tripRef));
      const flightsSnapshot2 = await getDocs(flightsQuery2);
      flightsSnapshot2.forEach((doc) => {
        batch.delete(doc.ref);
        result.deletedCounts.flights++;
      });
    } catch (error) {
      result.errors.push(`Error deleting flights: ${error}`);
    }

    // 7. Delete travel segments
    try {
      const segmentsQuery1 = query(collection(db, 'travel_segments'), where('tripId', '==', tripId));
      const segmentsSnapshot1 = await getDocs(segmentsQuery1);
      segmentsSnapshot1.forEach((doc) => {
        batch.delete(doc.ref);
        result.deletedCounts.travelSegments++;
      });

      const segmentsQuery2 = query(collection(db, 'travel_segments'), where('tripRef', '==', tripRef));
      const segmentsSnapshot2 = await getDocs(segmentsQuery2);
      segmentsSnapshot2.forEach((doc) => {
        batch.delete(doc.ref);
        result.deletedCounts.travelSegments++;
      });
    } catch (error) {
      result.errors.push(`Error deleting travel segments: ${error}`);
    }

    // 8. Delete captures assigned to this trip
    try {
      const capturesQuery = query(collection(db, 'captures'), where('assignedTo', '==', tripId));
      const capturesSnapshot = await getDocs(capturesQuery);
      capturesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        result.deletedCounts.captures++;
      });
    } catch (error) {
      result.errors.push(`Error deleting captures: ${error}`);
    }

    // 9. Delete trip shares
    try {
      const sharesQuery = query(collection(db, 'tripShares'), where('tripId', '==', tripId));
      const sharesSnapshot = await getDocs(sharesQuery);
      sharesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        result.deletedCounts.tripShares++;
      });
    } catch (error) {
      result.errors.push(`Error deleting trip shares: ${error}`);
    }

    // 10. Delete the trip document itself
    batch.delete(tripRef);

    // Commit all the batched deletes
    await batch.commit();

    // 11. Delete photos from Firebase Storage
    try {
      const photosRef = ref(storage, `trips/${tripId}/photos`);
      const photosList = await listAll(photosRef);
      
      const deletePromises = photosList.items.map(async (photoRef) => {
        await deleteObject(photoRef);
        result.deletedCounts.photos++;
      });
      
      await Promise.all(deletePromises);
    } catch (error) {
      // Storage path might not exist, which is fine
      if (error.code !== 'storage/object-not-found') {
        result.errors.push(`Error deleting photos: ${error}`);
      }
    }

    // Log the deletion for audit purposes
    console.log(`Trip ${tripId} deleted by user ${userId}`, result.deletedCounts);

  } catch (error) {
    result.success = false;
    result.errors.push(`Fatal error: ${error.message || error}`);
    console.error('Trip deletion failed:', error);
  }

  return result;
}

/**
 * Get a summary of all data that will be deleted for a trip
 * Useful for showing users what will be deleted before confirmation
 */
export async function getTripDeletionSummary(tripId: string, userId: string): Promise<DeletionResult['deletedCounts']> {
  const counts = {
    days: 0,
    chatMessages: 0,
    chatSessions: 0,
    chatMemories: 0,
    packingLists: 0,
    flights: 0,
    travelSegments: 0,
    captures: 0,
    tripShares: 0,
    photos: 0
  };

  try {
    const tripRef = doc(db, 'trips', tripId);

    // Count days
    const daysSnapshot = await getDocs(collection(db, 'trips', tripId, 'days'));
    counts.days = daysSnapshot.size;

    // Count chat messages
    const chatMessages1 = await getDocs(query(collection(db, 'chat_messages'), where('tripId', '==', tripId)));
    const chatMessages2 = await getDocs(query(collection(db, 'chat_messages'), where('tripRef', '==', tripRef)));
    counts.chatMessages = chatMessages1.size + chatMessages2.size;

    // Count chat sessions
    const chatSessions1 = await getDocs(query(collection(db, 'chat_sessions'), where('tripId', '==', tripId)));
    const chatSessions2 = await getDocs(query(collection(db, 'chat_sessions'), where('tripRef', '==', tripRef)));
    counts.chatSessions = chatSessions1.size + chatSessions2.size;

    // Count chat memories
    const chatMemories1 = await getDocs(query(collection(db, 'chat_memories'), where('tripId', '==', tripId)));
    const chatMemories2 = await getDocs(query(collection(db, 'chat_memories'), where('tripRef', '==', tripRef)));
    counts.chatMemories = chatMemories1.size + chatMemories2.size;

    // Count packing lists
    const packing1 = await getDocs(query(collection(db, 'packing_lists'), where('tripId', '==', tripId)));
    const packing2 = await getDocs(query(collection(db, 'packing_lists'), where('tripRef', '==', tripRef)));
    counts.packingLists = packing1.size + packing2.size;

    // Count flights
    const flights1 = await getDocs(query(collection(db, 'flights'), where('tripId', '==', tripId)));
    const flights2 = await getDocs(query(collection(db, 'flights'), where('tripRef', '==', tripRef)));
    counts.flights = flights1.size + flights2.size;

    // Count travel segments
    const segments1 = await getDocs(query(collection(db, 'travel_segments'), where('tripId', '==', tripId)));
    const segments2 = await getDocs(query(collection(db, 'travel_segments'), where('tripRef', '==', tripRef)));
    counts.travelSegments = segments1.size + segments2.size;

    // Count captures
    const captures = await getDocs(query(collection(db, 'captures'), where('assignedTo', '==', tripId)));
    counts.captures = captures.size;

    // Count trip shares
    const shares = await getDocs(query(collection(db, 'tripShares'), where('tripId', '==', tripId)));
    counts.tripShares = shares.size;

    // Count photos
    try {
      const photosRef = ref(storage, `trips/${tripId}/photos`);
      const photosList = await listAll(photosRef);
      counts.photos = photosList.items.length;
    } catch (error) {
      // Photos might not exist
      counts.photos = 0;
    }

  } catch (error) {
    console.error('Error getting deletion summary:', error);
  }

  return counts;
}