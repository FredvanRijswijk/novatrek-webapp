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
    
    // Try multiple paths for the service account file
    const possiblePaths = [
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILE,
      'novatrek-dev-firebase-adminsdk.json',
      './novatrek-dev-firebase-adminsdk.json',
      join(process.cwd(), 'novatrek-dev-firebase-adminsdk.json')
    ].filter(Boolean);
    
    for (const path of possiblePaths) {
      try {
        const filePath = path.startsWith('/') ? path : join(process.cwd(), path);
        console.log('Attempting to read service account from:', filePath);
        const fileContent = readFileSync(filePath, 'utf8');
        serviceAccount = JSON.parse(fileContent);
        console.log('Service account loaded from file:', filePath);
        break;
      } catch (e) {
        console.log('Failed to read from:', path);
      }
    }
    
    // If not found in files, try environment variable
    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
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
    adminDb = initializeAdmin();
    if (!adminDb) {
      throw new Error('Failed to initialize Firebase Admin SDK - check service account configuration');
    }
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

// Export functions to get admin instances
export function getAdminAuth() {
  if (!getApps().length) {
    initializeAdmin();
    if (!getApps().length) {
      throw new Error('Failed to initialize Firebase Admin SDK for auth');
    }
  }
  return getAuth();
}

export { initializeAdmin };
export const auth = getAdminAuth();