import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  UserCredential,
} from 'firebase/auth'
import { auth, db } from './config'
import { doc, setDoc, getDoc } from 'firebase/firestore'

// Helper function to create/update user document
const createOrUpdateUserDocument = async (user: User) => {
  if (!user) return;
  
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    // Create new user document
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: new Date(),
      updatedAt: new Date(),
      subscription: null, // Will be populated when user subscribes
    });
  } else {
    // Update existing user document
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      updatedAt: new Date(),
    }, { merge: true });
  }
}

// Email/Password Authentication
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName })
  }
  
  // Create user document in Firestore
  await createOrUpdateUserDocument(userCredential.user)
  
  return userCredential
}

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  
  // Create or update user document in Firestore (in case it doesn't exist)
  await createOrUpdateUserDocument(userCredential.user)
  
  return userCredential
}

// Google Authentication
export const signInWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider()
  const userCredential = await signInWithPopup(auth, provider)
  
  // Create or update user document in Firestore
  await createOrUpdateUserDocument(userCredential.user)
  
  return userCredential
}

// Sign Out
export const signOutUser = async (): Promise<void> => {
  return await signOut(auth)
}

// Password Reset
export const resetPassword = async (email: string): Promise<void> => {
  return await sendPasswordResetEmail(auth, email)
}

// Email Verification
export const sendVerificationEmail = async (user: User): Promise<void> => {
  return await sendEmailVerification(user)
}

// Update User Profile
export const updateUserProfile = async (
  user: User,
  profile: { displayName?: string | null; photoURL?: string | null }
): Promise<void> => {
  return await updateProfile(user, profile)
}

// Auth State Helpers
export const getCurrentUser = (): User | null => {
  return auth.currentUser
}

export const isEmailVerified = (): boolean => {
  const user = getCurrentUser()
  return user ? user.emailVerified : false
}

// Auth Error Handler
export const getAuthErrorMessage = (error: any): string => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No user found with this email address.'
    case 'auth/wrong-password':
      return 'Incorrect password.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/invalid-email':
      return 'Invalid email address.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.'
    default:
      return error.message || 'An error occurred during authentication.'
  }
}