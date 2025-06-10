import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  DocumentReference,
  Timestamp
} from 'firebase/firestore'
import { db } from './config'
import { TravelPreferences, ShareablePreferences, getShareablePreferences } from '@/types/preferences'

// Collection reference
const PREFERENCES_COLLECTION = 'travelPreferences'

// Get user's travel preferences
export async function getUserPreferences(userId: string): Promise<TravelPreferences | null> {
  try {
    const prefsRef = doc(db, PREFERENCES_COLLECTION, userId)
    const prefsSnap = await getDoc(prefsRef)
    
    if (!prefsSnap.exists()) {
      return null
    }
    
    const data = prefsSnap.data()
    return {
      id: prefsSnap.id,
      userId,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastUsedAt: data.lastUsedAt?.toDate(),
    } as TravelPreferences
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return null
  }
}

// Create or update user preferences
export async function saveUserPreferences(
  userId: string, 
  preferences: Partial<TravelPreferences>
): Promise<void> {
  try {
    const prefsRef = doc(db, PREFERENCES_COLLECTION, userId)
    const existingPrefs = await getDoc(prefsRef)
    
    // Remove id field if it exists
    const { id, ...prefsToSave } = preferences as any
    
    if (existingPrefs.exists()) {
      // Update existing preferences
      await updateDoc(prefsRef, {
        ...prefsToSave,
        updatedAt: serverTimestamp(),
        lastUsedAt: serverTimestamp(),
      })
    } else {
      // Create new preferences
      await setDoc(prefsRef, {
        ...getDefaultPreferences(),
        ...prefsToSave,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  } catch (error) {
    console.error('Error saving user preferences:', error)
    throw error
  }
}

// Get shareable preferences for group travel
export async function getShareableUserPreferences(
  userId: string,
  includebudget = false
): Promise<ShareablePreferences | null> {
  const fullPrefs = await getUserPreferences(userId)
  
  if (!fullPrefs || !fullPrefs.shareWithGroups) {
    return null
  }
  
  return getShareablePreferences(fullPrefs, includebudget)
}

// Get multiple users' shareable preferences (for group travel)
export async function getGroupMemberPreferences(
  userIds: string[],
  includebudget = false
): Promise<Map<string, ShareablePreferences>> {
  const preferencesMap = new Map<string, ShareablePreferences>()
  
  // Fetch all preferences in parallel
  const promises = userIds.map(async (userId) => {
    const prefs = await getShareableUserPreferences(userId, includebudget)
    if (prefs) {
      preferencesMap.set(userId, prefs)
    }
  })
  
  await Promise.all(promises)
  return preferencesMap
}

// Get anonymous preferences for a group
export async function getAnonymousGroupPreferences(
  userIds: string[],
  includebudget = false
): Promise<ShareablePreferences[]> {
  const prefsMap = await getGroupMemberPreferences(userIds, includebudget)
  return Array.from(prefsMap.values())
}

// Default preferences for new users
function getDefaultPreferences(): Partial<TravelPreferences> {
  return {
    travelStyle: [],
    pacePreference: 'moderate',
    accommodationTypes: ['hotel'],
    accommodationAmenities: [],
    roomPreferences: ['private-bathroom'],
    activityTypes: ['sightseeing'],
    interests: [],
    fitnessLevel: 'moderate',
    dietaryRestrictions: [],
    cuisinePreferences: [],
    diningStyle: ['local-cuisine', 'casual'],
    budgetRange: {
      min: 0,
      max: 0,
      currency: 'USD',
      isPrivate: true,
    },
    spendingPriorities: ['experiences', 'food'],
    transportPreferences: ['walking', 'public-transport'],
    mobilityNeeds: [],
    languages: ['en'],
    travelCompanions: 'solo',
    shareWithGroups: true,
    anonymousGroupSharing: true,
  }
}

// Update last used timestamp when preferences are applied to a trip
export async function markPreferencesAsUsed(userId: string): Promise<void> {
  try {
    const prefsRef = doc(db, PREFERENCES_COLLECTION, userId)
    // Check if document exists first
    const prefsSnap = await getDoc(prefsRef)
    
    if (prefsSnap.exists()) {
      await updateDoc(prefsRef, {
        lastUsedAt: serverTimestamp(),
      })
    } else {
      // If preferences don't exist, don't try to update
      console.warn('Preferences document does not exist for user:', userId)
    }
  } catch (error) {
    console.error('Error updating last used timestamp:', error)
  }
}

// Check if user has set up preferences
export async function hasUserSetupPreferences(userId: string): Promise<boolean> {
  const prefs = await getUserPreferences(userId)
  if (!prefs) return false
  
  // Check if user has filled out basic preferences
  return (
    prefs.travelStyle.length > 0 &&
    prefs.interests.length > 0 &&
    prefs.budgetRange.min > 0
  )
}