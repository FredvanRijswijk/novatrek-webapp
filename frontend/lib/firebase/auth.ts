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
import { auth } from './config'

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
  
  return userCredential
}

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return await signInWithEmailAndPassword(auth, email, password)
}

// Google Authentication
export const signInWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider()
  return await signInWithPopup(auth, provider)
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