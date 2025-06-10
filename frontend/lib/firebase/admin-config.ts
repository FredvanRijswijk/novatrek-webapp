import * as admin from 'firebase-admin';

export function getServiceAccount() {
  // Production: Use environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString()
      );
    } catch (error) {
      console.error('Failed to parse service account from env:', error);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY');
    }
  }
  
  // Development: Use local file
  if (process.env.NODE_ENV === 'development') {
    try {
      // Try production file first (for testing prod locally)
      if (process.env.USE_PROD_FIREBASE === 'true') {
        return require('../../novatrek-app-firebase-adminsdk-prod.json');
      }
      // Default to dev file
      return require('../../novatrek-app-firebase-adminsdk.json');
    } catch (error) {
      console.error('Failed to load local service account file:', error);
      throw new Error('Firebase Admin SDK credentials not found. Please add the service account JSON file.');
    }
  }
  
  // Fallback error
  throw new Error('No Firebase Admin credentials configured');
}

export function getFirebaseAdminConfig() {
  const serviceAccount = getServiceAccount();
  
  return {
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  };
}