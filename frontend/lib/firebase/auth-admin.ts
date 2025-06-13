import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from './admin';

/**
 * Verify Firebase ID token and return decoded token
 */
export async function verifyToken(token: string) {
  try {
    await initAdmin();
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user has admin claims
    const isAdmin = decodedToken.admin === true || decodedToken.role === 'admin';
    
    return {
      ...decodedToken,
      admin: isAdmin,
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Set custom claims for a user
 */
export async function setCustomClaims(uid: string, claims: Record<string, any>) {
  try {
    await initAdmin();
    const auth = getAuth();
    await auth.setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Error setting custom claims:', error);
    return false;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  try {
    await initAdmin();
    const auth = getAuth();
    return await auth.getUserByEmail(email);
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}