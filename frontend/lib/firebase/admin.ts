import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { join } from 'path';

let adminDb: ReturnType<typeof getFirestore> | null = null;

function initializeAdmin() {
  // Check if app already exists
  if (getApps().length > 0) {
    // App exists, just get the Firestore instance
    if (!adminDb) {
      adminDb = getFirestore();
    }
    return adminDb;
  }

  console.log('Initializing Firebase Admin SDK...');
  console.log('FIREBASE_SERVICE_ACCOUNT_KEY_FILE:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILE);
  console.log('Current working directory:', process.cwd());
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  try {
    let serviceAccount;
    
    // Try multiple paths for the service account file
    const isProduction = process.env.NODE_ENV === 'production' || process.env.USE_PROD_FIREBASE === 'true';
    const fileName = isProduction 
      ? 'novatrek-app-firebase-adminsdk-prod.json'
      : 'novatrek-app-firebase-adminsdk.json';
    
    const possiblePaths = [
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILE,
      fileName,
      `./${fileName}`,
      join(process.cwd(), fileName),
      join(process.cwd(), 'frontend', fileName),
      // Fallback to old filenames
      'novatrek-dev-firebase-adminsdk.json',
      join(process.cwd(), 'novatrek-dev-firebase-adminsdk.json')
    ].filter(Boolean);
    
    for (const path of possiblePaths) {
      try {
        const filePath = path.startsWith('/') ? path : join(process.cwd(), path);
        console.log('Attempting to read service account from:', filePath);
        const fileContent = readFileSync(filePath, 'utf8');
        serviceAccount = JSON.parse(fileContent);
        console.log('Service account loaded from file:', filePath);
        console.log('Project ID from service account:', serviceAccount.project_id);
        break;
      } catch (e) {
        console.log('Failed to read from:', path, 'Error:', e.message);
      }
    }
    
    // If not found in files, try environment variable
    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        // Try to parse as base64 first
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString();
        serviceAccount = JSON.parse(decoded);
        console.log('Service account loaded from base64 env variable');
      } catch (e) {
        // If base64 fails, try direct JSON parse
        try {
          serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
          console.log('Service account loaded from JSON env variable');
        } catch (e2) {
          console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e2);
        }
      }
    }
    
    // Validate service account has required fields
    if (serviceAccount && serviceAccount.private_key && serviceAccount.client_email && serviceAccount.project_id) {
      console.log('Service account validated, initializing app...');
      try {
        initializeApp({
          credential: cert(serviceAccount),
        });
        adminDb = getFirestore();
        console.log('Firebase Admin SDK initialized successfully');
      } catch (initError) {
        console.error('Failed to initialize Firebase Admin app:', initError);
        adminDb = null;
      }
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
  }
  return getAuth();
}

export { initializeAdmin };
export { initializeAdmin as initAdmin };

// Create a lazy auth object that initializes on first use
export const auth = {
  verifyIdToken: async (idToken: string) => {
    const adminAuth = getAdminAuth();
    return adminAuth.verifyIdToken(idToken);
  }
};