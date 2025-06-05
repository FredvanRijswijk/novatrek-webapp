import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminDb: ReturnType<typeof getFirestore> | null = null;

// Only initialize if service account key is provided
if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    
    // Validate service account has required fields
    if (serviceAccount.private_key && serviceAccount.client_email && serviceAccount.project_id) {
      initializeApp({
        credential: cert(serviceAccount),
      });
      adminDb = getFirestore();
    } else {
      console.warn('Firebase Admin: Invalid service account configuration');
    }
  } catch (error) {
    console.warn('Firebase Admin: Failed to initialize:', error);
  }
}

export { adminDb };