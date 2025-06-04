// Firebase Configuration
export { auth, db, app } from './config'
export type { FirebaseConfig } from './config'

// Authentication
export * from './auth'

// Firestore
export * from './firestore'

// Context
export { FirebaseProvider, useFirebase } from './context'