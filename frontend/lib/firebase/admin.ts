import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { join } from 'path';

let adminDb: ReturnType<typeof getFirestore> | null = null;
let initialized = false;

function initializeAdmin() {
  if (initialized || getApps().length > 0) {
    return adminDb;
  }

  console.log('Initializing Firebase Admin SDK...');
  console.log('FIREBASE_SERVICE_ACCOUNT_KEY_FILE:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILE);
  console.log('Current working directory:', process.cwd());
  
  try {
    let serviceAccount;
    
    // First try to read from file if specified
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILE) {
      const filePath = join(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILE);
      console.log('Attempting to read service account from:', filePath);
      const fileContent = readFileSync(filePath, 'utf8');
      serviceAccount = JSON.parse(fileContent);
      console.log('Service account loaded from file');
    } 
    // Otherwise try to parse from environment variable
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      console.log('Service account loaded from env variable');
    }
    
    // Validate service account has required fields
    if (serviceAccount && serviceAccount.private_key && serviceAccount.client_email && serviceAccount.project_id) {
      console.log('Service account validated, initializing app...');
      initializeApp({
        credential: cert(serviceAccount),
      });
      adminDb = getFirestore();
      initialized = true;
      console.log('Firebase Admin SDK initialized successfully');
    } else {
      console.warn('Firebase Admin: Invalid service account - missing required fields');
      if (serviceAccount) {
        console.warn('Has private_key:', !!serviceAccount.private_key);
        console.warn('Has client_email:', !!serviceAccount.client_email);
        console.warn('Has project_id:', !!serviceAccount.project_id);
      }
    }
  } catch (error) {
    console.error('Firebase Admin: Failed to initialize:', error);
  }
  
  return adminDb;
}

// Lazy getter for adminDb
export function getAdminDb() {
  if (!adminDb) {
    return initializeAdmin();
  }
  return adminDb;
}

export { adminDb };

export async function verifyIdToken(idToken: string) {
  if (!getApps().length) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw error;
  }
}