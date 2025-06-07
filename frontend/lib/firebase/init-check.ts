import { app, db } from './config'

// Helper to ensure Firebase is initialized before making Firestore calls
export const ensureFirebaseInit = async (): Promise<void> => {
  // Check if Firebase app is initialized
  if (!app) {
    throw new Error('Firebase app not initialized')
  }
  
  // Check if Firestore is ready
  if (!db) {
    throw new Error('Firestore not initialized')
  }
  
  // Add a small delay to ensure everything is ready
  await new Promise(resolve => setTimeout(resolve, 50))
}

// Wrapper function for Firestore operations with retry logic
export const withFirebaseRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 500
): Promise<T> => {
  let lastError: any
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await ensureFirebaseInit()
      return await operation()
    } catch (error: any) {
      lastError = error
      console.error(`Firebase operation failed (attempt ${i + 1}/${maxRetries}):`, error)
      
      // If it's a permission error and we've already retried, throw immediately
      if (error?.code === 'permission-denied' && i > 0) {
        throw error
      }
      
      // Wait before retrying
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
  
  throw lastError
}