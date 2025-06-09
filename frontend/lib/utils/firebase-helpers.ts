import { Timestamp, DocumentReference } from 'firebase/firestore';

/**
 * Remove undefined values from an object before sending to Firestore
 * Firestore doesn't accept undefined values
 */
export function cleanFirestoreData<T extends Record<string, any>>(
  data: T, 
  seen = new WeakSet()
): T {
  // Check for circular references
  if (seen.has(data)) {
    return data;
  }
  
  const cleaned = { ...data };
  seen.add(cleaned);
  
  Object.keys(cleaned).forEach(key => {
    const value = cleaned[key];
    
    if (value === undefined) {
      delete cleaned[key];
    } else if (value instanceof Date) {
      // Keep Date objects as-is - Firestore SDK will handle conversion
      cleaned[key] = value;
    } else if (value instanceof DocumentReference) {
      // Keep DocumentReference objects as-is
      cleaned[key] = value;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Skip DocumentReference and other Firestore objects
      if (value.constructor && (
        value.constructor.name === 'DocumentReference' ||
        value.constructor.name === 'Timestamp' ||
        value.constructor.name === 'GeoPoint'
      )) {
        cleaned[key] = value;
      } else if (!seen.has(value)) {
        // Recursively clean nested objects
        cleaned[key] = cleanFirestoreData(value, seen);
      }
    } else if (Array.isArray(value)) {
      // Clean arrays
      cleaned[key] = value.map((item: any) => {
        if (typeof item === 'object' && item !== null && !seen.has(item)) {
          if (item instanceof Date || item instanceof DocumentReference) {
            return item;
          }
          return cleanFirestoreData(item, seen);
        }
        return item;
      });
    }
  });
  
  return cleaned;
}

/**
 * Convert Firestore Timestamps to JavaScript Dates
 */
export function convertTimestampsToDates<T extends Record<string, any>>(
  data: T, 
  seen = new WeakSet()
): T {
  // Check for circular references
  if (seen.has(data)) {
    return data;
  }
  
  const converted = { ...data };
  seen.add(converted);
  
  Object.keys(converted).forEach(key => {
    const value = converted[key];
    
    if (value instanceof Timestamp) {
      // Convert Timestamp to Date
      converted[key] = value.toDate();
    } else if (value instanceof Date) {
      // Keep Date objects as-is
      converted[key] = value;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Skip DocumentReference objects to avoid circular references
      if (value instanceof DocumentReference || 
          (value.constructor && value.constructor.name === 'DocumentReference')) {
        // Keep DocumentReference as-is
        converted[key] = value;
      } else if (!seen.has(value)) {
        // Recursively convert nested objects
        converted[key] = convertTimestampsToDates(value, seen);
      }
    } else if (Array.isArray(value)) {
      // Convert arrays
      converted[key] = value.map((item: any) => {
        if (typeof item === 'object' && item !== null && !seen.has(item)) {
          return convertTimestampsToDates(item, seen);
        }
        return item;
      });
    }
  });
  
  return converted;
}