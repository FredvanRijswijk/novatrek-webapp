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