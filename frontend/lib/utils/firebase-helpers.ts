import { Timestamp } from 'firebase/firestore';

/**
 * Remove undefined values from an object before sending to Firestore
 * Firestore doesn't accept undefined values
 */
export function cleanFirestoreData<T extends Record<string, any>>(data: T): T {
  const cleaned = { ...data };
  
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    } else if (cleaned[key] !== null && typeof cleaned[key] === 'object' && !Array.isArray(cleaned[key])) {
      // Recursively clean nested objects
      cleaned[key] = cleanFirestoreData(cleaned[key]);
    } else if (Array.isArray(cleaned[key])) {
      // Clean arrays
      cleaned[key] = cleaned[key].map((item: any) => 
        typeof item === 'object' && item !== null ? cleanFirestoreData(item) : item
      );
    }
  });
  
  return cleaned;
}

/**
 * Convert Firestore Timestamps to JavaScript Dates
 */
export function convertTimestampsToDates<T extends Record<string, any>>(data: T): T {
  const converted = { ...data };
  
  Object.keys(converted).forEach(key => {
    const value = converted[key];
    
    if (value instanceof Timestamp) {
      // Convert Timestamp to Date
      converted[key] = value.toDate();
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively convert nested objects
      converted[key] = convertTimestampsToDates(value);
    } else if (Array.isArray(value)) {
      // Convert arrays
      converted[key] = value.map((item: any) => 
        typeof item === 'object' && item !== null ? convertTimestampsToDates(item) : item
      );
    }
  });
  
  return converted;
}