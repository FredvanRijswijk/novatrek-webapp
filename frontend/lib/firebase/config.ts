import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

// Development Firebase configuration
const devConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_DEV_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_DEV_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_DEV_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_DEV_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_DEV_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_DEV_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_DEV_MEASUREMENT_ID,
}

// Production Firebase configuration
const prodConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_PROD_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_PROD_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROD_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_PROD_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_PROD_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_PROD_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_PROD_MEASUREMENT_ID,
}

// Determine which config to use based on environment
const getFirebaseConfig = (): FirebaseConfig => {
  const environment = process.env.NODE_ENV || 'development'
  const firebaseEnv = process.env.NEXT_PUBLIC_FIREBASE_ENV || 'dev'
  
  if (environment === 'production' || firebaseEnv === 'prod') {
    return prodConfig
  }
  
  return devConfig
}

// Initialize Firebase
let app: FirebaseApp
let auth: Auth
let db: Firestore

const initializeFirebase = () => {
  if (!app) {
    const existingApps = getApps()
    if (existingApps.length > 0) {
      // Use existing app
      app = existingApps[0]
    } else {
      // Initialize new app
      const config = getFirebaseConfig()
      app = initializeApp(config)
    }
    auth = getAuth(app)
    db = getFirestore(app)
  }
}

// Initialize Firebase (works for both client and server in Next.js)
initializeFirebase()

export { app, auth, db }
export default getFirebaseConfig